from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # הוספת האבטחה
from datetime import datetime

from app.extensions import db
from app.models import InventoryItem
from app.services import inventory_service

# שימי לב: שינינו את ה-url_prefix שיהיה פשוט יותר
inventory_bp = Blueprint("inventory", __name__, url_prefix="/api/inventory")

# --------------------------------------------------------------------------- #
#                               Helper – formatter                            #
# --------------------------------------------------------------------------- #
def _item_to_dict(item: InventoryItem) -> dict:
    return {
        "id": item.id,
        "name": item.name,
        "category": item.category,
        "quantity": item.quantity,
        "unit": item.unit,
        "expiration_date": item.expiration_date.isoformat() if item.expiration_date else None,
        "nutrition": {
            "calories": item.calories,
            "protein": item.protein,
            "carbs": item.carbs,
            "fat": item.fat,
        },
    }

# --------------------------------------------------------------------------- #
#                               🔹 שליפה – GET                                #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/", methods=["GET"]) # הורדנו את ה-ID מהכתובת
@jwt_required()
def get_inventory():
    user_id = get_jwt_identity() # מזהה את המשתמש מה-Token
    items = inventory_service.get_user_inventory(user_id)
    return jsonify({"inventory": [_item_to_dict(i) for i in items]})

# --------------------------------------------------------------------------- #
#                               🔹 הוספה – POST                               #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/", methods=["POST"]) # הורדנו את ה-ID מהכתובת
@jwt_required()
def add_item():
    user_id = get_jwt_identity()
    data = request.get_json(force=True)
    item = inventory_service.add_inventory_item(user_id, data)
    return jsonify(_item_to_dict(item)), 201

# --------------------------------------------------------------------------- #
#                              🔹 עדכון – PUT                                 #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/<int:item_id>", methods=["PUT"]) # רק ה-ID של המצרך נשאר
@jwt_required()
def update_item(item_id: int):
    user_id = get_jwt_identity()
    data = request.get_json(force=True)
    item = inventory_service.update_inventory_item(user_id, item_id, data)
    if not item:
        return jsonify(message="Item not found"), 404
    return jsonify(_item_to_dict(item)), 200

# --------------------------------------------------------------------------- #
#                             🔹 מחיקה – DELETE                               #
# --------------------------------------------------------------------------- #
@inventory_bp.route("/<int:item_id>", methods=["DELETE"]) # רק ה-ID של המצרך נשאר
@jwt_required()
def delete_item(item_id: int):
    user_id = get_jwt_identity()
    item = inventory_service.delete_inventory_item(user_id, item_id)
    if not item:
        return jsonify(message="Item not found"), 404
    return jsonify(message="Item deleted successfully"), 200
