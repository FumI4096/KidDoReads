from flask import Blueprint, request, jsonify
from modules.utils import get_db

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
    
    