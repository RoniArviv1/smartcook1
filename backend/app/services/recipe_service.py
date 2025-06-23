from datetime import datetime
from app.models import InventoryItem
from app.services.assistant_service import suggest_recipes_from_groq
from app.services.saved_recipe_service import save_recipe
from app.services.global_cache import CACHE
from app.utils.recipe_hash import generate_recipe_hash

def get_recommended_recipes(
    user_id: int,
    user_message: str,
    user_prefs: dict,
    save_to_db: bool = False,
    num_recipes: int = 3
) -> list[dict]:
    print("start")
    if user_id in CACHE and CACHE[user_id]:
        print(f"📦 Returning cached recipes for user {user_id}")
        return CACHE[user_id]

    # שליפת מלאי תקף
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    today = datetime.utcnow().date()
    valid_items = [item for item in items if not item.expiration_date or item.expiration_date >= today]
    inventory = [item.name.lower() for item in valid_items]

    # print(f"📋 Valid inventory for user {user_id}: {inventory}")

    recipes = []
    seen_titles = set()
    best_partial_result = []
    attempts = 0
    max_attempts = 4
    print("while")
    while len(recipes) < num_recipes and attempts < max_attempts:
        print(f"\n🚀 Attempt {attempts + 1} of {max_attempts}")
        result = suggest_recipes_from_groq(
            user_id=user_id,
            ingredients=inventory,
            user_message=user_message,
            user_prefs=user_prefs,
        )
        print("result", len(result))
        if "error" in result:
            print(f"⚠️ AI Error → {result['error']}")
            attempts += 1
            continue

        new_recipes = result.get("recipes", [])
        print("new recipes", len(new_recipes))
        if not isinstance(new_recipes, list):
            new_recipes = [new_recipes]
            # ✨ תיקון שדות אם הגיעו כמחרוזות
        for r in new_recipes:
            if isinstance(r.get("ingredients"), str):
                r["ingredients"] = [i.strip() for i in r["ingredients"].split(",") if i.strip()]
            if isinstance(r.get("instructions"), str):
                r["instructions"] = [s.strip() for s in r["instructions"].split(".") if s.strip()]


        print(f"📥 AI returned {len(new_recipes)} recipes")

        REQUIRED_FIELDS = ["title", "ingredients", "instructions"]
        filtered = []
        for r in new_recipes:
            if not isinstance(r, dict):
                print("❌ Skipped – not a dict:", r)
                continue
            missing = [f for f in REQUIRED_FIELDS if not r.get(f)]
            if missing:
                print(f"❌ Skipped – missing fields {missing} in: {r.get('title', 'Untitled')}")
                continue
            filtered.append(r)

        print(f"✅ Valid recipes after filter: {len(filtered)}")

        if len(filtered) > len(best_partial_result):
            best_partial_result = filtered

        for recipe in filtered:
            title = recipe.get("title", "").strip().lower()
            if title and title not in seen_titles:
                recipe["recipe_hash"] = generate_recipe_hash(recipe)
                recipes.append(recipe)
                seen_titles.add(title)
                print(f"➕ Added recipe: {title}")

            if len(recipes) >= num_recipes:
                break

        attempts += 1

    if not recipes and best_partial_result:
        print(f"⚠️ Returning best partial result with {len(best_partial_result)} recipes")
        recipes = best_partial_result

    if not recipes:
        print(f"❌ No valid recipes generated after {attempts} attempts.")
        return []

    if save_to_db:
        for recipe in recipes:
            save_recipe(user_id, recipe)

    print(f"✅ Returning {len(recipes)} recipes.")
    CACHE[user_id] = recipes
    return recipes
