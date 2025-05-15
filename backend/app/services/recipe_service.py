# services/recommendations.py  (או איפה שהקוד יושב)
from app.models import InventoryItem
from app.services.assistant_service import suggest_recipes_from_groq

def get_recommended_recipes(user_id: int, user_message: str, user_prefs: dict) -> list[dict]:
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    inventory = [item.name.lower() for item in items]

    result = suggest_recipes_from_groq(
        user_id=user_id,
        ingredients=inventory,
        user_message=user_message,
        user_prefs=user_prefs,
    )

    if "error" in result:
        return [{"message": f"AI Error: {result['error']}"}]

    return result["recipes"]
