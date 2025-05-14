
from app.models import InventoryItem
from app.services.assistant_service import suggest_recipes_from_groq

def get_recommended_recipes(user_id):
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    inventory = [item.name.lower() for item in items]

    ingredients_str = ", ".join(inventory)
    result = suggest_recipes_from_groq(user_id, ingredients_str)

    if "error" in result:
        return [{"message": f"AI Error: {result['error']}"}]

    return [{
        "title": "AI Suggested Recipe",
        "instructions": result["response"]
    }]
