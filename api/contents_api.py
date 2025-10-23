from flask import Blueprint, request, jsonify
from modules.utils import get_db
from flask_login import login_required
import json

contents_bp = Blueprint('contents_bp', __name__)

@contents_bp.route('/contents', methods=['POST'])
def create_content():
    try:
        db = get_db()
        teacher_id = request.form.get('teacher_id')
        content_title = request.form.get('content_title')
        content_type = request.form.get('content_type')
        
        status, message, content_id = db.create_content(int(teacher_id), content_title, content_type)
        
        if status:
            return jsonify({"status": status, "message": message, "content_id": content_id})
        else:
            return jsonify({"status": status, "message": message})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@contents_bp.route('/contents/<string:teacher_id>', methods=['GET'])
def get_contents(teacher_id):
    try:
        db = get_db()
        status, results = db.get_contents_by_teacher(teacher_id)
        rows = results
        
        contents = []
        for row in rows:
            quiz_contents_str = row[2] or "{}"
            quiz_contents_json = json.loads(quiz_contents_str)
            contents.append({
                "content_id": row[0],
                "content_title": row[1],
                "content_json": quiz_contents_json,
                "content_type": row[3],
                "content_type_name": row[4],
                "isHidden": row[5]
            })
            
        if status:
            return jsonify({"status": True, "data": contents})
        else:
            return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@contents_bp.route('/students/contents/<int:type>', methods=["GET"])
def get_contents_for_students(type):
    try:
        db = get_db()
        status, results = db.get_contents_by_type(type)
        rows = results
        
        contents = []
        for row in rows:
            quiz_contents_str = row[3] or "{}"
            quiz_contents_json = json.loads(quiz_contents_str)
            contents.append({
                "content_id": row[0],
                "teacher_name": row[1],
                "content_title": row[2],
                "content_json": quiz_contents_json,
                "content_type": row[4],
                "isHidden": row[5]
            })
            
        if status:
            return jsonify({"status": True, "data": contents})
        else:
            return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
# def get_all_content_titles(teacher_id):
#     try:
#         status, results = db.get_all_content_titles(teacher_id)
#         rows = results
        
#         content_title = []
#         for row in rows:
#             content_title.append({
#                 "content_title": row[0]
#             })
            
#         if status:
#             return jsonify({"status": True, "data": content_title})
#         else:
#             return jsonify({"status": False, "message": results})
#     except Exception as e:
#         return jsonify({"status": False, "message": str(e)})

# @app.route('/contents', methods=['PATCH'])
# def update_content_title():
#     try:
#         teacher_id = request.args.get('teacher_id')
#         original_title = request.args.get('original_title')
#         new_title = request.args.get('new_title')
        
#         status, results = db.update_content_title(teacher_id, original_title, new_title)
            
#         if status and results:
#             quiz_data_str = results[0] 
#             quiz_data_obj = json.loads(quiz_data_str)
#             return jsonify({"status": True, "data": quiz_data_obj})
#         elif status: 
#             return jsonify({"status": False, "message": "Content not found"})
#         else:
#             return jsonify({"status": False, "message": results})
#     except Exception as e:
#         return jsonify({"status": False, "message": str(e)})
    

#change to patch
@contents_bp.route('/update_content', methods=['POST'])
@login_required
def update_content():
    db = get_db()
    teacherId = request.form.get('id')
    contentId = request.form.get('content_id')
    content = request.form.get('content')
    totalQuestions = request.form.get('total_questions')
    
    result, message = db.update_content(teacherId, contentId, content, totalQuestions)
    
    if result is True:
        return jsonify({"status": True, "message": message})
    else:
        return jsonify({"status": False, "message": message})

@contents_bp.route('/content/<string:teacher_id>/<int:content_id>', methods=['DELETE'])
@login_required
def delete_content(teacher_id, content_id):
    db = get_db()
    result, message = db.delete_content(teacher_id, content_id)
    
    if result is True:
        return jsonify({"status": True, "message": message})
    else:
        return jsonify({"status": False, "message": message})
    
@contents_bp.route('/content/<int:teacher_id>/<int:content_id>/<int:hide>', methods=["PATCH"])
@login_required
def unhide_content(teacher_id, content_id, hide):
    db = get_db()
    result, message = db.hide_content(teacher_id, content_id, hide)
    
    if result is True:
        return jsonify({"status": True, "message": message})
    else:
        return jsonify({"status": False, "message": message}) 