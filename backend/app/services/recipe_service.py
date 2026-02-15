from datetime import datetime
from datetime import timedelta

from app.models import InventoryItem  # מודל של פריט מהמלאי של המשתמש
from app.services.assistant_service import suggest_recipes_from_groq  # פונקציה שמדברת עם מודל ה־LLM (Groq)
from app.services.saved_recipe_service import save_recipe  # פונקציה ששומרת מתכון למסד נתונים
from app.services.global_cache import CACHE  # קאש עולמי – מונע פניות מיותרות למודל
from app.utils.recipe_hash import generate_recipe_hash  # יוצר מזהה ייחודי למתכון לפי תוכן
from app.utils.recipe_nutrition import calc_recipe_nutrition  # מחשב ערכים תזונתיים של מתכון לפי רכיבים

def _normalize_recipe(r: dict) -> dict | None:
    if not isinstance(r, dict):
        return None

    title = (r.get("title") or "").strip()
    if not title:
        return None

    # ingredients: תומך גם ב-string וגם list של strings וגם dicts שונים
    ings = r.get("ingredients") or []
    if isinstance(ings, str):
        ings = [x.strip() for x in ings.split(",") if x.strip()]
    fixed_ings = []
    for ing in ings:
        if isinstance(ing, str):
            fixed_ings.append({"name": ing, "quantity": 1, "unit": "pieces"})
        elif isinstance(ing, dict):
            name = ing.get("name") or ing.get("ingredient")
            qty  = ing.get("quantity") or ing.get("amount") or 1
            unit = ing.get("unit") or ing.get("measure") or "pieces"
            if name:
                fixed_ings.append({"name": name, "quantity": qty, "unit": unit})

    # instructions: תומך גם ב-string וגם list
    instr = r.get("instructions") or []
    if isinstance(instr, str):
        instr = [x.strip() for x in instr.split("\n") if x.strip()]

    r["title"] = title
    r["ingredients"] = fixed_ings
    r["instructions"] = instr
    return r


