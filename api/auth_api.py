from flask import Blueprint, request, redirect, url_for, jsonify
from flask_login import login_user, logout_user
from werkzeug.utils import secure_filename
from modules.utils import get_db
from modules.validation import loginValidation, regValidation
from modules.User import User
from modules.utils import allowed_file, get_upload_folder, get_s3_client, get_spaces_url
import os
import time
import pandas as pd
import numpy as np
from botocore.exceptions import ClientError
from werkzeug.security import generate_password_hash

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
        
@auth_bp.route('/import-students', methods=['POST'])
def import_students():
    try:
        # Check if file is in the request
        if 'import_file' not in request.files:
            return jsonify({
                "status": False,
                "message": "No file provided"
            }), 400
        
        file = request.files['import_file']
        
        # Check if file is selected
        if file.filename == '':
            return jsonify({
                "status": False,
                "message": "No file selected"
            }), 400
        
        # Check if file is CSV
        if not file.filename.endswith('.csv'):
            return jsonify({
                "status": False,
                "message": "File must be in CSV format"
            }), 400
        
        # Get section from form data
        section = request.form.get("section")
        
        print("=" * 50)
        print("IMPORT STUDENTS - DEBUG INFO")
        print("=" * 50)
        print(f"Filename: {file.filename}")
        print(f"Section: {section}")
        print("-" * 50)
        
        # Read CSV with pandas
        df = pd.read_csv(file)
        
        # Strip whitespace from column names
        df.columns = df.columns.str.strip()
        
        print("DataFrame Info:")
        print(df.info())
        print("-" * 50)
        
        print("DataFrame Head (first 5 rows):")
        print(df.head())
        print("-" * 50)
        
        # Validate CSV headers - case insensitive check
        required_columns = ['ID', 'First Name', 'Last Name', 'Email']
        df_columns_lower = [col.lower() for col in df.columns]
        
        missing_columns = []
        for req_col in required_columns:
            if req_col.lower() not in df_columns_lower:
                missing_columns.append(req_col)
        
        if missing_columns:
            return jsonify({
                "status": False,
                "message": f"CSV is missing columns: {', '.join(missing_columns)}. Found columns: {', '.join(df.columns.tolist())}"
            }), 400
        
        # Standardize column names
        column_mapping = {}
        for col in df.columns:
            col_lower = col.lower()
            if col_lower == 'id':
                column_mapping[col] = 'ID'
            elif col_lower == 'first name':
                column_mapping[col] = 'First Name'
            elif col_lower == 'last name':
                column_mapping[col] = 'Last Name'
            elif col_lower == 'email':
                column_mapping[col] = 'Email'
        
        df = df.rename(columns=column_mapping)
        
        # Strip whitespace from all string columns
        for col in df.columns:
            if df[col].dtype == 'object':
                df[col] = df[col].astype(str).str.strip()
        
        # Check for missing required fields
        required_cols = ['ID', 'First Name', 'Last Name', 'Email']
        if df[required_cols].isnull().any().any():
            empty_rows = df[df[required_cols].isnull().any(axis=1)].index + 2
            return jsonify({
                "status": False,
                "message": f"Missing required fields in rows: {empty_rows.tolist()}"
            }), 400
        
        # Check for duplicate IDs in the CSV
        duplicate_ids = df[df['ID'].duplicated()]['ID'].unique()
        if len(duplicate_ids) > 0:
            return jsonify({
                "status": False,
                "message": f"Duplicate Student IDs found in file: {duplicate_ids.tolist()}"
            }), 400
        
        errors = []
        students_data = []
        default_password = "Letrankdr123"
        
        print("Processing rows:")
        # Validate each row
        for idx, row in df.iterrows():
            row_num = idx + 2
            student_id = str(row['ID'])
            fname = row['First Name']
            lname = row['Last Name']
            email = row['Email']
            
            print(f"Row {row_num}: ID={student_id}, Name={fname} {lname}, Email={email}")
            
            # Validate individual fields
            row_errors = regValidation(student_id, fname, lname, email, default_password, "student", section)
            
            if row_errors:
                error_messages = ", ".join(row_errors)
                errors.append(f"Row {row_num}: {error_messages}")
                print(f"  ERROR: {error_messages}")
                continue
            
            students_data.append({
                'id': int(student_id),
                'fname': fname,
                'lname': lname,
                'email': email,
                'section': section
            })
            print(f"  ✓ Valid")
        
        print("-" * 50)
        print(f"Total students to import: {len(students_data)}")
        print(f"Total errors: {len(errors)}")
        print("-" * 50)
        
        # If there are validation errors
        if errors:
            print("Validation Errors:")
            for error in errors:
                print(f"  - {error}")
            print("=" * 50)
            return jsonify({
                "status": False,
                "message": "Validation errors found",
                "errors": errors
            }), 400
        
        # If no students to import
        if not students_data:
            return jsonify({
                "status": False,
                "message": "No valid students found in the CSV file"
            }), 400
        
        # Prepare data for bulk insert
        print("Preparing bulk insert data...")
        hashed_password = generate_password_hash(default_password)
        
        bulk_data = [
            (
                student['id'],           # StudentID
                student['fname'],        # FirstName
                student['lname'],        # LastName
                student['email'],        # Email
                hashed_password,         # S_Password
                None,                    # Image
                student['section']       # SectionID
            )
            for student in students_data
        ]
        
        print(f"Prepared {len(bulk_data)} students for bulk insert")
        print("-" * 50)
        
        with get_db() as db:
            success, message, count = db.bulk_insert_students(bulk_data)
            
            if success:
                print(f"✓ {message} Count: {count}")
                print("=" * 50)
                return jsonify({
                    "status": True,
                    "message": f"Successfully imported {count} students",
                    "success_count": count
                }), 200
            else:
                print(f"✗ Bulk insert failed: {message}")
                print("=" * 50)
                return jsonify({
                    "status": False,
                    "message": f"Bulk insert failed: {message}. No students were added."
                }), 500
        
    except Exception as e:
        print("=" * 50)
        print(f"ERROR: {str(e)}")
        print("=" * 50)
        import traceback
        traceback.print_exc()
        return jsonify({
            "status": False,
            "message": f"Server error: {str(e)}"
        }), 500