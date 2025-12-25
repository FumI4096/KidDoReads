from functools import wraps
from flask import abort, current_app
from flask_login import current_user
import uuid
import os
import boto3
from database.db import Database 
import json

ALLOWED_EXTENSIONS = set(['png', 'jpg', 'jpeg'])

def get_s3_client():
    """Initialize and return S3 client for DigitalOcean Spaces"""
    return boto3.client('s3',
        region_name=os.getenv('SPACES_REGION', 'sfo3'),
        endpoint_url=os.getenv('SPACES_ENDPOINT', 'https://sfo3.digitaloceanspaces.com'),
        aws_access_key_id=os.getenv('SPACES_KEY'),
        aws_secret_access_key=os.getenv('SPACES_SECRET')
    )

def get_spaces_url(filename, folder='uploads'):
    """Generate the public URL for a file in Spaces"""
    bucket_name = os.getenv('SPACES_BUCKET_NAME', 'kiddoreads')
    region = os.getenv('SPACES_REGION', 'sfo3')
    return f"https://{bucket_name}.{region}.cdn.digitaloceanspaces.com/{folder}/{filename}"

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

            'Here's the prefix:'

            'Let's check out this prefix:'

            'Suffix:'

            'The suffix for this one is:'

            'Get ready for the suffix:'

            Then say the actual prefix or suffix clearly and with enthusiasm. After that, pause for 2 seconds.
            
            MEANING Section
            Before reading the meaning, randomly choose one of the following lines:

            'Meaning:'

            'This means:'

            'The meaning is:'

            'What it stands for is:'

            'Here's what it means:'

            Then read the meaning in an upbeat tone. After that, pause for 2 seconds again.
            
            QUESTION Section
            Before reading the question, randomly choose one of the following lines:

            'Now your question:'

            'Here comes your challenge:'

            'Time for the question:'

            'Let me ask you this:'

            'Ready? Here's the question:'

            Then read the question clearly and encouragingly.
        """
    elif contentType == 5:
        return f"""Given the message, the first phrase is the title. The second phrase after the comma is the passage/story. Please read the following title passage with appropriate emotions that match the tone of the story.
        Use natural pacing, emphasize important words, and include slight pauses for dramatic effect when needed. Say the title first then pause for 2 seconds then read the passage.

        After finishing the passage, pause for 2 seconds then choose one random phrase from the list below and read it clearly with a curious, engaging tone:

        'So… what happens next?'

        'What do you think will happen after this?'

        'Can you guess what comes next?'

        'Hmm… what could possibly happen next?'

        'Alright, your turn—what happens next?'

        'Let's see if you can predict what comes after this.'

        'Now it's your move… what happens next?'

        Pause briefly before saying the chosen phrase."""
        
    elif contentType == 6:
        return f"""Please read the following passage with appropriate emotions that match the tone of the story.
        Use natural pacing, emphasize important words, and include slight pauses for dramatic effect when needed.

        After finishing the passage, pause for 2 seconds then choose one random phrase from the list below and read it clearly with a curious, engaging tone:

        'What do you think is happening in the picture?'

        'Can you tell what's going on in this picture?'
        
        'Look closely… what do you see happening here?'
        
        'What clues can you find in this picture?'
        """

def allowed_file(filename):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in ALLOWED_EXTENSIONS

def generate_unique_filename(original_filename):
    ext = original_filename.rsplit('.', 1)[1].lower()
    return f"{uuid.uuid4().hex}.{ext}"

def get_db():

    return Database()

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

def recalculate_scores_on_student_attempts(student_id, content_id):
    """Recalculate and update the scores for a given content item."""
    db = get_db()
    content_answer = db.get_content_answer(content_id)
    student_attempt_answers = db.get_student_activity_attempt_choices(student_id)
    # Extract the correct answer
    correct_answer_str = content_answer[1][0][0]  # Gets '["b", "b", "a", "a"]'
    correct_answer = json.loads(correct_answer_str)  # Gets ["b", "b", "a", "a"]
    
    new_scores = []  # List to store new scores

    for student_data in student_attempt_answers[1]:
        attemptid = student_data[0]
        current_score = student_data[1]
        student_answer_str = student_data[2]
        
        # Parse student answer
        student_answer_dict = json.loads(student_answer_str)
        student_answer = [student_answer_dict[str(i)] for i in range(len(student_answer_dict))]
        
        new_score = sum(1 for i in range(len(correct_answer)) if i < len(student_answer) and correct_answer[i] == student_answer[i])
        
        print(f"\nAttempt ID: {attemptid}")
        print(f"  Current Score: {current_score}")
        print(f"  Student Answer: {student_answer}")
        print(f"  New Score: {new_score}")
        
        new_scores.append(new_score)
    
    print("Content Answer:", correct_answer)
    print("Student Attempt Answers:", new_scores)
    
    return new_scores