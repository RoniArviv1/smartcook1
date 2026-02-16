from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.user_service import (
    get_preferences, set_preferences,
    get_profile, update_profile
)

user_bp = Blueprint('user', __name__)

# ---------------------
# Preferences Routes
# ---------------------

@user_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences_route():
    # השרת מבין לבד מי המשתמש מתוך ה-Token
    user_id = get_jwt_identity()
    prefs = get_preferences(user_id)
    return jsonify(prefs), 200

@user_bp.route('/preferences', methods=['PUT'])
@jwt_required()
def update_preferences_route():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    success = set_preferences(user_id, data)
    if not success:
        return jsonify({"message": "User not found"}), 404
    return jsonify(data), 200

# ---------------------
# Profile Routes
# ---------------------

@user_bp.route('/profile', methods=['GET'])
@jwt_required()
def get_profile_route():
    user_id = get_jwt_identity()
    profile = get_profile(user_id)
    if not profile:
        return jsonify({"message": "User not found"}), 404
    return jsonify(profile), 200

@user_bp.route('/profile', methods=['PUT'])
@jwt_required()
def update_profile_route():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    success = update_profile(user_id, data)
    if not success:
        return jsonify({"message": "User not found or update failed"}), 404
    return jsonify({"message": "Profile updated successfully"}), 200
