from flask import Blueprint, request, jsonify
from app.services.assistant_service import suggest_recipes_from_groq
from app.services.global_cache import CACHE
from app.services.recipe_service import get_recommended_recipes

assistant_bp = Blueprint("assistant", __name__)

@assistant_bp.route("/assistant", methods=["POST"])
def handle_assistant():
    try:
        data = request.get_json(force=True)
        user_id      = data.get("user_id")
        user_message = data.get("message")
        ingredients  = data.get("ingredients", [])
        user_prefs   = data.get("user_prefs", {})
        prev_recipe  = data.get("prev_recipe")
        num_recipes  = data.get("num_recipes", 1)  # ⬅️ ברירת מחדל: 1

        print("🟡 Incoming message:", user_message)
        print("🟡 Previous recipe title:", prev_recipe.get("title") if prev_recipe else None)

        result = suggest_recipes_from_groq(
            user_id=user_id,
            ingredients=ingredients,
            user_message=user_message,
            user_prefs=user_prefs,
            prev_recipe=prev_recipe,
            num_recipes=num_recipes   # ⬅️ תעביר את זה הלאה
        )

        # 🛡 בדיקת שגיאה או העדר מתכונים
        if (
            not result or
            "recipes" not in result or
            not isinstance(result["recipes"], list) or
            not result["recipes"]
        ):
            return jsonify({"recipes": [{"message": "No recipes generated."}]})

        if "error" in result:
            print("❌ AI returned error:", result["error"])
            return jsonify({
                "error": f"AI Error: {result['error']}",
                "recipes": []
            }), 500

        return jsonify({
            "user_id": result["user_id"],
            "recipes": result["recipes"]
        })

    except Exception as e:
        print("❌ SERVER ERROR:", e)
        return jsonify({"error": str(e)}), 500



@assistant_bp.route("/assistant/refresh/<int:user_id>", methods=["POST"])
def refresh_recommendations(user_id):
    data = request.get_json() or {}
    user_prefs = data.get("user_prefs", {})
    user_message = data.get("user_message", "What can I cook today?")
    print("cache", CACHE)
    # מחיקת הקאש כדי להכריח AI חדש
    if user_id in CACHE:
        exclude = [r['title'] for r in CACHE[user_id]]
        if exclude:
            user_message+= f' Please exclude these recipes: {','.join(exclude)}'
        del CACHE[user_id]
   

    print("user_message", user_message)

    # הפקת מתכונים חדשים
    new_recipes = get_recommended_recipes(
        user_id=user_id,
        user_message=user_message,
        user_prefs=user_prefs,
        save_to_db=False  # או True אם אתה רוצה לשמור
    )

    return jsonify({"recipes": new_recipes})

