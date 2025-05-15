from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.extensions import db
from app.models import InventoryItem
from datetime import datetime, timedelta

notification_bp = Blueprint('notification', __name__)

@notification_bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    user_id = get_jwt_identity()
    today = datetime.today().date()
    upcoming = today + timedelta(days=3)

    items = InventoryItem.query.filter(
        InventoryItem.user_id == user_id,
        InventoryItem.expiration_date <= upcoming
    ).all()

    notifications = [
        {"name": item.name, "expires_in_days": (item.expiration_date - today).days}
        for item in items
    ]

    return jsonify(notifications)