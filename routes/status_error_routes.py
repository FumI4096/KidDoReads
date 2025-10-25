from flask import Blueprint, render_template

# Create a Blueprint instance
errors = Blueprint('errors', __name__)

@errors.app_errorhandler(400)
def bad_request():
    return render_template('error.html', type="400", error="Bad Request"), 400

@errors.app_errorhandler(401)
def unauthorized():
    return render_template('error.html', type="401", error="Unauthorized Access"), 401

@errors.app_errorhandler(403)
def forbidden():
    return render_template('error.html', type="403", error="Inaccessible to Enter this Page"), 403

@errors.app_errorhandler(404)
def not_found():
    return render_template('error.html', type="404", error="Page not Found"), 404

@errors.app_errorhandler(405)
def method_not_allowed():
    return render_template('error.html', type="405", error="Page not Available"), 405