from flask import Blueprint, request, jsonify
from app.models import NutritionLog
from sqlalchemy import func
from datetime import datetime, timedelta

nutrition_bp = Blueprint("nutrition", __name__)

@nutrition_bp.route("/summary", methods=["GET"])
def get_nutrition_summary():
    user_id = request.args.get("user_id", type=int)
    days = request.args.get("days", 7, type=int)
    group_mode = request.args.get("group", "daily")  # daily / weekly

    if not user_id:
        return jsonify({"error": "Missing user_id"}), 400

    start_date = datetime.utcnow().date() - timedelta(days=days)

    base_query = (
        NutritionLog.query
        .filter(NutritionLog.user_id == user_id)
        .filter(NutritionLog.date >= start_date)
    )

    if group_mode == "weekly":
        # קבלת רשומות לפי ימים (נשתמש בהם לחישוב ממוצע)
        daily_logs = base_query.with_entities(
            NutritionLog.date,
            func.sum(NutritionLog.calories).label("calories"),
            func.sum(NutritionLog.protein).label("protein"),
            func.sum(NutritionLog.carbs).label("carbs"),
            func.sum(NutritionLog.fat).label("fat")
        ).group_by(NutritionLog.date).all()

        total_days = len(daily_logs)

        if total_days == 0:
            return jsonify([{
                "total": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0},
                "average_per_day": {"calories": 0, "protein": 0, "carbs": 0, "fat": 0}
            }])

        # סכום כללי לשבוע
        totals = {
            "calories": sum(log.calories or 0 for log in daily_logs),
            "protein": sum(log.protein or 0 for log in daily_logs),
            "carbs": sum(log.carbs or 0 for log in daily_logs),
            "fat": sum(log.fat or 0 for log in daily_logs)
        }

        # ממוצע ליום
        averages = {
            k: round(v / total_days, 2)
            for k, v in totals.items()
        }

        # עיגול סיכומים
        totals = {k: round(v, 2) for k, v in totals.items()}

        return jsonify([{
            "total": totals,
            "average_per_day": averages
        }])

    else:
        # מצב יומי
        logs = base_query.with_entities(
            NutritionLog.date,
            func.sum(NutritionLog.calories).label("calories"),
            func.sum(NutritionLog.protein).label("protein"),
            func.sum(NutritionLog.carbs).label("carbs"),
            func.sum(NutritionLog.fat).label("fat")
        ).group_by(NutritionLog.date).order_by(NutritionLog.date.desc()).all()

        return jsonify([
            {
                "date": log.date.isoformat(),
                "calories": round(log.calories or 0, 2),
                "protein": round(log.protein or 0, 2),
                "carbs": round(log.carbs or 0, 2),
                "fat": round(log.fat or 0, 2)
            }
            for log in logs
        ])
