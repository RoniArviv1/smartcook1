# app/routes/ingredient_routes.py
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required # הוספת הגנה
from app.utils.ingredient_utils import get_allowed_units

ingredient_bp = Blueprint("ingredient", __name__)

@ingredient_bp.route("/units", methods=["GET"])
@jwt_required() # רק משתמש מחובר יכול לקבל את המידע הזה
def get_units_for_ingredient():
    name = request.args.get("name", "").strip().lower()

    print(f"🔍 Received request for units – name: '{name}'")

    if not name:
        print("⚠️ Missing 'name' parameter in request")
        return jsonify({"error": "Missing 'name' parameter"}), 400

    result = get_allowed_units(name)

    print(f"✅ Allowed units for '{name}': {result}")

    if not result.get("units"):
        return jsonify({"error": f"No allowed units found for '{name}'"}), 404

    return jsonify(result)
