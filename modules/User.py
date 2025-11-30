from flask_login import UserMixin, LoginManager
from modules.utils import get_db

login_manager = LoginManager()

class User(UserMixin):
    def __init__(self, id, role):
        self.id = id
        self.role = role
    
    def get_id(self):
        return str(self.id)

@login_manager.user_loader
def load_user(user_id):
    with get_db() as db:
        role = db.get_role_by_id(user_id)
        if role:
            return User(id=user_id, role=role[0].lower())
        return None