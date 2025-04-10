from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services import inventory_service

inventory_bp = Blueprint('inventory', __name__)

@inventory_bp.route('/', methods=['GET'])
@jwt_required()
def get_inventory():
    user_id = get_jwt_identity()
    items = inventory_service.get_user_inventory(user_id)
    return jsonify([
        {"id": item.id, "name": item.name, "quantity": item.quantity, "expiration_date": item.expiration_date.isoformat()}
        for item in items
    ])

@inventory_bp.route('/', methods=['POST'])
@jwt_required()
def add_item():
    user_id = get_jwt_identity()
    data = request.get_json()
    inventory_service.add_inventory_item(user_id, data)
    return jsonify(message="Item added successfully"), 201

@inventory_bp.route('/<int:item_id>', methods=['DELETE'])
@jwt_required()
def delete_item(item_id):
    user_id = get_jwt_identity()
    item = inventory_service.delete_inventory_item(user_id, item_id)
    if not item:
        return jsonify(message="Item not found"), 404
    return jsonify(message="Item deleted successfully"), 200
