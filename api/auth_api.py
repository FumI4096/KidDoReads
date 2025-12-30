from flask import Blueprint, request, redirect, url_for, jsonify
from flask_login import login_user, logout_user
from werkzeug.utils import secure_filename
from modules.utils import get_db
from modules.validation import loginValidation, regValidation
from modules.User import User
from modules.utils import allowed_file, get_upload_folder, get_s3_client, get_spaces_url
import os
import time
from botocore.exceptions import ClientError

auth_bp = Blueprint('auth_bp', __name__)

@auth_bp.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home_bp.home'))

@auth_bp.route('/login', methods=['POST'])
def login():
    with get_db() as db:
        id = request.form.get('id')
        password = request.form.get('password')
        remember_me = request.form.get('remember_me') == 'on'
        errors = loginValidation(id, password)
    
        if errors:
            return jsonify({"status": False, "errors": errors})
        else:
            role = db.get_role_by_id(id)
            
            user = User(id=id, role=role[0].lower())
            login_user(user, remember=remember_me)
            
            if user.role == "student":
                return jsonify({'status': True, 'redirectUrl': 'student_dashboard', "id": id, "role": user.role})
            elif user.role == "teacher":
                return jsonify({'status': True, 'redirectUrl': 'teacher_dashboard', "id": id, "role": user.role})
            elif user.role == "admin":
                return jsonify({'status': True, 'redirectUrl': 'admin', "id": id})
            else:
                return jsonify({"status": False, "message": "Invalid role."}), 400        

@auth_bp.route('/register', methods=['POST'])
def register():
    try:
        with get_db() as db:
            id = request.form.get("id")
            fname = request.form.get("fname")
            lname = request.form.get("lname")
            email = request.form.get("email")
            password = request.form.get("password")
            role = request.form.get("role")
            section = request.form.get("section") if role == "student" else None
            
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
                    
                    # Store the full URL in the database
                    filename = get_spaces_url(filename, 'uploads')
            
            errors = regValidation(id, fname, lname, email, password, role, section)
            
            if errors:
                return jsonify({"status": False, "errors": errors})
            
            if role == "student":
                db.insert_student(int(id), fname, lname, email, password, filename, section)
                return jsonify({"status": True, "message": "Student Inserted Successfully"})
                
            elif role == "teacher":
                result, message = db.insert_teacher(int(id), fname, lname, email, password, filename)
                return jsonify({"status": result, "message": message})
                
            elif role == "admin":
                db.insert_admin(int(id), fname, lname, email, password, filename)
                return jsonify({"status": True, "message": "Admin Inserted Successfully"})
            
    except ClientError as e:
        return jsonify({
            "status": False, 
            "message": f"Spaces upload error: {str(e)}"
        }), 500
    except Exception as e:
        return jsonify({
            "status": False,
            "message": str(e)
        }), 500