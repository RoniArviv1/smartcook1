# app/services/user_service.py
from app.extensions import db
from app.models import User
import secrets
from werkzeug.security import generate_password_hash

DEFAULT_PREFS = {
    "dietary": [],
    "allergies": [],
    "additionalAllergies": "",
    "skillLevel": "",
    "mealPrep": "",
}

# ---------------------
# Preferences Logic
# ---------------------

def get_preferences(user_id: int) -> dict:
    user = User.query.get(user_id)
    return user.preferences if user and user.preferences else DEFAULT_PREFS.copy()


def set_preferences(user_id: int, data: dict) -> bool:
    user = User.query.get(user_id)
    if user is None:
        user = User(
            username=f"user{user_id}",
            email=f"user{user_id}@example.com",
            password_hash=secrets.token_hex(16),
            preferences=DEFAULT_PREFS.copy(),
        )
        db.session.add(user)

    user.preferences = data
    db.session.commit()
    return True

# ---------------------
# Profile Logic
# ---------------------

def get_profile(user_id: int) -> dict:
    user = User.query.get(user_id)
    if not user:
        return {}

    return {
        "firstName": user.first_name or "",
        "lastName": user.last_name or "",
        "email": user.email,
        "image": user.image_url or "",
        "password": "",  # לעולם לא מחזירים סיסמה
    }

def update_profile(user_id: int, data: dict) -> bool:
    user = User.query.get(user_id)
    if not user:
        return False

    user.first_name = data.get("firstName", user.first_name)
    user.last_name = data.get("lastName", user.last_name)
    user.email = data.get("email", user.email)

    # עדכון תמונה אם יש
    if "image" in data:
        user.image_url = data["image"]

    # עדכון סיסמה רק אם שדה הסיסמה לא ריק
    password = data.get("password")
    if password:
        user.set_password(password)

    db.session.commit()
    return True

