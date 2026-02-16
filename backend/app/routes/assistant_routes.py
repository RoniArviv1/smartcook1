# app/routes/assistant_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # אבטחה
from app.services.recipe_service import get_recommended_recipes
from app.services.global_cache import CACHE

assistant_bp = Blueprint("assistant", __name__)

@assistant_bp.route("/assistant", methods=["POST"])
@jwt_required() # רק משתמש מחובר יכול לגשת לעוזר
def handle_assistant():
    data         = request.get_json(force=True)
    
    # זיהוי המשתמש מה-Token בלבד
    user_id      = get_jwt_identity() 
    
    user_message = data.get("message", "What can I cook today?")
    user_prefs   = data.get("user_prefs", {})
    num_recipes = min(int(data.get("num_recipes", 1)), 1)
    use_expiring = data.get("use_expiring_soon", False)
    prev_recipe   = data.get("prev_recipe")

    try:
        recipes = get_recommended_recipes(
            user_id=user_id,
            user_message=user_message,
            user_prefs=user_prefs,
            num_recipes=num_recipes,
            save_to_db=False,
            use_cache=False,
            use_expiring_soon=use_expiring,
            prev_recipe=prev_recipe,
        )
                
        if not recipes:
            return jsonify({"recipes": [{"message": "No recipes generated."}]}), 200

        return jsonify({"user_id": user_id, "recipes": recipes}), 200
    except Exception as exc:
        print("❌ SERVER ERROR:", exc)
        return jsonify({"error": str(exc)}), 500


# --------------------------------------------------------------
#  POST /api/assistant/refresh   –dashboard refresh
# --------------------------------------------------------------
@assistant_bp.route("/assistant/refresh", methods=["POST"]) # הורדנו את ה-ID מהכתובת
@jwt_required()
def refresh_recommendations():
    """
    מנקה את המטמון של המשתמש ומחזיר סט חדש של מתכונים
    """
    user_id = get_jwt_identity()
    data         = request.get_json() or {}
    user_prefs   = data.get("user_prefs", {})
    user_message = data.get("user_message", "What can I cook today?")

    # ניקוי מטמון ספציפי למשתמש שמזוהה בטוקן
    if user_id in CACHE:
        del CACHE[user_id]

    new_recipes = get_recommended_recipes(
        user_id      = user_id,
        user_message = user_message,
        user_prefs   = user_prefs,
        num_recipes  = 3,
        save_to_db   = False,
    )
    
    return jsonify({"recipes": new_recipes}), 200
