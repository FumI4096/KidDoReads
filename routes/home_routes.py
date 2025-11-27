from flask import Blueprint, render_template
from flask_login import login_required
from modules.utils import role_required

home_bp = Blueprint('home_bp', __name__)

@home_bp.route('/')
def home():
    return render_template('index.html')

@home_bp.route('/admin')
# @login_required
# @role_required('admin')
def admin_dashboard():
    return render_template('admin/admin-dashboard.html')

@home_bp.route('/teacher_dashboard')
@login_required
@role_required('teacher')
def teacher_dashboard():
    return render_template('teacher/teacher-dashboard.html')

@home_bp.route('/student_dashboard')
@login_required
@role_required('student')
def student_dashboard():
    return render_template('student/student-dashboard.html')