from flask import Blueprint, render_template
from flask_login import login_required
from modules.utils import role_required

edit_games_bp = Blueprint('edit_games_bp', __name__)

@edit_games_bp.route('/word_audio_match_edit')
@login_required
@role_required('teacher')
def word_audio_match():
    return render_template('games/edit/word-audio-match-edit.html')

@edit_games_bp.route('/listen_and_choose_edit')
@login_required
@role_required('teacher')
def listen_and_choose():
    return render_template('games/edit/listen-and-choose-edit.html')

@edit_games_bp.route('/sound_alike_match_edit')
@login_required
@role_required('teacher')
def sound_alike_match():
    return render_template('games/edit/sound-alike-match-edit.html')

@edit_games_bp.route('/meaning_maker_edit')
@login_required
@role_required('teacher')
def meaning_maker():
    return render_template('games/edit/meaning-maker-edit.html')

@edit_games_bp.route('/what_happens_next_edit')
@login_required
@role_required('teacher')
def what_happens_next():
    return render_template('games/edit/what-happens-next-edit.html')

@edit_games_bp.route('/picture_clues_edit')
@login_required
@role_required('teacher')
def picture_clues():
    return render_template('games/edit/picture-clues-edit.html')