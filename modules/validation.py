from modules.utils import get_db
from werkzeug.security import check_password_hash
import re

def loginValidation(id, password) -> list:
    db = get_db()
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
    db = get_db()
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
    db = get_db()
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