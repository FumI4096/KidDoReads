from flask import Blueprint, request, jsonify
from modules.utils import get_db
import json

attempt_bp = Blueprint('attempt_bp', __name__)

@attempt_bp.route('/attempt', methods=['POST'])
def game_attempt():
    try:
        db = get_db()
        content_id = request.form.get('content_id')
        student_id = request.form.get('student_id')
        
        status, message, attempt_id, student_answer = db.get_or_create_attempt(content_id, student_id)
        
        student_answer_str = student_answer or "{}"
        student_answer_json = json.loads(student_answer_str)
        
        print(message)
        
        if status:
            print(student_answer_json)
            return jsonify({"status": status, "message": message, "attemptId": attempt_id, "studentAnswer": student_answer_json, "hasExistingAnswer": bool(student_answer_json)})
        else:
            return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/resume_attempt', methods=['PATCH'])
def resume_attempt():
    """
    Update status to ANSWERING when user actually resumes
    """
    try:
        db = get_db()
        attempt_id = request.form.get('attempt_id')
        
        status, message = db.resume_attempt(attempt_id)
        
        
        if status:
            return jsonify({"status": True, "message": message})
        else:
            print(message)
            return jsonify({"status": False, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

@attempt_bp.route('/save_attempt', methods=['PATCH'])
def save_attempt():
    try:
        db = get_db()
        answer = request.form.get('answer')
        attempt_id = request.form.get('attempt_id')
        
        status, message = db.save_and_exit(answer, attempt_id)
        
        print(message)
        
        if status:
            return jsonify({"status": status, "message": message})
        else:
            return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/finish_attempt', methods=['PATCH'])
def finish_attempt():
    try:
        db = get_db()
        answer = request.form.get('answer')
        score = request.form.get('score')
        attempt_id = request.form.get('attempt_id')
        
        status, message = db.finish_attempt(answer, score, attempt_id)
        
        print(message)
        
        if status:
            return jsonify({"status": status, "message": message})
        else:
            return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})    
    
@attempt_bp.route('/attempts/activities/<int:teacher_id>/<int:content_type>', methods=['GET'])
def student_progress(teacher_id, content_type):
    try:
        db = get_db()
        
        # Add condition [0 = activities, 1 = assessments] for category filtering
        status, results = db.get_student_progress_by_contents(teacher_id, content_type)
        
        rows = results
        attempts = []
        for row in rows:
            attempts.append({
                "content_id": row[0],
                "content_title": row[1],
                "completed_students": row[2],
                "total_students": row[3],
                "progress": row[4],
                'is_hidden_from_students': row[5]
            })
        
        if status:
            return jsonify({"status": status, "attempts": attempts})
        else:
            return jsonify({"status": status, "message": "Failed to retrieve attempts"})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/attempts/activities/<int:content_id>/filter/<int:filter>', methods=['GET'])
def attempt_progress(content_id, filter):
    try:
        db = get_db()
        
        filters = [
            'StudentID DESC', 
            'StudentID ASC', 
            'highest_score DESC', 
            'lowest_score ASC', 
            'total_attempts DESC', 
            'total_attempts ASC'
        ]
        
        status, results = db.get_student_scores_by_content_id(content_id, filters[filter])
        
        rows = results
        scores = []
        for row in rows:
            scores.append({
                "student_id": row[0],
                "student_name": row[1],
                "student_attempts": row[2],
                "student_highest_score": row[3],
                "student_lowest_score": row[4],
                "total_questions": row[5]
            })
        
        if status:
            return jsonify({"status": status, "scores": scores})
        else:
            return jsonify({"status": status, "message": "Failed to retrieve attempts"})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/attempts/activities/students/<int:student_id>/<int:content_id>/filter/<int:filter>', methods=['GET'])
def student_attempt_scores(student_id, content_id, filter):
    try:
        db = get_db()
        
        filters = [
            "Score DESC", 
            "Score ASC", 
            "attemptAt DESC", 
            "attemptAt ASC"
        ]
        status, results = db.get_student_attempt_scores(student_id, content_id, filters[filter])
        
        rows = results
        attempt_scores = []
        for row in rows:
            attempt_scores.append({
                "attempt_count": row[0],
                "score": row[1],
                "status": row[2],
                "date": row[3]
            })
        
        if status:
            return jsonify({"status": status, "attemptScores": attempt_scores})
        else:
            return jsonify({"status": status, "message": "Failed to retrieve attempts"})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})