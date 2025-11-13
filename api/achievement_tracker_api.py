from flask import Blueprint, request, jsonify
from modules.utils import get_db
from modules.achievement import checkCount, firstFinishedGame, checkPerfectScoreCount
import json

achievement_bp = Blueprint('achievement_bp', __name__)

@achievement_bp.route('/achievement/finished_attempts/<int:student_id>', methods=['GET'])
def attempt_achievement(student_id):
    try:
        db = get_db()
        
        status, count = db.get_count_finished_attempts_in_activity_and_assessment(student_id)
        
        print("Finished Attempts:", count)
        
        countStatus, achievement_id = checkCount(count)
        
        achievementStatus = db.has_achievement(student_id, achievement_id)
        
        if achievementStatus:
            return jsonify({"status": False, "message": "Achievement already exists"})
        
        print(countStatus, achievement_id)
        
        if status and countStatus:
            insertStatus, message = db.insert_achievement_for_student(student_id, achievement_id)
            
            print(message)
            
            if insertStatus:
                return jsonify({"status": True, "message": message})
            else:
                return jsonify({"status": False, "message": message})
        else:
            print("Achievement not yet achieved")
            return jsonify({"status": False, "message": "No Achievement yet"})
            
            

    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@achievement_bp.route('/achievement/activity/finished_attempts/<int:student_id>', methods=['GET'])
def activity_attempt_achievement(student_id):
    try:
        db = get_db()
        
        status, row = db.get_first_attempt_in_activity(student_id)
        
        print(status)
        print("Row:", row)
        
        achievementStatus = db.has_achievement(student_id, 1)
        
        
        if achievementStatus:
            return jsonify({"status": False, "message": "Achievement already exists in Activity"})
        
        if status and firstFinishedGame(row, achievementStatus):
            insertStatus, message = db.insert_achievement_for_student(student_id, 1)
            
            print(message)
            
            if insertStatus:
                return jsonify({"status": True, "message": message})
            else:
                return jsonify({"status": False, "message": message})
        else:
            print("Achievement not yet achieved")
            return jsonify({"status": False, "message": "No Achievement yet in Activity"})
            

    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

@achievement_bp.route('/achievement/assessment/finished_attempts/<int:student_id>', methods=['GET'])
def assessment_attempt_achievement(student_id):
    try:
        db = get_db()
        
        status, row = db.get_first_attempt_in_assessment(student_id) 
        
        print("Row:", row)
        
        achievementStatus = db.has_achievement(student_id, 2)
        
        if status and firstFinishedGame(row, achievementStatus):
            insertStatus, message = db.insert_achievement_for_student(student_id, 2)
            
            print(message)
            
            if insertStatus:
                return jsonify({"status": True, "message": message})
            else:
                return jsonify({"status": False, "message": message})
        else:
            print("Achievement not yet achieved")
            return jsonify({"status": False, "message": "No Achievement yet in Assessment"})
            
            

    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

@achievement_bp.route('/achievement/perfect_scores/<int:student_id>', methods=['GET'])
def perfect_score_achievement(student_id):
    try:
        db = get_db()
        
        status, count = db.get_perfect_scores(student_id) 
        
        print("Count:", count)
        
        countStatus, achievement_id = checkPerfectScoreCount(count)
        
        achievementStatus = db.has_achievement(student_id, achievement_id)
    
        if achievementStatus:
            return jsonify({"status": False, "message": "Achievement already exists"})
        
        
        
        if status and countStatus:
            insertStatus, message = db.insert_achievement_for_student(student_id, achievement_id)
            
            print(message)
            
            if insertStatus:
                return jsonify({"status": True, "message": message})
            else:
                return jsonify({"status": False, "message": message})
        else:
            print("Achievement not yet achieved")
            return jsonify({"status": False, "message": "No Achievement yet in Assessment"})
            
            

    except Exception as e:
        return jsonify({"status": False, "message": str(e)})