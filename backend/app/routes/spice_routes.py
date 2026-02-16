from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # הוספנו את זה
from app.services import spice_service

spice_bp = Blueprint("spice", __name__)

@spice_bp.route("/toggle", methods=["POST"])
@jwt_required() # מחייב שהמשתמש יהיה מחובר עם Token
def toggle_spice():
    data = request.get_json()
    # השרת מזהה את המשתמש לבד מהמפתח המוצפן
    user_id = get_jwt_identity() 
    spice_name = data.get("spice_name")

    if not spice_name:
        return jsonify({"error": "Missing spice_name"}), 400

    result = spice_service.toggle_spice_for_user(user_id, spice_name)
    return jsonify(result)


@spice_bp.route("/list", methods=["GET"])
@jwt_required() # מחייב Token
def get_user_spices():
    # במקום לקחת מה-URL (args), אנחנו לוקחים מה-Token
    user_id = get_jwt_identity()
    
    spices = spice_service.get_spices_for_user(int(user_id))
    return jsonify(spices)
