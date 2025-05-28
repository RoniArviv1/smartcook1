from app.models import InventoryItem
from app.services.assistant_service import suggest_recipes_from_groq
from app.services.saved_recipe_service import save_recipe

def get_recommended_recipes(user_id: int, user_message: str, user_prefs: dict, save_to_db: bool = False) -> list[dict]:
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

    recipes = result["recipes"]

    if save_to_db:
        for recipe in recipes:
            save_recipe(user_id, recipe)

    return recipes
