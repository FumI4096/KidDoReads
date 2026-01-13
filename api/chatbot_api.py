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
        
        client = OpenAI(api_key=get_chatbot_key()) 
        
        response = client.chat.completions.create(
            model="gpt-4o-mini",  # or "gpt-4o" for more capable model
            messages=[
                {"role": "system", "content": """You are an English teaching assistant designed specifically to help English teachers 

                    Your expertise includes:
                    - Explaining word meanings, definitions, and etymology
                    - English grammar, vocabulary, and language mechanics
                    - Reading comprehension strategies
                    - Literary terms and concepts (metaphor, simile, alliteration, etc.)
                    - Writing instruction (essays, creative writing, etc.)
                    - English curriculum planning and lesson ideas
                    - Assessment and feedback strategies for English assignments
                    - ESL/EFL teaching methodologies

                    If a user asks about other subjects (math, science, history, etc.) or topics unrelated to English education, politely inform them that you are specifically designed to assist with English teaching matters only.

                    Be supportive, pedagogically sound, and provide practical, classroom-ready advice."""
                },
                {"role": "user", "content": message}
            ],
            temperature=0.7,
            max_tokens=500
        )
        
        reply = response.choices[0].message.content
        return jsonify({'status': True, 'botResponse': reply})
        
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@chatbot_bp.route('/chat-history/<int:teacher_id>', methods=["GET"])
def chat_history(teacher_id):
    try:
        with get_db() as db:
            status, history = db.get_chat_history(teacher_id)
        
            if status:
                history_json = json.loads(history) 
            else:
                history_json = history
            
            return jsonify({'status': status, 'history': history_json})
        
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@chatbot_bp.route('/update-conversation', methods=["PATCH"])
def update_conversation():
    try:
        with get_db() as db:
            id = request.form.get('teacher_id')
            conversation = request.form.get('conversation')
            status, message = db.chatbot_conversation_update(id, conversation)
        
            if status:
                return jsonify({'status': True, 'message': message})
            else:
                return jsonify({'status': False,'message': message})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})