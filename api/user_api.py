from flask import Blueprint, request, url_for, jsonify
from flask_login import login_required
from werkzeug.utils import secure_filename
from modules.utils import allowed_file, get_db, get_upload_folder
from modules.validation import modifyValidation
import os
from werkzeug.security import generate_password_hash

user_bp = Blueprint('user_bp', __name__)

@user_bp.route('/students', methods=['GET'])
@login_required
def get_student_record():
    try:
        db = get_db()
        print(db)
        status, results = db.get_student_records()
        rows = results
        students = []

        for row in rows:
            if row[4] is not None:
                filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                image_url = url_for('static', filename=f'uploads/{filename}')
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
        db = get_db() 
        status, results = db.get_teacher_records()
        rows = results
        
        teachers = []
        for row in rows:
            if row[4] is not None:
                filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                image_url = url_for('static', filename=f'uploads/{filename}')
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
        db = get_db()
        status, results = db.get_admin_records()
        rows = results
        
        admins = []
        for row in rows:
            if row[4] is not None:
                filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                image_url = url_for('static', filename=f'uploads/{filename}')
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
        db = get_db()
        upload_folder = get_upload_folder()
        original_id = request.form.get("original_id")
        original_email = request.form.get("original_email")
        id = request.form.get("id")
        fname = request.form.get("fname")
        lname = request.form.get("lname")
        email = request.form.get("email")
        password = request.form.get("password")
        role = request.form.get("role")
        
        if 'image' not in request.files:
            return jsonify({"status": "error", "message": "no file uploaded"})
            
        image = request.files['image']
            
        if image.filename == '':
            filename = None
            
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image.save(os.path.join(upload_folder, filename))
            
        errors = modifyValidation(id, original_id, fname, lname, email, original_email, password, role)
        if errors:
            return jsonify({"status": False, "errors": errors})
            
        status, message = db.modify_user_record(original_id, id, fname, lname, email, password, filename, role)
        
        if status:
            return jsonify({"status": True, "message": message})
        else:
            return jsonify({"status": False, "message": message})
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@user_bp.route('/delete_user', methods=['POST'])
def delete_user():
    try:
        db = get_db()
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
        db = get_db()
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
            if row[4] is not None:
                filename = row[4].decode('utf-8') if isinstance(row[4], bytes) else row[4]
                image_url = url_for('static', filename=f'uploads/{filename}')
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
        db = get_db()
        status, result = db.get_user_info_by_id(id)

        data = []
        
        if result[3] is not None:
            filename = result[3].decode('utf-8') if isinstance(result[3], bytes) else result[3]
            image_url = url_for('static', filename=f'uploads/{filename}')
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

@user_bp.route('/create-admin-secret-xyz', methods=['POST'])
def create_admin():
    try:
        db = get_db()
        cursor = db.cursor
        hashed_password = generate_password_hash('Admin123!')
        
        cursor.execute('''
            INSERT INTO users (AdminID, FirstName, LastName, Email, A_Password, A_Role, Image) 
            VALUES (1, %s, %s, %s, %s, %s, %s)
        ''', ('Admin', 'User', 'admin@kiddoreads.com', hashed_password, 3, None))
        
        db.connection.commit()
        return "Admin user created!"
    except Exception as e:
        return f"Error: {e}"