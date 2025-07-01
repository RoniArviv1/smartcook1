from flask import Blueprint, request, jsonify
from app.services.recipe_usage_service import update_inventory_after_recipe

recipe_usage_bp = Blueprint("recipe_usage", __name__, url_prefix="/api/use-recipe")

@recipe_usage_bp.post("/")
def use_recipe():
    data = request.get_json()
    user_id = data.get("user_id")
    ingredients = data.get("ingredients", [])

    result = update_inventory_after_recipe(user_id, ingredients)

    if "error" in result:
        return jsonify(result), 400

    return jsonify(result), 200
