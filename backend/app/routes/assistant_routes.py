from flask import Blueprint, request, jsonify
from app.services.assistant_service import suggest_recipes_from_groq

assistant_bp = Blueprint("assistant", __name__)

@assistant_bp.route("/assistant", methods=["POST"])
def handle_assistant():
    data         = request.get_json()
    user_id      = data.get("user_id")
    user_message = data.get("message")
    ingredients  = data.get("ingredients", [])
    user_prefs   = data.get("user_prefs", {})      # ◀ מה-Frontend
    prev_recipe  = data.get("prev_recipe")         # 🆕 1. חילוץ

    if not user_message:
        return jsonify({"error": "No message provided."}), 400

    result = suggest_recipes_from_groq(             # 🆕 2. העברה
        user_id,
        ingredients,
        user_message,
        user_prefs,
        prev_recipe          # ←־ כאן
    )

    if "error" in result:
        return jsonify({
            "error": f"AI Error: {result['error']}",
            "recipes": []
        }), 500

    return jsonify({
        "user_id": result["user_id"],
        "recipes": result["recipes"]
    })
