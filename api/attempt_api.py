from flask import Blueprint, request, jsonify
from modules.utils import get_db, recalculate_scores_on_student_attempts
import json

attempt_bp = Blueprint('attempt_bp', __name__)

@attempt_bp.route('/attempt/activity', methods=['POST'])
def activity_attempt():
    try:
        with get_db() as db:
            content_id = request.form.get('content_id')
            student_id = request.form.get('student_id')
            
            status, message, attempt_id, student_answer, has_unfinished = db.get_or_create_attempt_activity(content_id, student_id)
            
            student_answer_str = student_answer or "{}"
            student_answer_json = json.loads(student_answer_str)
            
            print(message)
            
            if status:
                print(student_answer_json)
                return jsonify({"status": status, "message": message, "attemptId": attempt_id, "studentAnswer": student_answer_json, "hasUnfinished": has_unfinished})
            else:
                return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

@attempt_bp.route('/attempt/assessment', methods=['POST'])
def assessment_attempt():
    try:
        with get_db() as db:
            content_id = request.form.get('content_id')
            student_id = request.form.get('student_id')
            
            status, message, attempt_id, student_answer, has_unfinished = db.get_or_create_attempt_assessment(content_id, student_id)
            
            student_answer_str = student_answer or "{}"
            student_answer_json = json.loads(student_answer_str)
            
            print(message)
            
            if status:
                print(student_answer_json)
                return jsonify({"status": status, "message": message, "attemptId": attempt_id, "studentAnswer": student_answer_json, "hasUnfinished": has_unfinished})
            else:
                return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/resume_attempt/activity', methods=['PATCH'])
def resume_attempt_activity():
    """
    Update status to ANSWERING when user actually resumes
    """
    try:
        with get_db() as db:
            attempt_id = request.form.get('attempt_id')
            
            status, message = db.resume_attempt_activity(attempt_id)
            
            if status:
                return jsonify({"status": True, "message": message})
            else:
                print(message)
                return jsonify({"status": False, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/resume_attempt/assessment', methods=['PATCH'])
def resume_attempt_assessment():
    """
    Update status to ANSWERING when user actually resumes
    """
    try:
        with get_db() as db:
            attempt_id = request.form.get('attempt_id')
            
            status, message = db.resume_attempt_assessment(attempt_id)
            
            if status:
                return jsonify({"status": True, "message": message})
            else:
                print(message)
                return jsonify({"status": False, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

@attempt_bp.route('/save_attempt/activity', methods=['PATCH'])
def save_attempt_activity():
    try:
        with get_db() as db:
            answer = request.form.get('answer')
            attempt_id = request.form.get('attempt_id')
            
            status, message = db.save_and_exit_activity(answer, attempt_id)
            
            print(message)
            
            if status:
                return jsonify({"status": status, "message": message})
            else:
                return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/save_attempt/assessment', methods=['PATCH'])
def save_attempt_assessment():
    try:
        with get_db() as db:
            answer = request.form.get('answer')
            attempt_id = request.form.get('attempt_id')
            
            status, message = db.save_and_exit_assessment(answer, attempt_id)
            
            print(message)
            
            if status:
                return jsonify({"status": status, "message": message})
            else:
                return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/finish_attempt/activity', methods=['PATCH'])
def finish_attempt_activity():
    try:
        with get_db() as db:
            answer = request.form.get('answer')
            score = request.form.get('score')
            attempt_id = request.form.get('attempt_id')
            
            status, message = db.finish_attempt_activity(answer, score, attempt_id)
            
            print(message)
            
            if status:
                return jsonify({"status": status, "message": message})
            else:
                return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)}) 

@attempt_bp.route('/finish_attempt/assessment', methods=['PATCH'])
def finish_attempt_assessment():
    try:
        with get_db() as db:
            answer = request.form.get('answer')
            score = request.form.get('score')
            attempt_id = request.form.get('attempt_id')
            
            status, message = db.finish_attempt_assessment(answer, score, attempt_id)
            
            print(message)
            
            if status:
                return jsonify({"status": status, "message": message})
            else:
                return jsonify({"status": status, "message": message})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})    
    
