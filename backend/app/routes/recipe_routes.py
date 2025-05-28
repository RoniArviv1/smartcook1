from flask import Blueprint, jsonify, request
# from flask_jwt_extended import jwt_required, get_jwt_identity

from app.services.recipe_service import get_recommended_recipes
from app.services.user_service import get_preferences
from app.services.saved_recipe_service import (
    save_recipe,
    delete_saved_recipe,
    get_saved_recipes,
)

recipe_bp = Blueprint('recipe', __name__)


# 🔸 קבלת המלצות מבוססות מלאי והעדפות משתמש
@recipe_bp.route('/recommended', methods=['GET'])
# @jwt_required()
def recommended_recipes():
    user_id = 1  # מזהה זמני בזמן פיתוח
    print("📥 GET /recommended by user", user_id)

    user_message = "Get me a recipe using my preferences and ingredients."
    user_prefs = get_preferences(user_id)

    recommended = get_recommended_recipes(
        user_id=user_id,
        user_message=user_message,
        user_prefs=user_prefs,
        save_to_db=True  # שומר את ההמלצות אוטומטית במסד הנתונים
    )

    print("✅ Recommended recipes:", recommended)
    return jsonify({"recipes": recommended})


# 🔸 שליפת כל המתכונים השמורים של המשתמש
@recipe_bp.route('/saved/<int:user_id>', methods=['GET'])
def get_saved(user_id):
    saved = get_saved_recipes(user_id)
    return jsonify(saved), 200


# 🔸 שמירת מתכון שנבחר ע"י המשתמש
@recipe_bp.route('/saved/<int:user_id>', methods=['POST'])
def save(user_id):
    data = request.get_json() or {}
    save_recipe(user_id, data)
    return jsonify({"message": "Recipe saved."}), 201


# 🔸 מחיקת מתכון שנשמר ע"י המשתמש
@recipe_bp.route('/saved/<int:user_id>', methods=['DELETE'])
def unsave(user_id):
    data = request.get_json() or {}
    title = data.get("title")
    if not title:
        return jsonify({"error": "Missing recipe title"}), 400
    delete_saved_recipe(user_id, title)
    return jsonify({"message": "Recipe removed."}), 200
