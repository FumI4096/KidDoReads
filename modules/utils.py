from functools import wraps
from flask import abort, current_app
from flask_login import current_user
import uuid

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

def tts_prompt(contentType):
    if contentType == 1:
        return f"Pronounce this single word very clearly and naturally. Speak it exactly as it is pronounced in English"
    elif contentType == 2:
        return f"Pronounce the following word slowly, breaking it into syllables. Pause clearly between each syllable. Do NOT add extra words"
    # elif contentType == 3:
    #     return f"Pronounce this single word very clearly and naturally. Speak it exactly as it is pronounced in English. Say only the word. Now say: {keyword}"
    # elif contentType == 4:
    #     return f"Pronounce the following word slowly, breaking it into syllables. Pause clearly between each syllable. Do NOT add extra words. Now say: {keyword}"
    # elif contentType == 5:
    #     return f"Pronounce this single word very clearly and naturally. Speak it exactly as it is pronounced in English. Say only the word. Now say: {keyword}"
    # elif contentType == 6:
    #     return f"Pronounce the following word slowly, breaking it into syllables. Pause clearly between each syllable. Do NOT add extra words. Now say: {keyword}"

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename):
    ext = original_filename.rsplit('.', 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"

def get_db():
    return current_app.config['db']

def get_upload_folder():
    return current_app.config['UPLOAD_FOLDER']

def get_upload_audio():
    return current_app.config['UPLOAD_AUDIO']

def get_upload_picture_clues():
    return current_app.config['UPLOAD_IMAGE_PICTURE_CLUES']

def get_tts_key():
    return current_app.config['TTS_KEY']

def get_chatbot_key():
    return current_app.config['CHATBOT_KEY']