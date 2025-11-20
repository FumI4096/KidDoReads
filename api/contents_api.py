from flask import Blueprint, request, jsonify
from modules.utils import get_db
from flask_login import login_required
from modules.utils import allowed_file, generate_unique_filename, get_upload_picture_clues
import json
import os

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
            quiz_tts_str = row[3] or "{}"
            quiz_tts_json = json.loads(quiz_tts_str)
            contents.append({
                "content_id": row[0],
                "content_title": row[1],
                "content_json": quiz_contents_json,
                "tts_json": quiz_tts_json,
                "content_type": row[4],
                "content_type_name": row[5],
                "isHidden": row[6]
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
            quiz_tts_str = row[4] or "{}"
            quiz_tts_json = json.loads(quiz_tts_str)
            contents.append({
                "content_id": row[0],
                "teacher_name": row[1],
                "content_title": row[2],
                "content_json": quiz_contents_json,
                "tts_json": quiz_tts_json,
                "content_type": row[5],
                "isHidden": row[6]
            })
            
        if status:
            return jsonify({"status": True, "data": contents})
        else:
            return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@contents_bp.route('/students/assessments/<int:type>', methods=["GET"])
def get_assessments_for_students(type):
    try:
        db = get_db()
        status, results = db.get_assessments_by_type(type)
        rows = results
        
        assessments = []
        for row in rows:
            quiz_contents_str = row[2] or "{}"
            quiz_contents_json = json.loads(quiz_contents_str)
            quiz_tts_str = row[3] or "{}"
            quiz_tts_json = json.loads(quiz_tts_str)
            assessments.append({
                "assessment_id": row[0],
                "assessment_title": row[1],
                "assessment_json": quiz_contents_json,
                "tts_json": quiz_tts_json,
                "assessment_type": row[4]
            })
            
        if status:
            return jsonify({"status": True, "data": assessments})
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
    
@contents_bp.route('/update_content_picture_clues', methods=['POST'])
@login_required
def update_picture_clues_content():
    try:
        db = get_db()
        teacherId = request.form.get('id')
        contentId = request.form.get('content_id')
        content = request.form.get('content')
        totalQuestions = request.form.get('total_questions')
        question_index = request.form.get('question_index')
        
        image_path = None
        
        try:
            content_data = json.loads(content)
        except json.JSONDecodeError:
            return jsonify({"status": False, "message": "Invalid JSON format"}), 400
        
        # ✅ Handle image file upload
        if 'image' in request.files:
            file = request.files['image']
            print(f"Image file received: {file.filename}")
            
            if file and file.filename != '':
                if allowed_file(file.filename):
                    # Get the question index to update
                    if question_index is not None:
                        idx = int(question_index)
                        
                        # Delete old image if it exists
                        if idx < len(content_data):
                            old_image = content_data[idx].get('picture', '')
                            if old_image and old_image not in ['', 'PENDING_UPLOAD']:
                                old_filepath = os.path.join('static', old_image)
                                if os.path.exists(old_filepath):
                                    try:
                                        os.remove(old_filepath)
                                        print(f"Deleted old image: {old_filepath}")
                                    except Exception as e:
                                        print(f"Error deleting old image: {e}")
                    
                    # Save new image
                    filename = generate_unique_filename(file.filename)
                    filepath = os.path.join(get_upload_picture_clues(), filename)
                    file.save(filepath)
                    
                    # Store relative path (without 'static/')
                    image_path = f'static/upload_picture_clues/{filename}'
                    print(f"Saved new image: {image_path}")
                    
                    # ✅ Update the picture field in the JSON
                    if question_index is not None:
                        idx = int(question_index)
                        if idx < len(content_data):
                            content_data[idx]['picture'] = image_path
                            print(f"Updated question {idx} picture to: {image_path}")
                else:
                    return jsonify({"status": False, "message": "Invalid file type. Only PNG, JPG, JPEG, GIF allowed."}), 400
        
        # Convert back to JSON string
        updated_content_string = json.dumps(content_data)
        print("Final content to save:", updated_content_string)
        
        # Save to database
        result, message = db.update_content(teacherId, contentId, updated_content_string, totalQuestions)
        
        if result:
            return jsonify({"status": True,"message": message,"image_path": image_path}) # Return the path to JavaScript
        else:
            return jsonify({"status": False,"message": message})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})

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
    
@contents_bp.route('/assessments', methods=['GET'])
@login_required
def get_assessments():
    try:
        db = get_db()
        status, results = db.get_assessments()
        rows = results
        
        print(rows)
        
        assessments = []
        for row in rows:
            assessments_str = row[2] or "{}"
            assessments_json = json.loads(assessments_str)
            quiz_tts_str = row[3] or "{}"
            quiz_tts_json = json.loads(quiz_tts_str)
            assessments.append({
                "assessment_id": row[0],
                "assessment_title": row[1],
                "assessment_json": assessments_json,
                "tts_json": quiz_tts_json,
                "assessment_type": row[4],
                "assessment_type_name": row[5]
            })
            
        if status:
            return jsonify({"status": True, "data": assessments})
        else:
            return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})