@attempt_bp.route('/attempts/activities/<int:teacher_id>/<int:content_type>', methods=['GET'])
def activity_student_progress(teacher_id, content_type):
    try:
        with get_db() as db:
            status, results = db.get_student_progress_by_contents(teacher_id, content_type)
            
            rows = results
            attempts = []
            for row in rows:
                attempts.append({
                    "content_id": row[0],
                    "content_title": row[1],
                    "completed_students": row[2],
                    "total_students": row[3],
                    "progress": row[4]
                })
            
            if status:
                return jsonify({"status": status, "attempts": attempts})
            else:
                return jsonify({"status": status, "message": "Failed to retrieve attempts"})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

@attempt_bp.route('/attempts/assessments', methods=['GET'])
def assessments_student_progress():
    try:
        with get_db() as db:
            status, results = db.get_student_progress_by_assessments()
            
            rows = results
            attempts = []
            for row in rows:
                attempts.append({
                    "assessment_id": row[0],
                    "assessment_title": row[1],
                    "completed_students": row[2],
                    "total_students": row[3],
                    "progress": row[4]
                })
            
            if status:
                return jsonify({"status": status, "attempts": attempts})
            else:
                return jsonify({"status": status, "message": "Failed to retrieve attempts"})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/attempts/activities/<int:content_id>/filter/<int:filter>/<int:section_id>', methods=['GET'])
def activity_attempt_progress(content_id, section_id, filter):
    try:
        with get_db() as db:
            filters = [
                'StudentID DESC', 
                'StudentID ASC', 
                'highest_score DESC', 
                'lowest_score ASC', 
                'total_attempts DESC', 
                'total_attempts ASC'
            ]
            
            status, results = db.get_student_scores_by_content_id(content_id, section_id, filters[filter])
            
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

@attempt_bp.route('/attempts/assessments/<int:assessment_id>/filter/<int:filter>/<int:section_id>', methods=['GET'])
def assessment_attempt_progress(assessment_id, filter, section_id):
    try:
        with get_db() as db:
            filters = [
                'StudentID DESC', 
                'StudentID ASC', 
                'highest_score DESC', 
                'lowest_score ASC', 
                'total_attempts DESC', 
                'total_attempts ASC'
            ]
            
            status, results = db.get_student_scores_by_assessment_id(assessment_id, section_id, filters[filter])
            
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
def student_activity_attempt_scores(student_id, content_id, filter):
    try:
        with get_db() as db:
            filters = [
                "Score DESC", 
                "Score ASC", 
                "attemptAt DESC", 
                "attemptAt ASC"
            ]
            status, results = db.get_student_activity_attempt_scores(student_id, content_id, filters[filter])
            
            try:
                new_scores = recalculate_scores_on_student_attempts(student_id, content_id)
                print(f"Recalculated scores: {new_scores}")
            except Exception as recalc_error:
                print(f"ERROR in recalculate_scores_on_student_attempts: {recalc_error}")
                import traceback
                traceback.print_exc()
                new_scores = []
            
            print("Hello - reached after recalculation")
            
            rows = results
            attempt_scores = []
            for index, row in enumerate(rows):
                try:
                    current_score = row[1]
                    
                    # Safely get recalculated score
                    if new_scores and isinstance(new_scores, list) and index < len(new_scores):
                        recalculated_score = new_scores[index]
                        final_score = recalculated_score if current_score != recalculated_score else current_score
                    else:
                        final_score = current_score
                    
                    attempt_scores.append({
                        "attempt_count": row[0],
                        "score": final_score,
                        "status": row[2],
                        "date": row[3]
                    })
                except Exception as row_error:
                    print(f"ERROR processing row {index}: {row_error}")
                    continue
            
            print(f"DEBUG: attempt_scores = {attempt_scores}")
            if status:
                return jsonify({"status": status, "attemptScores": attempt_scores})
            else:
                return jsonify({"status": status, "message": "Failed to retrieve attempts"})
        
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@attempt_bp.route('/attempts/assessments/students/<int:student_id>/<int:assessment_id>/filter/<int:filter>', methods=['GET'])
def student_assessment_attempt_scores(student_id, assessment_id, filter):
    try:
        with get_db() as db:
            filters = [
                "Score DESC", 
                "Score ASC", 
                "attemptAt DESC", 
                "attemptAt ASC"
            ]
            status, results = db.get_student_assessment_attempt_scores(student_id, assessment_id, filters[filter])
            
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