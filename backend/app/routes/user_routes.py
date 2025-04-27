from flask import Blueprint, request, jsonify
from app.models import User
from app.extensions import db
import json

user_bp = Blueprint('user', __name__)

# 🔹 עדכון העדפות משתמש
@user_bp.route('/<int:user_id>', methods=['PUT'])
def update_preferences(user_id):
    data = request.get_json()

    user = User.query.get(user_id)
    if not user:
        return jsonify({"message": "User not found"}), 404

    user.preferences = json.dumps(data)
    db.session.commit()

    return jsonify({"message": "Preferences updated successfully"}), 200

# 🔹 שליפת העדפות משתמש
@user_bp.route('/<int:user_id>', methods=['GET'])
def get_preferences(user_id):
    user = User.query.get(user_id)

    if not user or not user.preferences:
        return jsonify({
            "dietary_restrictions": [],
            "allergies": [],
            "custom_allergies": "",
            "cooking_skill": "",
            "meal_prep": ""
        })

    return jsonify(json.loads(user.preferences))
