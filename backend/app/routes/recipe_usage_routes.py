from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # הוספנו את המזהה המאובטח
from app.services.recipe_usage_service import update_inventory_after_recipe
from app.models import db, NutritionLog
from datetime import datetime

recipe_usage_bp = Blueprint("recipe_usage", __name__, url_prefix="/api/use-recipe")

@recipe_usage_bp.post("/")
@jwt_required() # מחייב שהמשתמש יהיה מחובר
def use_recipe():
    data = request.get_json()
    
    # השרת מזהה את המשתמש מה-Token ולא מהגולש
    user_id = get_jwt_identity() 
    
    recipe_hash = data.get("recipe_hash")
    ingredients = data.get("ingredients", [])
    nutrition = data.get("nutrition")

    # עדכון המזווה עבור המשתמש המזוהה מה-Token
    result = update_inventory_after_recipe(user_id, ingredients)

    if "error" in result:
        return jsonify(result), 400

    # רישום תזונתי מאובטח
    if nutrition and "per_serving" in nutrition and all(
        k in nutrition["per_serving"] for k in ["calories", "protein", "carbs", "fat"]
    ):
        log = NutritionLog(
            user_id=user_id, # משתמש ב-ID המאובטח מה-Token
            recipe_hash=recipe_hash,
            date=datetime.utcnow(),
            calories=nutrition["per_serving"]["calories"],
            protein=nutrition["per_serving"]["protein"],
            carbs=nutrition["per_serving"]["carbs"],
            fat=nutrition["per_serving"]["fat"]
        )
        try:
            db.session.add(log)
            db.session.commit()
            print(f"✅ Nutrition log saved for user {user_id}:", log.to_dict())
        except Exception as e:
            db.session.rollback() # חשוב למקרה של תקלה במסד הנתונים
            print("❌ DB ERROR:", e)

        result["nutrition_log"] = log.to_dict()
    else:
        print("⚠️ Missing keys in nutrition or bad structure:", nutrition)

    return jsonify(result), 200
