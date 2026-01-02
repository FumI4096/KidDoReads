from flask import Blueprint, request, jsonify
from openai import OpenAI
import time
import os
from botocore.exceptions import ClientError
from modules.utils import get_db, get_tts_key, tts_prompt, get_s3_client, get_spaces_url, get_speechgen_key, get_speechgen_email
from io import BytesIO
import requests

tts_bp = Blueprint('tts_bp', __name__)

@tts_bp.route('/create-tts', methods=["POST"])
def create_text_to_speech():
    try:
        with get_db() as db:
            content_id = request.form.get('content_id')
            statusCreatedTtsId, messageCreatedTtsId, new_id = db.create_tts_record(content_id)
            if not statusCreatedTtsId:
                return jsonify({"status": False, "message": f"Failed to create TTS record: {messageCreatedTtsId}"})

            print("New TTS ID:", new_id)
            statusContentUpdated, messageContentUpdated = db.update_tts_id_in_content_after_creation(content_id, new_id)

            if not statusContentUpdated:
                return jsonify({"status": False, "message": f"TTS created but content update failed: {messageContentUpdated}"})
            
            return jsonify({
                "status": True, 
                "message": "TTS record created and content updated successfully",
                "ttsId": new_id
            })         
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@tts_bp.route('/api/generate-speech', methods=["POST"])
def generate_speech():    
    try:
        client = OpenAI(api_key=get_tts_key())
        data = request.json
        text = data.get('text')
        ttsId = data.get('id')
        content_type = data.get('content_type')
        voice_type = data.get('voice') 
        
        voice = "onyx" if voice_type == 1 else "nova"
        
        final_prompt = tts_prompt(content_type)
        
        response = client.audio.speech.create(
            model="gpt-4o-mini-tts-2025-12-15",
            voice=voice, 
            input=text,
            instructions=final_prompt
        )
        
        # Generate unique filename
        timestamp = int(time.time() * 1000)
        filename = f"speech_{hash(text+ttsId)}_{timestamp}.mp3"
        if os.getenv('FLASK_ENV') == 'development':
            # Save locally for testing
            local_path = os.path.join('static', 'upload_audio', filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)
            
            with open(local_path, 'wb') as f:
                f.write(response.read())
            
            audio_url = f'/static/upload_audio/{filename}'
        else:
            # Upload to DigitalOcean Spaces
            s3_client = get_s3_client()
            bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')
            
            # Convert response to bytes
            audio_bytes = BytesIO(response.read())
            audio_bytes.seek(0)
            
            # Upload to Spaces with public-read ACL
            s3_client.upload_fileobj(
                audio_bytes,
                bucket_name,
                f'audio/{filename}',
                ExtraArgs={
                    'ACL': 'public-read',
                    'ContentType': 'audio/mpeg'
                }
            )
            
            # Generate public URL
            audio_url = get_spaces_url(filename, 'audio')
        
        return jsonify({
            'status': True,
            'message': 'Speech generated successfully',
            'audio_url': audio_url
        })
    except ClientError as e:
        return jsonify({
            'status': False, 
            'message': f'Spaces upload error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'status': False, 
            'message': str(e)
        }), 500
        