def get_recommended_recipes(
    user_id: int,
    user_message: str = "What can I cook today?",
    user_prefs: dict | None = None,
    num_recipes: int = 1,
    save_to_db: bool = False,
    use_cache: bool = True,
    use_expiring_soon: bool = False,
    prev_recipe: dict | None = None,
):
    """
    מחזירה רשימת מתכונים מומלצים למשתמש.
    • מוסיפה hash ותזונה לכל מתכון.
    • אם use_cache=True, תשתמש בתוצאה שמורה בקאש.
    """
    if user_prefs is None:
        user_prefs = {}

    # ---------- בדיקה: אם יש קאש קיים למשתמש, נחזיר אותו מיידית ----------
    if use_cache and user_id in CACHE and CACHE[user_id]:
        return CACHE[user_id]

    # ---------- שליפת כל פריטי המלאי של המשתמש ----------
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    today = datetime.utcnow().date()

    if use_expiring_soon:
        # ניקח רק פריטים שתוקפם יפוג ב־3 הימים הקרובים
        inventory_items = [
            item for item in items
            if item.expiration_date and today <= item.expiration_date <= today + timedelta(days=3)
        ]
    else:
        # ניקח רק פריטים תקפים (או שאין להם תאריך תפוגה)
        inventory_items = [
            item for item in items
            if not item.expiration_date or item.expiration_date >= today
        ]

    # בניית רשימת רכיבים בפורמט מילון עבור המודל
    inventory = [
        {"name": item.name.lower(), "quantity": item.quantity, "unit": item.unit}
        for item in inventory_items
    ]

    # משתנים פנימיים לניהול הניסיון
    recipes = []
    seen_titles = set()
    best_partial = []
    attempts = 0
    max_attempts = 4
    print("🧪 INVENTORY COUNT:", len(inventory), "use_expiring_soon:", use_expiring_soon)
    print("🧪 INVENTORY COUNT:", len(inventory))
    print("🧪 user_message:", user_message)
    print("🧪 user_prefs:", user_prefs)


    # ---------- לולאה: מנסים עד שמתקבלים num_recipes מתכונים ----------
    while len(recipes) < num_recipes and attempts < max_attempts:
        print("📦 INVENTORY FOR GROQ:", inventory)

        # בקשה למודל לקבלת מתכונים על סמך המלאי והעדפות המשתמש
        result = suggest_recipes_from_groq(
        user_id=user_id,
        ingredients=inventory,
        user_message=user_message,
        user_prefs=user_prefs,
        prev_recipe=prev_recipe,
        num_recipes=num_recipes
    )
        
                # ✅ אם הפונקציה החזירה list (מתכונים בלבד) – נתייחס אליה כמתכונים
        if isinstance(result, list):
            new_recipes = result

        # ✅ אם החזירה dict – כמו שתכננת במקור
        elif isinstance(result, dict):
            if "error" in result:
                print("❌ GROQ ERROR:", result["error"])
                attempts += 1
                continue
            new_recipes = result.get("recipes", [])

        else:
            print("❌ Unexpected LLM result type:", type(result))
            attempts += 1
            continue
       
            

    
        # קבלת המתכונים מהמודל
        new_recipes = result.get("recipes", [])
        print("🧠 RAW RECIPES COUNT:", len(new_recipes))
        print("🧠 RAW FIRST:", new_recipes[0] if new_recipes else None)

        if not isinstance(new_recipes, list):
            new_recipes = [new_recipes]  # דואג שתמיד תתקבל רשימה

        # תיקון – אם רשימת הרכיבים מגיעה כמחרוזת (במקום רשימת מילונים)
        for r in new_recipes:
            if isinstance(r.get("ingredients"), str):
                parts = [tok.strip() for tok in r["ingredients"].split(",") if tok.strip()]
                r["ingredients"] = [
                    {"quantity": 1, "unit": "pieces", "name": p} for p in parts
                ]

        normalized_recipes = []
        for r in new_recipes:
            nr = _normalize_recipe(r)
            if nr and nr["ingredients"] and nr["instructions"]:
                normalized_recipes.append(nr)
        print("🧪 NORMALIZED COUNT:", len(normalized_recipes))

        filtered = normalized_recipes

        # שמירה של התוצאה הכי טובה שקיבלנו – אם נצטרך fallback
        if len(filtered) > len(best_partial):
            best_partial = filtered

        # העשרת המתכונים – הוספת מזהה ותזונה
        for recipe in filtered:
            title = recipe.get("title", "").strip().lower()
            if not title or title in seen_titles:
                continue  # דילוג על כותרות ריקות או כפולות

            # יצירת מזהה ייחודי למתכון
            recipe["recipe_hash"] = generate_recipe_hash(recipe)

            # חישוב ערכים תזונתיים (אם יש רכיבים)
            if isinstance(recipe.get("ingredients"), list):
                totals = calc_recipe_nutrition(recipe["ingredients"])
                if totals:
                    servings = max(int(recipe.get("servings") or 1), 1)
                    recipe["nutrition"] = {
                        "total": totals,
                        "per_serving": {
                            k: round(v / servings, 2) for k, v in totals.items()
                        },
                    }

            # הוספת המתכון לרשימה
            recipes.append(recipe)
            seen_titles.add(title)

            # עצירה אם הגענו למספר המבוקש
            if len(recipes) >= num_recipes:
                break

        attempts += 1
        print("attempts:", attempts)

    # ---------- fallback: אם לא קיבלנו אף מתכון תקין, נחזיר את הכי טוב שהיה ----------
    if not recipes and best_partial:
        recipes = best_partial
    if not recipes:
        return []

    # ---------- שמירת מתכונים למסד הנתונים (אם סומן save_to_db) ----------
    if save_to_db:
        for r in recipes:
            save_recipe(user_id, r)

    # ---------- שמירת תוצאה בקאש (לשימוש עתידי) ----------
    if use_cache:
        CACHE[user_id] = recipes
    print("❌ FINAL: returning empty recipes. best_partial len =", len(best_partial))

    return recipes
