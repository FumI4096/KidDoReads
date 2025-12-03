from flask import Blueprint, request, jsonify
from openai import OpenAI
import time
import os
from botocore.exceptions import ClientError
from modules.utils import get_db, get_tts_key, tts_prompt, get_s3_client, get_spaces_url
from io import BytesIO

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
        
        final_prompt = tts_prompt(content_type)
        
        response = client.audio.speech.create(
            model="gpt-4o-mini-tts",
            voice="onyx", 
            input=text,
            instructions=final_prompt
        )
        
        # Generate unique filename
        timestamp = int(time.time() * 1000)
        filename = f"speech_{hash(text+ttsId)}_{timestamp}.mp3"
        
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