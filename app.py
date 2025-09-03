from flask import Flask, flash, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from database.db import Database
from dotenv import load_dotenv
import os
import base64
import re

load_dotenv()

UPLOAD_FOLDER = 'static/uploads'
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('KEY')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])
db = Database()

@app.route('/')
def home():
    return render_template('admin.html')

@app.route('/register', methods=['POST'])
def register():
    try:
        id = request.form.get("id")
        fname = request.form.get("fname")
        lname = request.form.get("lname")
        email = request.form.get("email")
        password = request.form.get("password")
        role = request.form.get("role")
        
        if 'image' not in request.files:
            return jsonify({"status": False, "message": "no file uploaded"})
        
        image = request.files['image']
        
        if image.filename == '':
            filename = None
        
        if image and allowed_file(image.filename):
            filename = secure_filename(image.filename)
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
        errors = regValidation(id, fname, lname, email, password, role)
        
        if errors:
            return jsonify({"status": False, "errors": errors})
        
        if role == "student":
            db.insert_student(int(id), fname, lname, email, password, filename)
            
            return jsonify({"status": True, "message": "Student Inserted Successfully"})
        elif role == "teacher":
            db.insert_teacher(int(id), fname, lname, email, password, filename)
            
            return jsonify({"status": True, "message": "Teacher Inserted Successfully"})
            
    except Exception as e:
        return jsonify({"message": str(e)})
    
@app.route('/students', methods=['GET'])
def get_student_record():
    try:
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
        return jsonify({"status": False, "message": str(e)})

@app.route('/teachers', methods=['GET'])
def get_teacher_record():
    try:
        status, results = db.get_teacher_records()
        rows = results
        
        print(status)
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

@app.route('/modify_user', methods=['POST'])
def modify_user():
    try:
        original_id = request.form.get("original_id")
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
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
        errors = modifyValidation(id, fname, lname, email, password, role)
        if errors:
            return jsonify({"status": False, "errors": errors})
            
        status, message = db.modify_user_record(original_id, id, fname, lname, email, password, filename, role)
        
        if status:
            return jsonify({"status": True, "message": message})
        else:
            return jsonify({"status": False, "message": message})
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@app.route('/delete_user', methods=['POST'])
def delete_user():
    try:
        id = request.form.get('id')
        role = request.form.get('role')
        
        status, message = db.delete_user_record(id, role)
        
        if status:
            return jsonify({"status": True, "message": message})
        else:
            return jsonify({"status": False, "message": message})            
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
@app.route('/filter_record/<string:role>/<string:filter>', methods=['GET'])
def filter_record(role, filter):
    try:
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
        
    
    
        
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def regValidation(id, fname, lname, email, password, role) -> list:
    errors = []
    
    namePattern = r'^[A-Za-z\s\-]+$'
    emailPattern = r'^[\w\.-]+@[\w\.-]+\.edu.ph$'
    passwordPattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,}$'
    
    if not id or not fname or not lname or not email or not password or not role:
        errors.append("Please complete the valid requirements.")
    if not id.isdigit():
        errors.append("School ID should be a number")
    if not re.match(namePattern, fname):
        errors.append("First name should only contain letters, spaces, or hyphens.")
    if not re.match(namePattern, lname):
        errors.append("Last name should only contain letters, spaces, or hyphens.")
    if not re.match(emailPattern, email):
        errors.append("Please enter a valid email address.")
    if not re.match(passwordPattern, password):
        errors.append(
            "Password must be at least 8 characters long, include uppercase, lowercase, a number, and at least 1 special character."
        )    
    if role not in ['student', 'teacher']:
        errors.append("Role must be student or teacher")
        
    return errors 

def modifyValidation(id, fname, lname, email, password, role) -> list:
    errors = []
    
    namePattern = r'^[A-Za-z\s\-]+$'
    emailPattern = r'^[\w\.-]+@[\w\.-]+\.edu.ph$'
    passwordPattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,}$'
    
    if not id or not fname or not lname or not email or not role:
        errors.append("Please complete the valid requirements.")
    if not id.isdigit():
        errors.append("School ID should be a number")
    if not re.match(namePattern, fname):
        errors.append("First name should only contain letters, spaces, or hyphens.")
    if not re.match(namePattern, lname):
        errors.append("Last name should only contain letters, spaces, or hyphens.")
    if not re.match(emailPattern, email):
        errors.append("Please enter a valid email address.")
    if not re.match(passwordPattern, password) and len(password) > 0:
        errors.append(
            "Password must be at least 8 characters long, include uppercase, lowercase, a number, and at least 1 special character."
        )    
    if role not in ['student', 'teacher']:
        errors.append("Role must be student or teacher")
        
    return errors   
    

if __name__ == '__main__':
    app.run(debug=True)