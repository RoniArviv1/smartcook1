from flask import Blueprint, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity
from app import db
from app.models import InventoryItem

recipe_bp = Blueprint('recipe', __name__)

@recipe_bp.route('/recommended', methods=['GET'])
@jwt_required()
def recommended_recipes():
    user_id = get_jwt_identity()
    # Example logic: Get user's ingredients
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    ingredient_names = [item.name.lower() for item in items]

    # Dummy recommendation
    recipes = [
        {"title": "Tomato Pasta", "ingredients": ["tomato", "pasta", "olive oil"]},
        {"title": "Simple Salad", "ingredients": ["lettuce", "tomato", "olive oil"]}
    ]

    # Filter recipes by available ingredients
    recommended = [r for r in recipes if any(i in ingredient_names for i in r["ingredients"])]

    return jsonify(recommended)
