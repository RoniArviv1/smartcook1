from flask import Blueprint, jsonify, request
from flask_jwt_extended import jwt_required, get_jwt_identity # אבטחה
from app.services.recipe_service import get_recommended_recipes
from app.services.saved_recipe_service import (
    save_recipe,
    delete_saved_recipe,
    get_saved_recipes,
)

recipe_bp = Blueprint('recipe', __name__)

# 🔸 בקשת המלצות POST - זיהוי אוטומטי לפי Token
@recipe_bp.route('/recommended', methods=['POST'])
@jwt_required()
def recommended_recipes():
    data = request.get_json() or {}
    
    # זיהוי המשתמש מה-Token
    user_id = get_jwt_identity() 
    
    user_message = data.get("user_message", "Get me a recipe.")
    user_prefs = data.get("user_prefs", {})
    num_recipes = data.get("num_recipes", 3)

    print(f"📥 POST /recommended by user {user_id}")

    result = get_recommended_recipes(
        user_id=user_id,
        user_message=user_message,
        user_prefs=user_prefs,
        save_to_db=False,
        num_recipes=num_recipes
    )

    return jsonify({"recipes": result}), 200


# 🔸 שליפת מתכונים שמורים - הורדנו את ה-ID מהכתובת
@recipe_bp.route('/saved', methods=['GET'])
@jwt_required()
def get_saved():
    user_id = get_jwt_identity()
    saved = get_saved_recipes(user_id)
    return jsonify(saved), 200


# 🔸 שמירת מתכון - הורדנו את ה-ID מהכתובת
@recipe_bp.route('/saved', methods=['POST'])
@jwt_required()
def save():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    save_recipe(user_id, data)
    return jsonify({"message": "Recipe saved."}), 201


# 🔸 מחיקת מתכון - הורדנו את ה-ID מהכתובת
@recipe_bp.route('/saved', methods=['DELETE'])
@jwt_required()
def unsave():
    user_id = get_jwt_identity()
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "Missing recipe title"}), 400
    delete_saved_recipe(user_id, title)
    return jsonify({"message": "Recipe removed."}), 200
