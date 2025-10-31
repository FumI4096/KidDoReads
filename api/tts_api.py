from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
from modules.utils import get_db, get_tts_key, get_upload_audio

tts_bp = Blueprint('tts_bp', __name__)

@tts_bp.route('/create-tts', methods=["POST"])
def create_text_to_speech():
    try:
        db = get_db()
        id = request.form.get('tts_id')
        status, message, new_id = db.create_tts_record(id)
        
        if status:
            return jsonify({"status": True, "message": message, "ttsId": new_id})
        else:
            return jsonify({"status": False, "message": message})            
        
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
        
        # Generate speech using OpenAI TTS
        response = client.audio.speech.create(
            model="tts-1",
            voice="alloy", 
            input=text
        )
        
        filename = f"speech_{hash(text+ttsId)}.mp3"
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
