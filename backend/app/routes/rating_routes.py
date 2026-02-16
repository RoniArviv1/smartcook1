from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity # הוספת אבטחה
from app.services.rating_service import rate_recipe
from app.models import RecipeRating
from sqlalchemy import func

rating_bp = Blueprint("rating_bp", __name__)

# נתיב דיבאג מאובטח - מזהה את המשתמש לפי הטוקן שלו
@rating_bp.route("/debug/ratings")
@jwt_required()
def debug_ratings():
    user_id = get_jwt_identity()
    data = [
        {"title": r.title, "rating": r.rating}
        for r in RecipeRating.query.filter_by(user_id=user_id).all()
    ]
    return jsonify(data)

# נתיב לקבלת ממוצע דירוגים - נשאר ציבורי (לא חייב טוקן כדי לראות ציון)
@rating_bp.route("/recipes/rating/<recipe_hash>", methods=["GET"])
def get_average_rating(recipe_hash):
    ratings = RecipeRating.query.with_entities(
        func.avg(RecipeRating.rating), func.count()
    ).filter_by(recipe_hash=recipe_hash).first()

    avg = round(ratings[0] or 0, 2)
    count = ratings[1]

    return jsonify({
        "recipe_hash": recipe_hash,
        "average_rating": avg,
        "num_ratings": count
    })

# דירוג מתכון - מאובטח עם טוקן
@rating_bp.route("/recipes/rate", methods=["POST"])
@jwt_required()
def rate_recipe_api():
    data = request.get_json()

    # זיהוי המשתמש מהטוקן
    user_id = get_jwt_identity()
    rating = data.get("rating")
    recipe = data.get("recipe")

    if not recipe or not isinstance(rating, int):
        return jsonify({"error": "Missing rating or recipe"}), 400
    if not (1 <= rating <= 5):
        return jsonify({"error": "Rating must be between 1 and 5"}), 400

    recipe_hash = rate_recipe(user_id=user_id, recipe=recipe, rating=rating)

    return jsonify({"message": "Rating saved", "recipe_hash": recipe_hash})
