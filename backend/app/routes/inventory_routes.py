from flask import Blueprint, request, jsonify
from app.extensions import db
from app.models import InventoryItem
from app.services import inventory_service
from datetime import datetime

inventory_bp = Blueprint("inventory", __name__)

# 🔹 שליפה – GET /api/inventory/<user_id>
@inventory_bp.route("/<int:user_id>", methods=["GET"])
def get_inventory(user_id):
    items = inventory_service.get_user_inventory(user_id)
    inventory = [
        {
            "id": item.id,
            "name": item.name,
            "category": item.category,
            "quantity": item.quantity,
            "unit": item.unit,
            "expiry_date": item.expiration_date.isoformat()
            if item.expiration_date
            else None,
        }
        for item in items
    ]
    return jsonify({"inventory": inventory})

# 🔹 הוספה – POST /api/inventory/<user_id>
@inventory_bp.route("/<int:user_id>", methods=["POST"])
def add_item(user_id):
    data = request.get_json()
    item = inventory_service.add_inventory_item(user_id, data)
    return (
        jsonify(
            {
                "id": item.id,
                "name": item.name,
                "category": item.category,
                "quantity": item.quantity,
                "unit": item.unit,
                "expiry_date": item.expiration_date.isoformat()
                if item.expiration_date
                else None,
            }
        ),
        201,
    )

# 🔹 מחיקה – DELETE /api/inventory/<user_id>/<item_id>
@inventory_bp.route("/<int:user_id>/<int:item_id>", methods=["DELETE"])
def delete_item(user_id, item_id):
    item = inventory_service.delete_inventory_item(user_id, item_id)
    if not item:
        return jsonify(message="Item not found"), 404
    return jsonify(message="Item deleted successfully"), 200

# 🔹 עדכון – PUT /api/inventory/<user_id>/<item_id>
@inventory_bp.route("/<int:user_id>/<int:item_id>", methods=["PUT"])
def update_item(user_id, item_id):
    data = request.get_json()
    item = InventoryItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return jsonify(message="Item not found"), 404

    item.name = data.get("name", item.name)
    item.category = data.get("category", item.category)
    item.quantity = data.get("quantity", item.quantity)
    item.unit = data.get("unit", item.unit)

    if data.get("expiry_date"):
        item.expiration_date = datetime.fromisoformat(data["expiry_date"])

    db.session.commit()
    return jsonify(message="Item updated successfully"), 200
