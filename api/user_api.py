from flask import Blueprint, request, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename
from modules.utils import allowed_file, get_db, get_s3_client, get_spaces_url
from modules.validation import modifyValidation
import os
import time
from botocore.exceptions import ClientError

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/students', methods=['GET'])
@login_required
def get_student_record():
    try:
        with get_db() as db:
            print(db)
            status, results = db.get_student_records()
            
            rows = results
            students = []

            for row in rows:
                # Handle image URL - check if it's already a full URL or just a filename
                if row[4] is not None:
                    filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                    # If it's already a full URL (starts with https://), use it as-is
                    if filename.startswith('https://'):
                        image_url = filename
                    else:
                        # Legacy: construct URL for old local files
                        image_url = get_spaces_url(filename, 'uploads')
                else:
                    image_url = None
                    
                students.append({
                    "id": row[0],
                    "fname": row[1],
                    "lname": row[2],
                    "email": row[3],
                    "image": image_url,
                    "role": row[5]
                })
            
            if status:
                return jsonify({"status": True, "data": students})
            else:
                return jsonify({"status": False, "message": results})
            
    except Exception as e:
        print(e)
        return jsonify({"status": False, "message": str(e)})

@user_bp.route('/teachers', methods=['GET'])
@login_required
def get_teacher_record():  
    try:
        with get_db() as db:
            status, results = db.get_teacher_records()
            
            rows = results
            
            teachers = []
            for row in rows:
                # Handle image URL - check if it's already a full URL or just a filename
                if row[4] is not None:
                    filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                    # If it's already a full URL (starts with https://), use it as-is
                    if filename.startswith('https://'):
                        image_url = filename
                    else:
                        # Legacy: construct URL for old local files
                        image_url = get_spaces_url(filename, 'uploads')
                else:
                    image_url = None
                    
                teachers.append({
                    "id": row[0],
                    "fname": row[1],
                    "lname": row[2],
                    "email": row[3],
                    "image": image_url,
                    "role": row[5]
                })
                
            if status:
                return jsonify({"status": True, "data": teachers})
            else:
                return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@user_bp.route('/admins', methods=['GET'])
@login_required
def get_admin_record():
    try:
        with get_db() as db:
            status, results = db.get_admin_records()
            rows = results
            
            # DEBUG: Log what we're getting
            print(f"Status: {status}")
            print(f"Number of rows: {len(results) if results else 0}")
            if results and len(results) > 0:
                print(f"First row: {results[0]}")
                print(f"Columns in first row: {len(results[0])}")
            
            admins = []
            for row in rows:
                # Handle image URL - check if it's already a full URL or just a filename
                if row[4] is not None:
                    filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                    # If it's already a full URL (starts with https://), use it as-is
                    if filename.startswith('https://'):
                        image_url = filename
                    else:
                        # Legacy: construct URL for old local files
                        image_url = get_spaces_url(filename, 'uploads')
                else:
                    image_url = None
                    
                admins.append({
                    "id": row[0],
                    "fname": row[1],
                    "lname": row[2],
                    "email": row[3],
                    "image": image_url,
                    "role": row[5]
                })
                
            if status:
                return jsonify({"status": True, "data": admins})
            else:
                return jsonify({"status": False, "message": results})
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})


@user_bp.route('/modify_user', methods=['POST'])
@login_required
def modify_user():
    try:
        with get_db() as db:
            original_id = request.form.get("original_id")
            original_email = request.form.get("original_email")
            id = request.form.get("id")
            fname = request.form.get("fname")
            lname = request.form.get("lname")
            email = request.form.get("email")
            password = request.form.get("password")
            role = request.form.get("role")
            
            filename = None
            
            if 'image' in request.files:
                image = request.files['image']
                
                if image.filename != '' and image and allowed_file(image.filename):
                    # Secure the filename
                    filename = secure_filename(image.filename)
                    
                    # Add timestamp to make filename unique
                    timestamp = int(time.time() * 1000)
                    name, ext = os.path.splitext(filename)
                    filename = f"{name}_{timestamp}{ext}"
                    
                    # Upload to DigitalOcean Spaces
                    s3_client = get_s3_client()
                    bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')
                    
                    s3_client.upload_fileobj(
                        image,
                        bucket_name,
                        f'uploads/{filename}',
                        ExtraArgs={
                            'ACL': 'public-read',
                            'ContentType': image.content_type or 'image/jpeg'
                        }
                    )
                    
                    # Store the full URL
                    filename = get_spaces_url(filename, 'uploads')
                
            errors = modifyValidation(id, original_id, fname, lname, email, original_email, password, role)
            if errors:
                return jsonify({"status": False, "errors": errors})
                
            status, message = db.modify_user_record(original_id, id, fname, lname, email, password, filename, role)
            
            if status:
                return jsonify({"status": True, "message": message})
            else:
                return jsonify({"status": False, "message": message})
            
    except ClientError as e:
        return jsonify({
            "status": False, 
            "message": f"Spaces upload error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@user_bp.route('/delete_user', methods=['POST'])
def delete_user():
    try:
        with get_db() as db:
            id = request.form.get('id')
            role = request.form.get('role')
            
            status, message = db.delete_user_record(id, role)
            
            if status:
                return jsonify({"status": True, "message": message})
            else:
                return jsonify({"status": False, "message": message})            
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@user_bp.route('/filter_record/<string:role>/<string:filter>', methods=['GET'])
@login_required
def filter_record(role, filter):
    try:
        with get_db() as db:
            result = []
            if role == "student":
                status, result = db.get_student_records(filter)
            elif role == "teacher":
                status, result = db.get_teacher_records(filter)
            else:
                return jsonify({"status": False, "message": "Records are only students and teachers"})
            
            rows = result
            data = []
            
            for row in rows:
                # Handle image URL - check if it's already a full URL or just a filename
                if row[4] is not None:
                    filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                    # If it's already a full URL (starts with https://), use it as-is
                    if filename.startswith('https://'):
                        image_url = filename
                    else:
                        # Legacy: construct URL for old local files
                        image_url = get_spaces_url(filename, 'uploads')
                else:
                    image_url = None
                    
                data.append({
                    "id": row[0],
                    "fname": row[1],
                    "lname": row[2],
                    "email": row[3],
                    "image": image_url,
                    "role": row[5]
                })
            
            if status:
                return jsonify({"status": True, "data": data})
            else:
                return jsonify({"status": False, "message": result})
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@user_bp.route('/user/<string:id>', methods=['GET'])
@login_required
def get_user(id):
    try:
        with get_db() as db:
            status, result = db.get_user_info_by_id(id)

            data = []
            
            # Handle image URL - check if it's already a full URL or just a filename
            if result[3] is not None:
                filename = result[3].decode('utf-8') if isinstance(result[3], bytes) else result[3]
                # If it's already a full URL (starts with https://), use it as-is
                if filename.startswith('https://'):
                    image_url = filename
                else:
                    # Legacy: construct URL for old local files
                    image_url = get_spaces_url(filename, 'uploads')
            else:
                image_url = None
                
            data.append({
                "id": result[0],
                "fullName": result[1],
                "email": result[2],
                "image": image_url,
            })
            
            if status:
                return jsonify({"status": True, "data": data})
            else:
                return jsonify({"status": False, "message": result})
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})