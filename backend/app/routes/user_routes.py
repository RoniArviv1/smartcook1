from flask import Blueprint, jsonify, request
from app.services.user_service import get_preferences, set_preferences

user_bp = Blueprint('user', __name__)


@user_bp.route('/<int:user_id>', methods=['GET'])
def get_preferences_route(user_id):
    prefs = get_preferences(user_id)
    return jsonify(prefs), 200


@user_bp.route('/<int:user_id>', methods=['PUT'])
def update_preferences_route(user_id):
    data = request.get_json() or {}
    success = set_preferences(user_id, data)
    if not success:
        return jsonify({"message": "User not found"}), 404
    return jsonify(data), 200
