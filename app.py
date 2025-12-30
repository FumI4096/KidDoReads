from flask import Flask
from flask_cors import CORS
from dotenv import load_dotenv
import os
from modules.cache import init_cache
from modules.User import login_manager
from api.auth_api import auth_bp
from api.user_api import user_bp
from api.contents_api import contents_bp
from api.attempt_api import attempt_bp
from api.tts_api import tts_bp
from api.chatbot_api import chatbot_bp
from api.achievement_tracker_api import achievement_bp
from api.section_api import section_bp
from routes.status_error_routes import errors
from routes.home_routes import home_bp
from routes.edit_games_routes import edit_games_bp
from routes.answer_games_routes import answer_games_bp

load_dotenv()

UPLOAD_FOLDER = 'static/uploads'
UPLOAD_IMAGE_PICTURE_CLUES = 'static/upload_picture_clues'
UPLOAD_AUDIO = 'static/upload_audio'
os.makedirs(UPLOAD_AUDIO, exist_ok=True)
app = Flask(__name__)
CORS(app, resources={
    r"/*": {
        "origins": ["https://kiddoreads.app", "https://www.kiddoreads.app"],  # Include both with/without www
        "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
        "allow_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True  # If you're using cookies/sessions
    }
})
init_cache(app)
app.config['SECRET_KEY'] = os.getenv('KEY')
app.config['TTS_KEY'] = os.getenv('TTS_API_KEY')
app.config['CHATBOT_KEY'] = os.getenv('CHATBOT_API_KEY')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_IMAGE_PICTURE_CLUES'] = UPLOAD_IMAGE_PICTURE_CLUES
app.config['UPLOAD_AUDIO'] = UPLOAD_AUDIO
app.config["PROPAGATE_EXCEPTIONS"] = False

login_manager.login_view = 'auth_bp.login'
login_manager.init_app(app)
app.register_blueprint(errors)   
app.register_blueprint(edit_games_bp)
app.register_blueprint(answer_games_bp)   
app.register_blueprint(home_bp)
app.register_blueprint(auth_bp)
app.register_blueprint(user_bp)
app.register_blueprint(contents_bp)
app.register_blueprint(attempt_bp)
app.register_blueprint(tts_bp)
app.register_blueprint(chatbot_bp)
app.register_blueprint(achievement_bp)
app.register_blueprint(section_bp)


if __name__ == '__main__':
    app.run(debug=True)