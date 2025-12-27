from flask import Blueprint, request, jsonify
from modules.utils import get_db
from flask_login import login_required
from modules.utils import get_s3_client, get_spaces_url,allowed_file, generate_unique_filename, get_upload_picture_clues
import json
import os
from botocore.exceptions import ClientError

contents_bp = Blueprint('contents_bp', __name__)

@contents_bp.route('/contents', methods=['POST'])
def create_content():
    try:
        with get_db() as db:
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
        with get_db() as db:
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
        with get_db() as db:
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
        with get_db() as db:
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
    

#change to patch
@contents_bp.route('/update_content', methods=['POST'])
@login_required
def update_content():
    with get_db() as db:
        teacherId = request.form.get('id')
        contentId = request.form.get('content_id')
        content = request.form.get('content')
        totalQuestions = request.form.get('total_questions')
        
        print("Teacher ID:", teacherId)
        print("Content ID:", contentId)
        print("Content to update:", content)
        print("Total Questions:", totalQuestions)
        
        result, message = db.update_content(teacherId, contentId, content, totalQuestions)
        
        print(result, message)
        
        if result is True:
            return jsonify({"status": True, "message": message})
        else:
            return jsonify({"status": False, "message": message})
    
@contents_bp.route('/update_content_picture_clues', methods=['POST'])
@login_required
def update_picture_clues_content():
    try:
        with get_db() as db:
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
                            
                            # Delete old image if it exists in Spaces
                            if idx < len(content_data):
                                old_image = content_data[idx].get('picture', '')
                                if old_image and old_image not in ['', 'PENDING_UPLOAD']:
                                    # Check if it's a Spaces URL
                                    if os.getenv('FLASK_ENV') == 'production':
                                        try:
                                            # Extract filename from URL
                                            # URL format: https://kiddoreads.sfo3.digitaloceanspaces.com/picture_clues/filename.jpg
                                            old_filename = old_image.split('/')[-1]
                                            
                                            # Delete from Spaces
                                            s3_client = get_s3_client()
                                            bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')
                                            s3_client.delete_object(
                                                Bucket=bucket_name,
                                                Key=f'picture_clues/{old_filename}'
                                            )
                                            print(f"Deleted old image from Spaces: {old_filename}")
                                        except Exception as e:
                                            print(f"Error deleting old image from Spaces: {e}")
                                    else:
                                        # Legacy: try to delete from local filesystem
                                        old_filepath = os.path.join('static', old_image)
                                        if os.path.exists(old_filepath):
                                            try:
                                                os.remove(old_filepath)
                                                print(f"Deleted old local image: {old_filepath}")
                                            except Exception as e:
                                                print(f"Error deleting old local image: {e}")
                        
                        # Save new image to Spaces
                        filename = generate_unique_filename(file.filename)
                        
                        if os.getenv('FLASK_ENV') == 'production':
                            # Save to cloud storage (DigitalOcean Spaces, S3, etc.)
                            try:
                                s3_client = get_s3_client()
                                bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')
                                
                                # Reset file pointer
                                file.seek(0)
                                
                                s3_client.upload_fileobj(
                                    file,
                                    bucket_name,
                                    f'picture_clues/{filename}',
                                    ExtraArgs={
                                        'ACL': 'public-read',
                                        'ContentType': file.content_type or 'image/jpeg'
                                    }
                                )
                                
                                # Generate cloud URL
                                image_path = get_spaces_url(filename, 'picture_clues')
                                print(f"Saved new image to cloud: {image_path}")
                            except Exception as e:
                                print(f"Error uploading to cloud: {e}")
                                return jsonify({
                                    "status": False,
                                    "message": f"Failed to upload image to cloud: {str(e)}"
                                }), 500
                        else:
                            # Save to local storage (development)
                            upload_folder = os.path.join('static', 'upload_picture_clues')
                            os.makedirs(upload_folder, exist_ok=True)
                            
                            filepath = os.path.join(upload_folder, filename)
                            file.save(filepath)
                            
                            # Store relative path
                            image_path = f'upload_picture_clues/{filename}'
                            print(f"Saved new image locally: {filepath}")
                        
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
                
    except ClientError as e:
        return jsonify({
            "status": False, 
            "message": f"Spaces upload error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@contents_bp.route('/content/<string:teacher_id>/<int:content_id>', methods=['DELETE'])
@login_required
def delete_content(teacher_id, content_id):
    with get_db() as db:
        result, message = db.delete_content(teacher_id, content_id)
        
        if result is True:
            return jsonify({"status": True, "message": message})
        else:
            return jsonify({"status": False, "message": message})
    
@contents_bp.route('/content/<int:teacher_id>/<int:content_id>/<int:hide>', methods=["PATCH"])
@login_required
def unhide_content(teacher_id, content_id, hide):
    with get_db() as db:
        result, message = db.hide_content(teacher_id, content_id, hide)
        
        if result is True:
            return jsonify({"status": True, "message": message})
        else:
            return jsonify({"status": False, "message": message}) 
    
@contents_bp.route('/assessments', methods=['GET'])
@login_required
def get_assessments():
    try:
        with get_db() as db:
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

@contents_bp.route('/contents/<int:content_type>/<int:teacher_id>', methods=['GET'])
def get_contents_by_type(content_type, teacher_id):
    try:
        with get_db() as db:
            status, results = db.get_contents_by_type(content_type, teacher_id)
            rows = results
            
            contents = []
            for row in rows:
                quiz_contents_str = row[3] or "{}"
                quiz_contents_json = json.loads(quiz_contents_str)
                quiz_tts_str = row[2] or "{}"
                quiz_tts_json = json.loads(quiz_tts_str)
                contents.append({
                    "content_id": row[0],
                    "content_title": row[1],
                    "tts_json": quiz_tts_json,
                    "content_json": quiz_contents_json,
                })
            
            if status:
                return jsonify({"status": True, "data": contents})
            else:
                return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})