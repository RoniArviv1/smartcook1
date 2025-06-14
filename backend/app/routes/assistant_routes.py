from flask import Blueprint, request, jsonify
from app.services.assistant_service import suggest_recipes_from_groq
from app.services.global_cache import CACHE

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

        print("🟡 Incoming message:", user_message)
        print("🟡 Previous recipe title:", prev_recipe.get("title") if prev_recipe else None)

        result = suggest_recipes_from_groq(
            user_id,
            ingredients,
            user_message,
            user_prefs,
            prev_recipe
        )

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
    CACHE.pop(user_id, None)
    return jsonify({"message": "Recommendations cache cleared."}), 200
