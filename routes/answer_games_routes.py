from flask import Blueprint, render_template
from flask_login import login_required
from modules.utils import role_required

answer_games_bp = Blueprint('answer_games_bp', __name__)

@answer_games_bp.route('/word_audio_match_answer')
@login_required
@role_required('teacher', 'student')
def word_audio_match_answer():
    return render_template('games/answer/word-audio-matching-answer.html')

@answer_games_bp.route('/listen_and_choose_answer')
@login_required
@role_required('teacher', 'student')
def listen_and_choose_answer():
    return render_template('games/answer/listen-and-choose-answer.html')

@answer_games_bp.route('/sound_alike_match_answer')
@login_required
@role_required('teacher', 'student')
def sound_alike_match_answer():
    return render_template('games/answer/sound-alike-match-answer.html')

@answer_games_bp.route('/meaning_maker_answer')
@login_required
@role_required('teacher', 'student')
def meaning_maker_answer():
    return render_template('games/answer/meaning-maker-answer.html')

@answer_games_bp.route('/what_happens_next_answer')
@login_required
@role_required('teacher', 'student')
def what_happens_next_answer():
    return render_template('games/answer/what-happens-next-answer.html')

@answer_games_bp.route('/picture_clues_answer')
@login_required
@role_required('teacher', 'student')
def picture_clues_answer():
    return render_template('games/answer/picture-clues-answer.html')