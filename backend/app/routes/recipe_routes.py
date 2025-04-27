from flask import Blueprint, jsonify
# from flask_jwt_extended import jwt_required, get_jwt_identity
from app.services.recipe_service import get_recommended_recipes

recipe_bp = Blueprint('recipe', __name__)

@recipe_bp.route('/recommended', methods=['GET'])
# @jwt_required()  # אפשר להחזיר כשהפרויקט עובר לפרודקשן
def recommended_recipes():
    user_id = 1  # 👈 מזהה משתמש זמני בזמן פיתוח
    print("📥 GET /recommended by user", user_id)

    recommended = get_recommended_recipes(user_id)
    
    print("✅ Recommended recipes:", recommended)

    return jsonify({"recipes": recommended})
