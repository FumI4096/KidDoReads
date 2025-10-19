from flask import Flask, render_template, request, redirect, url_for, jsonify, abort
from flask_login import login_user, current_user, login_required, logout_user
from werkzeug.utils import secure_filename
from werkzeug.security import check_password_hash
from database.db import Database
from dotenv import load_dotenv
import json
import os
import re
from functools import wraps
from blueprints.ErrorHandler import errors
from modules.User import login_manager, User

load_dotenv()

UPLOAD_FOLDER = 'static/uploads'
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('KEY')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config["PROPAGATE_EXCEPTIONS"] = False
ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])
db = Database()

login_manager.login_view = 'home'
login_manager.init_app(app)
app.register_blueprint(errors)

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

#MAIN PAGES
@app.route('/')
def home():
    return render_template('index.html')

@app.route('/admin')    
@login_required
@role_required('admin')
def admin():
    return render_template('admin/admin-dashboard.html')

@app.route('/teacher_dashboard')
@login_required
@role_required('teacher')
def teacher_dashboard():
    return render_template('teacher/teacher-dashboard.html')

@app.route('/student_dashboard')
@login_required
@role_required('student')
def student_dashboard():
    return render_template('student/student-dashboard.html')

#PAGES FOR EDITING ACTIVITIES
@app.route('/word_audio_match_edit')
@login_required
@role_required('teacher')
def word_audio_match():
    return render_template('games/edit/word-audio-match-edit.html')

@app.route('/listen_and_choose_edit')
@login_required
@role_required('teacher')
def listen_and_choose():
    return render_template('games/edit/listen-and-choose-edit.html')

@app.route('/sound_alike_match_edit')
@login_required
@role_required('teacher')
def sound_alike_match():
    return render_template('games/edit/sound-alike-match-edit.html')

@app.route('/meaning_maker_edit')
@login_required
@role_required('teacher')
def meaning_maker():
    return render_template('games/edit/meaning-maker-edit.html')

@app.route('/what_happens_next_edit')
@login_required
@role_required('teacher')
def what_happens_next():
    return render_template('games/edit/what-happens-next-edit.html')

@app.route('/picture_clues_edit')
@login_required
@role_required('teacher')
def picture_clues():
    return render_template('games/edit/picture-clues-edit.html')


#PAGES FOR ANSWERING ACTIVITIES
@app.route('/word_audio_match_answer')
@login_required
@role_required('teacher', 'student')
def word_audio_match_answer():
    return render_template('games/answer/word-audio-matching-answer.html')

@app.route('/listen_and_choose_answer')
@login_required
@role_required('teacher', 'student')
def listen_and_choose_answer():
    return render_template('games/answer/listen-and-choose-answer.html')

@app.route('/sound_alike_match_answer')
@login_required
@role_required('teacher', 'student')
def sound_alike_match_answer():
    return render_template('games/answer/sound-alike-match-answer.html')

@app.route('/meaning_maker_answer')
@login_required
@role_required('teacher', 'student')
def meaning_maker_answer():
    return render_template('games/answer/meaning-maker-answer.html')

@app.route('/what_happens_next_answer')
@login_required
@role_required('teacher', 'student')
def what_happens_next_answer():
    return render_template('games/answer/what-happens-next-answer.html')

@app.route('/picture_clues_answer')
@login_required
@role_required('teacher', 'student')
def picture_clues_answer():
    return render_template('games/answer/picture-clues-answer.html')

@app.route('/logout')
def logout():
    logout_user()
    return redirect(url_for('home'))

@app.route('/login', methods=['POST'])
def login():
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
        
        if user.role  == "student":
            return jsonify({'status': True, 'redirectUrl': 'student_dashboard', "id": id, "role": user.role})
        elif user.role == "teacher":
            return jsonify({'status': True, 'redirectUrl': 'teacher_dashboard', "id": id, "role": user.role})
        elif user.role == "admin":
            return jsonify({'status': True, 'redirectUrl': 'admin', "id": id})
        else:
            return jsonify({"status": False, "message": "Invalid role."}), 400        

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
@login_required
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
@login_required
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
@login_required
def get_admin_record():
    try:
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

@app.route('/modify_user', methods=['POST'])
@login_required
def modify_user():
    try:
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
            image.save(os.path.join(app.config['UPLOAD_FOLDER'], filename))
            
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
@login_required
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
    
