from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import User

user_bp = Blueprint('user', __name__)

@user_bp.route('/preferences', methods=['GET'])
@jwt_required()
def get_preferences():
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    return jsonify(user.preferences or {})

@user_bp.route('/preferences', methods=['POST'])
@jwt_required()
def set_preferences():
    user_id = get_jwt_identity()
    data = request.get_json()
    user = User.query.get(user_id)
    user.preferences = data
    db.session.commit()
    return jsonify(message="Preferences updated successfully")
