# app/routes/ingredient_routes.py
from flask import Blueprint, request, jsonify
from app.utils.ingredient_utils import get_allowed_units

ingredient_bp = Blueprint("ingredient", __name__)

@ingredient_bp.route("/units", methods=["GET"])
def get_units_for_ingredient():
    name = request.args.get("name", "").strip()

    print(f"🔍 Received request for units – name: '{name}'")  # ✅ לוג בדיקה

    if not name:
        print("⚠️ Missing 'name' parameter in request")
        return jsonify({"error": "Missing 'name' parameter"}), 400

    units = get_allowed_units(name)

    print(f"✅ Allowed units for '{name}': {units}")  # ✅ לוג יחידות מאושרות

    return jsonify(get_allowed_units(name))
