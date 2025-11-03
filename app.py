from flask import Flask
from dotenv import load_dotenv
import os
from database.db import Database
from modules.User import login_manager
from api.auth_api import auth_bp
from api.user_api import user_bp
from api.contents_api import contents_bp
from api.attempt_api import attempt_bp
from api.tts_api import tts_bp
from routes.status_error_routes import errors
from routes.home_routes import home_bp
from routes.edit_games_routes import edit_games_bp
from routes.answer_games_routes import answer_games_bp

load_dotenv()

UPLOAD_FOLDER = 'static/uploads'
UPLOAD_AUDIO = 'static/upload_audio'
os.makedirs(UPLOAD_AUDIO, exist_ok=True)
db = Database()
app = Flask(__name__)
app.config['SECRET_KEY'] = os.getenv('KEY')
app.config['TTS_KEY'] = os.getenv('TTS_API_KEY')
app.config['UPLOAD_FOLDER'] = UPLOAD_FOLDER
app.config['UPLOAD_AUDIO'] = UPLOAD_AUDIO
app.config["PROPAGATE_EXCEPTIONS"] = False
app.config['db'] = db

login_manager.login_view = 'home'
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


if __name__ == '__main__':
    app.run(debug=True)