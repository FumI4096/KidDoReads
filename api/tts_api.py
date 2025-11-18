from flask import Blueprint, request, jsonify
from openai import OpenAI
import time
import os
from modules.utils import get_db, get_tts_key, get_upload_audio, tts_prompt

tts_bp = Blueprint('tts_bp', __name__)

@tts_bp.route('/create-tts', methods=["POST"])
def create_text_to_speech():
    try:
        db = get_db()
        content_id = request.form.get('content_id')
        
        statusCreatedTtsId, messageCreatedTtsId, new_id = db.create_tts_record(content_id)
        if not statusCreatedTtsId:
            return jsonify({"status": False, "message": f"Failed to create TTS record: {messageCreatedTtsId}"})

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
        folder = get_upload_audio()
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
        
        # Add timestamp to make filename unique
        timestamp = int(time.time() * 1000)  # milliseconds for more precision
        filename = f"speech_{hash(text+ttsId)}_{timestamp}.mp3"
        filepath = os.path.join(folder, filename)
        
        response.stream_to_file(filepath)
        
        audio_url = f'/static/upload_audio/{filename}'
        
        return jsonify({
            'status': True,
            'message': 'Speech generated successfully',
            'audio_url': audio_url
        })
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@tts_bp.route('/api/delete-speech', methods=['DELETE'])
def delete_speech():
    try:
        folder = get_upload_audio()
        data = request.json
        filename = data.get('filename')
        
        if not filename:
            return jsonify({
                'status': False, 'message': 'No filename provided'
            }), 400
        
        if not filename.endswith('.mp3') or '/' in filename or '\\' in filename:
            return jsonify({
                'status': False,
                'message': 'Invalid filename'
            }), 400
        
        filepath = os.path.join(folder, filename)
        
        if os.path.exists(filepath):
            os.remove(filepath)
            return jsonify({
                'status': True, 'message': 'Speech deleted successfully'
            })
        else:
            return jsonify({
                'status': False, 'message': 'File not found'
            }), 404
            
    except Exception as e:
        return jsonify({
            'status': False,
            'message': f'Error deleting speech: {str(e)}'
        })
    
@tts_bp.route('/update-speech', methods=["POST"])
def update_speech():
    try:
        db = get_db()
        tts_id = request.form.get('ttsId')
        ttsAudios = request.form.get('ttsAudios')
        
        status, message = db.update_tts_record(tts_id, ttsAudios)
        
        if status:
            return jsonify({'status': True, 'message': message})
        else:
            return jsonify({'status': False, 'message': message})    
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
    