from app.utils.ingredient_utils import classify_ingredient

# טבלת המרה ליחידות בסיס
UNIT_MAP = {
    # משקל
    "kg": ("grams", 1000),
    "g": ("grams", 1),
    "gram": ("grams", 1),
    "grams": ("grams", 1),
    "oz": ("grams", 28),
    "lb": ("grams", 500),
    "pound": ("grams", 500),
    "lbs": ("grams", 500),

    # נפח
    "ml": ("ml", 1),
    "milliliter": ("ml", 1),
    "milliliters": ("ml", 1),
    "l": ("ml", 1000),
    "liter": ("ml", 1000),
    "liters": ("ml", 1000),

    # כף וכפית
    "tbsp": ("tbsp", 1),
    "tablespoon": ("tbsp", 1),
    "tablespoons": ("tbsp", 1),
    "tsp": ("tsp", 1),
    "teaspoon": ("tsp", 1),
    "teaspoons": ("tsp", 1),

    # כוס
    "cup": ("cup", 1),
    "cups": ("cup", 1),

    # יחידות
    "piece": ("pieces", 1),
    "pieces": ("pieces", 1),
    "unit": ("pieces", 1),
    "units": ("pieces", 1),

    # קופסה
    "can": ("pieces", 1),
    "cans": ("pieces", 1),
}

# משקל ממוצע בגרמים לרכיבים מסוג "countable"
AVERAGE_WEIGHT = {
    "tomato": 100,
    "orange": 130,
    "egg": 55,
    "onion": 110,
    "lemon": 120,
    "lime": 70,
    "banana": 120,
    "carrot": 70,
    "pepper": 100,
    "avocado": 150,
    "clove": 5,      # שן שום
    "garlic": 5,
    "apple": 180,
    "potato": 150,
    # תוסיפי לפי הצורך
}


def normalize_ingredient_units(recipes: list[dict]) -> list[dict]:
    # גבולות כמות לפי סוג רכיב (לא חובה לכל סוג)
    MIN_QTY = {
        "spice": 1,     # תבלין: מינימום 1 גרם
        "liquid": 10,   # נוזלים: מינימום 10 מ"ל
    }

    MAX_QTY = {
        "spice": 15,    # תבלין: מקסימום 15 גרם
        "liquid": 200,  # נוזלים: מקסימום 200 מ"ל
    }

    for recipe in recipes:
        for ing in recipe.get("ingredients", []):
            name = ing.get("name", "").lower()
            unit = ing.get("unit", "").lower()
            qty = ing.get("qty", 0)

            ingredient_type = classify_ingredient(name)

            if ingredient_type == "countable":
                if unit in ["grams", "g", "kg"]:
                    avg_weight = AVERAGE_WEIGHT.get(name)
                    total_grams = qty * 1000 if unit == "kg" else qty
                    if avg_weight:
                        pieces = round(total_grams / avg_weight)
                        ing["unit"] = "pieces"
                        ing["qty"] = max(1, pieces)
                    else:
                        ing["unit"] = "pieces"
                        ing["qty"] = 1
                else:
                    ing["unit"] = "pieces"

            else:
                # רכיבים שאינם countable – המרה רגילה
                target_unit, factor = UNIT_MAP.get(unit, (unit.strip(), 1))
                ing["unit"] = target_unit
                ing["qty"] = round(qty * factor, 2)

                # 💡 תיקון כמויות קצה לא הגיוניות
                min_qty = MIN_QTY.get(ingredient_type)
                max_qty = MAX_QTY.get(ingredient_type)
                if min_qty and ing["qty"] < min_qty:
                    ing["qty"] = min_qty
                if max_qty and ing["qty"] > max_qty:
                    ing["qty"] = max_qty

    return recipes


def normalize_single_unit(quantity, unit):
    unit = unit.lower().strip()

    # גרמים וקילוגרמים
    if unit in ["grams", "kg"]:
        total_grams = quantity * 1000 if unit == "kg" else quantity
        if total_grams >= 1000:
            return total_grams / 1000, "kg"
        return total_grams, "grams"

    # מיליליטר וליטר
    if unit in ["ml", "l"]:
        total_ml = quantity * 1000 if unit == "l" else quantity
        if total_ml >= 1000:
            return total_ml / 1000, "l"
        return total_ml, "ml"

    # יחידות אחרות נשמרות כפי שהן
    return quantity, unit
