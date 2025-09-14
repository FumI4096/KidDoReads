from flask import Flask, flash, render_template, request, redirect, url_for, jsonify
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash
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
    return render_template('index.html')

@app.route('/admin')
def admin():
    return render_template('admin.html')

@app.route('/teacher_dashboard')
def teacher_dashboard():
    return render_template('teacher-dashboard.html')

@app.route('/student_dashboard')
def student_dashboard():
    return render_template('student-dashboard.html')

@app.route('/content_making')
def content_making():
    return render_template('quiz-making.html')

@app.route('/login', methods=['POST'])
def login():
    id = request.form.get('id')
    password = request.form.get('password')
    
    errors = loginValidation(id, password)
    
    if errors:
        return jsonify({"status": False, "errors": errors})
    else:
        role = db.get_role_by_id(id)
        
        if role[0].lower() == "student":
            return jsonify({'status': True, 'redirectUrl': 'student_dashboard'})
        elif role[0].lower() == "teacher":
            return jsonify({'status': True, 'redirectUrl': 'teacher_dashboard'})
        elif role[0].lower() == "admin":
            return jsonify({'status': True, 'redirectUrl': 'admin'})
        else:
            return jsonify({"status": False, "message": "Invalid role."})        

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
        elif role == "admin":
            db.insert_admin(int(id), fname, lname, email, password, filename)
            
            return jsonify({"status": True, "message": "Admin Inserted Successfully"})
            
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
    
@app.route('/admins', methods=['GET'])
def get_admin_record():
    try:
        status, results = db.get_admin_records()
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
    
@app.route('/update_content', methods=['POST'])
def update_content():
    content = request.form.get('content')
    teacherId = request.form.get('id')
    
    result = db.update_content(teacherId, content)
    
    if result is True:
        return jsonify({"status": True, "message": "Content Updated Successfully"})
    else:
        return jsonify({"status": False, "message": result})
        
def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def loginValidation(id, password) -> list:
    errors = []
    hashed_password = ""
    if not id or not password:
        errors.append("Please complete the valid requirements.")
        
        return errors
    if not id.isdigit():
        errors.append("School ID must be a number.")
        
    data = db.get_password_by_id(id)
    
    if data is None:
        errors.append("Invalid School ID. Please try again.")
    else:
        hashed_password = data[0]
    
    if not check_password_hash(hashed_password, password):
        errors.append("Invalid password. Please try again.")
    
    return errors
    

def regValidation(id, fname, lname, email, password, role) -> list:
    errors = []
    
    namePattern = r'^[A-Za-z\s\-]+$'
    emailPattern = r'^[\w\.-]+@[\w\.-]+\.edu.ph$'
    passwordPattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,}$'
    
    if not id or not fname or not lname or not email or not password or not role:
        errors.append("Please complete the valid requirements.")
        
        return errors
        
    isIdExist = db.id_exist(id, role)
    isEmailExist = db.email_exist(id, email, role)
        
    if not id.isdigit():
        errors.append("School ID should be a number")
    elif isIdExist:
        errors.append("School ID already exist.")
    elif isinstance(isIdExist, str):
        errors.append(isIdExist)
    if not re.match(namePattern, fname):
        errors.append("First name should only contain letters, spaces, or hyphens.")
    if not re.match(namePattern, lname):
        errors.append("Last name should only contain letters, spaces, or hyphens.")
    if not re.match(emailPattern, email):
        errors.append("Please enter a valid letran email address.")
    elif isEmailExist:
        errors.append("Email already exist.")
    elif isinstance(isEmailExist, str):
        errors.append(isEmailExist)        
    if not re.match(passwordPattern, password):
        errors.append(
            "Password must be at least 8 characters long, an uppercase, lowercase, a number."
        )  
    if role not in ['student', 'teacher']:
        errors.append("Role must be student or teacher.")
        
    return errors 

def modifyValidation(id, fname, lname, email, password, role) -> list:
    errors = []
    
    namePattern = r'^[A-Za-z\s\-]+$'
    emailPattern = r'^[\w\.-]+@[\w\.-]+\.edu.ph$'
    passwordPattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,}$'
    
    if not id or not fname or not lname or not email or not role:
        errors.append("Please complete the valid requirements.")
        return errors
        
    isIdExist = db.id_exist(id, role)
    isEmailExist = db.email_exist(id, email, role)
    
    if not id.isdigit():
        errors.append("School ID should be a number")
    elif isIdExist:
        errors.append("School ID already exist.")
    elif isinstance(isIdExist, str):
        errors.append(isIdExist)        
    if not re.match(namePattern, fname):
        errors.append("First name should only contain letters, spaces, or hyphens.")
    if not re.match(namePattern, lname):
        errors.append("Last name should only contain letters, spaces, or hyphens.")
    if not re.match(emailPattern, email):
        errors.append("Please enter a valid letran email address.")
    elif isEmailExist:
        errors.append("Email already exist.")
    elif isinstance(isEmailExist, str):
        errors.append(isEmailExist)   
    if not re.match(passwordPattern, password) and len(password) > 0:
        errors.append(
            "Password must be at least 8 characters long, an uppercase, lowercase, a number."
        )    
    if role not in ['student', 'teacher']:
        errors.append("Role must be student or teacher.")
        
    return errors   
    

if __name__ == '__main__':
    app.run(debug=True)