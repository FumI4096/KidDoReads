from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
from modules.utils import get_db, get_chatbot_key
import json

chatbot_bp = Blueprint('chatbot_bp', __name__)

@chatbot_bp.route('/api/chatbot/response', methods=["POST"])
def chatbot_message():
    try:
        data = request.get_json()
        
        message = data.get('userMessage')
        
        print(message)
        
        client = OpenAI(api_key=get_chatbot_key()) 
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # or "gpt-4o" for more capable model
            messages=[
                {"role": "system", "content": "You are a helpful assistant."},
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        reply = response.choices[0].message.content
        print(reply)
        return jsonify({'status': True, 'botResponse': reply})
        
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@chatbot_bp.route('/chat-history/<int:teacher_id>', methods=["GET"])
def chat_history(teacher_id):
    try:
        db = get_db()
        status, history = db.get_chat_history(teacher_id)
        
        history_str = history
        history_json = json.loads(history_str)
        
        
        return jsonify({'status': status, 'history': history_json})
        
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
# @chatbot_bp.route('/update-conversation', methods=["PATCH"])
# def update_conversation():
#     try:
#         db = get_db()
#         status, message = 
#     except Exception as e:
#         return jsonify({'status': False, 'message': str(e)})