@tts_bp.route('/api/generate-speech-kid', methods=["POST"])
def generate_speech_kid():
    try:
        data = request.json
        text = data.get('text')
        ttsId = data.get('id')
        content_type = data.get('content_type')

        if not text:
            return jsonify({
                'status': False,
                'message': 'Text is required'
            }), 400

        # --- SYSTEM-DEFINED KID VOICE DEFAULTS ---
        voice = "Ivy"
        speed = 1.0
        pitch = 0
        
        if content_type in [1, 2]:
            pitch = 1.0 
        else:
            pitch = 1.2 
        
        print(get_speechgen_key())
        payload = {
            'token': get_speechgen_key(),  
            'email': get_speechgen_email(),  # Strip any whitespace
            'voice': voice,
            'text': text,
            'format': 'mp3',
            'speed': str(speed), 
            'pitch': str(pitch), 
            'emotion': 'good'  
        }

        # Choose endpoint based on text length
        if len(text) <= 2000:
            url = "https://speechgen.io/index.php?r=api/text"
        else:
            url = "https://speechgen.io/index.php?r=api/longtext"

        response = requests.post(
            url,
            data=payload,  # Use 'data' for form encoding
            timeout=30
        )

        response.raise_for_status()
        result = response.json()

        print(f"SpeechGen Response: {result}")  # Debug log

        # Check if request was successful
        if result.get('status') != 1:
            error_msg = result.get('error', 'Unknown error')
            raise Exception(f"SpeechGen error: {error_msg}")

        audio_url_remote = result.get("file")
        if not audio_url_remote:
            raise Exception("SpeechGen did not return an audio file")

        # --- FILENAME (MATCHES YOUR EXISTING LOGIC) ---
        timestamp = int(time.time() * 1000)
        filename = f"speech_{hash(text + ttsId)}_{timestamp}.mp3"

        if os.getenv('FLASK_ENV') == 'development':
            # --- SAVE LOCALLY ---
            local_path = os.path.join('static', 'upload_audio', filename)
            os.makedirs(os.path.dirname(local_path), exist_ok=True)

            audio_response = requests.get(audio_url_remote, stream=True)
            audio_response.raise_for_status()

            with open(local_path, 'wb') as f:
                for chunk in audio_response.iter_content(chunk_size=8192):
                    f.write(chunk)

            audio_url = f'/static/upload_audio/{filename}'

        else:
            # --- UPLOAD TO DIGITALOCEAN SPACES ---
            s3_client = get_s3_client()
            bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')

            audio_response = requests.get(audio_url_remote, stream=True)
            audio_response.raise_for_status()

            audio_bytes = BytesIO(audio_response.content)
            audio_bytes.seek(0)

            s3_client.upload_fileobj(
                audio_bytes,
                bucket_name,
                f'audio/{filename}',
                ExtraArgs={
                    'ACL': 'public-read',
                    'ContentType': 'audio/mpeg'
                }
            )

            audio_url = get_spaces_url(filename, 'audio')

        return jsonify({
            'status': True,
            'message': 'Kid speech generated successfully',
            'audio_url': audio_url
        })

    except requests.exceptions.RequestException as e:
        return jsonify({
            'status': False,
            'message': f'SpeechGen API error: {str(e)}'
        }), 500
    except ClientError as e:
        return jsonify({
            'status': False,
            'message': f'Spaces upload error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'status': False,
            'message': str(e)
        }), 500

@tts_bp.route('/api/delete-speech', methods=['DELETE'])
def delete_speech():
    try:
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({
                'status': False, 'message': 'No filename provided'
            }), 400
        
        # Validate filename
        if not filename.endswith('.mp3') or '/' in filename or '\\' in filename:
            return jsonify({
                'status': False,
                'message': 'Invalid filename'
            }), 400
        
        # Delete from Spaces
        s3_client = get_s3_client()
        bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')
        
        s3_client.delete_object(
            Bucket=bucket_name,
            Key=f'audio/{filename}'
        )
        
        return jsonify({
            'status': True, 
            'message': 'Speech deleted successfully'
        })
            
    except ClientError as e:
        return jsonify({
            'status': False,
            'message': f'Spaces delete error: {str(e)}'
        }), 500
    except Exception as e:
        return jsonify({
            'status': False,
            'message': f'Error deleting speech: {str(e)}'
        }), 500
    
@tts_bp.route('/update-speech', methods=["POST"])
def update_speech():
    try:
        with get_db() as db:  
            tts_id = request.form.get('ttsId')
            ttsAudios = request.form.get('ttsAudios')
            
            print("Audios", ttsAudios)
            
            status, message = db.update_tts_record(tts_id, ttsAudios)
            
            if status:
                return jsonify({'status': True, 'message': message})
            else:
                return jsonify({'status': False, 'message': message})    
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})