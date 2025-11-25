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
    elif contentType == 3:
        return f"If the inputted text is a keyword or one word, pronounce this single word very clearly and naturally. But if the input is more than one word or its a sentence, read it naturally as a fluent English speaker and add EMOTION when NECESSARY."
    elif contentType == 4:
        return f"""
            Please read the following with an energetic and engaging tone. Each item is separated by commas with parentheses: the first part is the prefix or suffix, the second is the meaning, and the last is the question.

            For each section, choose one random energetic phrase from the lists below.
            Then follow the structure exactly:
            
            PREFIX / SUFFIX Section
            Before saying the prefix or suffix, randomly choose one of the following lines:

            'Prefix coming up:'

            'Here’s the prefix:'

            'Let’s check out this prefix:'

            'Suffix:'

            'The suffix for this one is:'

            'Get ready for the suffix:'

            Then say the actual prefix or suffix clearly and with enthusiasm. Then just pause for 2 seconds.
            
            MEANING Section
            Before reading the meaning, randomly choose one of the following lines:

            'Meaning:'

            'This means:'

            'The meaning is:'

            'What it stands for is:'

            'Here’s what it means:'

            Then read the meaning in an upbeat tone. Then pause for 2 seconds again.
            
            QUESTION Section
            Before reading the question, randomly choose one of the following lines:

            'Now your question:'

            'Here comes your challenge:'

            'Time for the question:'

            'Let me ask you this:'

            'Ready? Here’s the question:'

            Then read the question clearly and encouragingly.
        """
    elif contentType == 5:
        return f"""Please read the following passage with appropriate emotions that match the tone of the story.
        Use natural pacing, emphasize important words, and include slight pauses for dramatic effect when needed.

        After finishing the passage, choose one random phrase from the list below and read it clearly with a curious, engaging tone:

        'So… what happens next?'

        'What do you think will happen after this?'

        'Can you guess what comes next?'

        'Hmm… what could possibly happen next?'

        'Alright, your turn—what happens next?'

        'Let's see if you can predict what comes after this.'

        'Now it's your move… what happens next?'

        Pause briefly before saying the chosen phrase."""
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