# app/services/user_service.py
from app.extensions import db
from app.models import User
import secrets              # ל-password_hash זמני

DEFAULT_PREFS = {
    "dietary": [],
    "allergies": [],
    "additionalAllergies": "",
    "skillLevel": "",
    "mealPrep": "",
}

def get_preferences(user_id: int) -> dict:
    user = User.query.get(user_id)
    return user.preferences if user and user.preferences else DEFAULT_PREFS.copy()


def set_preferences(user_id: int, data: dict) -> bool:
    """Create-or-update user preferences."""
    user = User.query.get(user_id)

    # 🆕  אם המשתמש לא קיים – ניצור אחד בסיסי
    if user is None:
        user = User(
            username=f"user{user_id}",
            email=f"user{user_id}@example.com",
            password_hash=secrets.token_hex(16),   # סיסמה אקראית שלא תשמש להתחברות
            preferences=DEFAULT_PREFS.copy(),
        )
        db.session.add(user)

    # שמירה / עדכון ההעדפות
    user.preferences = data
    db.session.commit()
    return True

def register_user(data):
    # בדיקה אם המייל כבר קיים
    if User.query.filter_by(email=data['email']).first():
        return None

    # בדיקה אם שם המשתמש כבר קיים
    if User.query.filter_by(username=data['username']).first():
        return None

    user = User(
        username=data['username'],
        email=data['email']
    )
    user.set_password(data['password'])
    db.session.add(user)
    db.session.commit()
    return user


def authenticate_user(data):
    user = User.query.filter_by(email=data['email']).first()
    if user and user.check_password(data['password']):
        return user
    return None