@app.route('/user/<string:id>', methods=['GET'])
@login_required
def get_user(id):
    try:
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

@app.route('/contents', methods=['POST'])
def create_content():
    try:
        teacher_id = request.form.get('teacher_id')
        content_title = request.form.get('content_title')
        content_type = request.form.get('content_type')
        
        
        db.create_content(int(teacher_id), content_title, content_type)
        
        return jsonify({"status": True, "message": "Content Created Successfully"})
            
    except Exception as e:
        return jsonify({"status": False, "message": str(e)})
    
    
@app.route('/contents/<string:teacher_id>', methods=['GET'])
def get_contents(teacher_id):
    try:
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
    
@app.route('/students/contents/<int:type>')
def get_contents_for_students(type):
    try:
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
@app.route('/update_content', methods=['POST'])
@login_required
def update_content():
    content = request.form.get('content')
    teacherId = request.form.get('id')
    content_name = request.form.get('content_name')
    
    result = db.update_content(teacherId, content_name, content)
    
    if result is True:
        return jsonify({"status": True, "message": "Content Updated Successfully"})
    else:
        return jsonify({"status": False, "message": result})
    
#switch to id
@app.route('/content/<string:teacher_id>/<int:content_id>', methods=['DELETE'])
@login_required
def delete_content(teacher_id, content_id):
    
    result, message = db.delete_content(teacher_id, content_id)
    
    if result is True:
        return jsonify({"status": True, "message": message})
    else:
        return jsonify({"status": False, "message": message})
    
@app.route('/content/<int:teacher_id>/<int:content_id>/<int:hide>', methods=["PATCH"])
@login_required
def unhide_content(teacher_id, content_id, hide):
    result, message = db.hide_content(teacher_id, content_id, hide)
    
    if result is True:
        return jsonify({"status": True, "message": message})
    else:
        return jsonify({"status": False, "message": message})
        
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
    emailPattern = r'^[\w\.-]+@letran-calamba\.edu\.ph$'
    passwordPattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,}$'
    
    if not id or not fname or not lname or not email or not password or not role:
        errors.append("Please complete the valid requirements.")
        
        return errors
        
    isIdExist = db.id_exist(id)
    isEmailExist = db.email_exist(email)
        
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
        errors.append("Please enter a valid Letran email address.")
    elif isEmailExist:
        errors.append("Email already exist.")
    elif isinstance(isEmailExist, str):
        errors.append(isEmailExist)        
    if not re.match(passwordPattern, password):
        errors.append(
            "Password must be at least 8 characters long, an uppercase, lowercase, and a number."
        )  
    if role not in ['student', 'teacher', 'admin']:
        errors.append("Role must be student, teacher or admin.")
        
    return errors 

def modifyValidation(id, original_id, fname, lname, email, original_email, password, role) -> list:
    errors = []
    
    namePattern = r'^[A-Za-z\s\-]+$'
    emailPattern = r'^[\w\.-]+@letran-calamba\.edu\.ph$'
    passwordPattern = r'^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)\S{8,}$'
    
    if not id or not fname or not lname or not email or not role:
        errors.append("Please complete the valid requirements.")
        return errors
        
    isIdExist = db.id_exist(id)
    isEmailExist = db.email_exist(email)
    
    if not id.isdigit():
        errors.append("School ID should be a number")
    elif isIdExist and id != original_id:
        errors.append("School ID already exist.")
    elif isinstance(isIdExist, str):
        errors.append(isIdExist)
    if not re.match(namePattern, fname):
        errors.append("First name should only contain letters, spaces, or hyphens.")
    if not re.match(namePattern, lname):
        errors.append("Last name should only contain letters, spaces, or hyphens.")
    if not re.match(emailPattern, email):
        errors.append("Please enter a valid letran email address.")
    elif isEmailExist and email != original_email:
        errors.append("Email already exist.")
    elif isinstance(isEmailExist, str):
        errors.append(isEmailExist)     
    if not re.match(passwordPattern, password) and len(password) > 0:
        errors.append(
            "Password must be at least 8 characters long, an uppercase, lowercase, a number."
        )    
    if role not in ['student', 'teacher', 'admin']:
        errors.append("Role must be student, teacher or admin.")
        
    return errors   

if __name__ == '__main__':
    app.run(debug=True)