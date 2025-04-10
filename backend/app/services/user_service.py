from app import db
from app.models import User

def get_preferences(user_id):
    user = User.query.get(user_id)
    return user.preferences or {}

def set_preferences(user_id, data):
    user = User.query.get(user_id)
    user.preferences = data
    db.session.commit()
    return user
