from functools import wraps
from flask import abort, current_app
from flask_login import current_user

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

def role_required(*roles):
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if not current_user.is_authenticated or current_user.role not in roles:
                abort(403)
            return f(*args, **kwargs)
        return decorated_function
    return decorator

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def get_db():
    return current_app.config['db']

def get_upload_folder():
    return current_app.config['UPLOAD_FOLDER']