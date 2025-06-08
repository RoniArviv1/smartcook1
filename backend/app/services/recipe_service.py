from app.models import InventoryItem
from app.services.assistant_service import suggest_recipes_from_groq
from app.services.saved_recipe_service import save_recipe

def get_recommended_recipes(
    user_id: int,
    user_message: str,
    user_prefs: dict,
    save_to_db: bool = False,
    num_recipes: int = 2
) -> list[dict]:
    # שליפת המלאי
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    inventory = [item.name.lower() for item in items]

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
            prev_recipe=prev_recipe
        )

        if "error" in result:
            break  # עצור אם הייתה שגיאה חמורה

        for recipe in result.get("recipes", []):
            title = recipe.get("title", "").strip().lower()
            if title and title not in seen_titles:
                recipes.append(recipe)
                seen_titles.add(title)
                break  # נעבור לניסיון הבא רק אחרי שהוספנו חדש

        attempts += 1

    # שמירה למסד נתונים אם צריך
    if save_to_db:
        for recipe in recipes:
            save_recipe(user_id, recipe)

    return recipes if recipes else [{"message": "No recipes generated."}]
