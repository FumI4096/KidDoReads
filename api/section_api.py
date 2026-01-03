from flask import Blueprint, request, jsonify
from modules.utils import get_db
from flask_login import login_required
import json
import os

section_bp = Blueprint('section_bp', __name__)

@section_bp.route('/sections', methods=['GET'])
@login_required
def get_sections():
    try:
        with get_db() as db:
            result = db.get_section()
            rows = result
            sections = []
            for row in rows:
                sections.append({
                    'id': row[0],
                    'name': row[1],
                    'grade': row[2]
                })
            return jsonify({'status': True, 'data': sections})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@section_bp.route('/insert_section', methods=['POST'])
@login_required
def insert_section():
    try:
        data = request.get_json()
        name = data.get('sectionName')
        with get_db() as db:
            status, message = db.insert_section(name)
            if status:
                return jsonify({'status': True, 'message': message})
            else:
                return jsonify({'status': False, 'message': message})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@section_bp.route('/update_section', methods=['PATCH'])
@login_required
def update_section():
    try:
        data = request.get_json()
        name = data.get('sectionName')
        id = data.get('sectionId')
        with get_db() as db:
            status, message = db.update_section(id, name)
            if status:
                return jsonify({'status': True, 'message': message})
            else:
                return jsonify({'status': False, 'message': message})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@section_bp.route('/delete_section', methods=['DELETE'])
@login_required
def delete_section():
    try:
        data = request.get_json()
        id = data.get('sectionId')
        with get_db() as db:
            status, message = db.delete_section(id)
            if status:
                return jsonify({'status': True, 'message': message})
            else:
                return jsonify({'status': False, 'message': message})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@section_bp.route('/section/<int:teacher_id>', methods=['GET'])
def get_assigned_sections(teacher_id):
    try:
        with get_db() as db:
            status, result = db.get_assigned_sections_of_teacher(teacher_id)
            if status:
                assigned_sections = json.loads(result)
                return jsonify({'status': True, 'data': assigned_sections})
            else:
                return jsonify({'status': False, 'message': result})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})
    
@section_bp.route('/assign_sections', methods=['PATCH'])
def assign_sections_to_teachers():
    try:
        data = request.get_json()
        sections = data.get('sections')
        teacher_id = data.get('teacherId')
        
        sections_json = json.dumps(sections)
        
        with get_db() as db:
            status, message = db.assign_section_to_teacher(teacher_id, sections_json)
            if status:
                print(sections)
                return jsonify({'status': True, 'message': message})
            else:
                return jsonify({'status': False, 'message': message})
    except Exception as e:
        return jsonify({'status': False, 'message': str(e)})