from flask import Blueprint, request, jsonify
from flask_login import login_required
from modules.utils import get_db

attempt_bp = Blueprint('attempt_bp', __name__)

@attempt_bp.route('/attempt', methods=['POST'])
def create_student_attempt():
    try:
        db = get_db()
        content_id = request.form.get('content_id')
        student_id = request.form.get('student_id')
        score = request.form.get('score')
        
        status, message = db.create_attempt(content_id, student_id, score)
        
        if status:
            return jsonify({"status": status})
        else:
            return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})