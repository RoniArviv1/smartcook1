from app import db
from app.models import User

def register_user(data):
    if User.query.filter_by(email=data['email']).first():
        return None
    user = User(username=data['username'], email=data['email'])
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return user

def authenticate_user(data):
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        return user
    return None
