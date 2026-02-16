from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required # הוספת הגנה לכל נתיב
from app.models import InventoryItem
from app.extensions import db
import requests

barcode_bp = Blueprint('barcode', __name__)

@barcode_bp.route("/barcode/product/<barcode>", methods=["GET"])
@jwt_required() # רק משתמש מחובר עם Token יכול לחפש מוצר לפי ברקוד
def get_product_by_barcode(barcode):
    try:
        url = f"https://world.openfoodfacts.org/api/v0/product/{barcode}.json"
        response = requests.get(url)
        data = response.json()

        if data.get("status") != 1:
            return jsonify({"error": "Product not found"}), 404

        product = data.get("product", {})
        result = {
            "barcode": barcode,
            "name": product.get("product_name", "Unknown"),
            "brand": product.get("brands", "Unknown"),
            "category": product.get("categories", "Unknown"),
            "quantity": product.get("quantity", ""),
            "image_url": product.get("image_url", "")
        }
        return jsonify(result), 200

    except Exception as e:
        return jsonify({"error": str(e)}), 500
