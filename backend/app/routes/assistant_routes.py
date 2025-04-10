from flask import Blueprint, request, jsonify
from app.services.assistant_service import suggest_recipes_from_huggingface

assistant_bp = Blueprint('assistant', __name__)

@assistant_bp.route('/assistant', methods=['POST'])
def suggest_recipes():
    data = request.get_json()  # מקבל את הנתונים שנשלחים ב-body של ה-POST
    user_id = data.get("user_id", 1)  # קבלת user_id מהנתונים, אם לא נמצא יבחר 1 כברירת מחדל
    ingredients = data.get("ingredients", "")

    recipes = suggest_recipes_from_huggingface(user_id, ingredients)  # קריאה לפונקציה שתשלח את הבקשה ל-HuggingFace

    if isinstance(recipes, dict) and "error" in recipes:  # אם יש שגיאה בתגובה
        return jsonify({"error": recipes["error"]}), 500

    return jsonify({"response": recipes})  # מחזיר את התגובה שהתקבלה מ-HuggingFace
