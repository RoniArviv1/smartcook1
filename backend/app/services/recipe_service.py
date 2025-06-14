from app.services.global_cache import CACHE
from app.services.assistant_service import suggest_recipes_from_groq
from app.models import InventoryItem
from app.services.saved_recipe_service import save_recipe
from datetime import datetime

def get_recommended_recipes(
    user_id: int,
    user_message: str,
    user_prefs: dict,
    save_to_db: bool = False,
    num_recipes: int = 3
) -> list[dict]:
    # שליפת קאש אם קיים
    if user_id in CACHE:
        return CACHE[user_id]

    items = InventoryItem.query.filter_by(user_id=user_id).all()
    today = datetime.utcnow().date()

    # סינון מצרכים שפג תוקפם
    valid_items = [item for item in items if not item.expiration_date or item.expiration_date >= today]
    inventory = [item.name.lower() for item in valid_items]

    recipes = []
    seen_titles = set()
    attempts = 0
    max_attempts = num_recipes * 2

    while len(recipes) < num_recipes and attempts < max_attempts:
        prev_recipe = recipes[-1] if recipes else None

        result = suggest_recipes_from_groq(
            user_id=user_id,
            ingredients=inventory,
            user_message=user_message,
            user_prefs=user_prefs,
            prev_recipe=prev_recipe,
        )

        if "error" in result:
            break

        for recipe in result.get("recipes", []):
            title = recipe.get("title", "").strip().lower()
            if title and title not in seen_titles:
                recipes.append(recipe)
                seen_titles.add(title)
                break

        attempts += 1

    if save_to_db:
        for recipe in recipes:
            save_recipe(user_id, recipe)

    CACHE[user_id] = recipes if recipes else [{"message": "No recipes generated."}]
    return CACHE[user_id]
