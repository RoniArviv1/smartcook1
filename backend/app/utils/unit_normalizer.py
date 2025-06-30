# app/utils/unit_normalizer.py

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
    "cans": ("pieces", 1)
}


def normalize_ingredient_units(recipes: list[dict]) -> list[dict]:
    for recipe in recipes:
        for ing in recipe.get("ingredients", []):
            unit = ing.get("unit", "").lower()
            qty = ing.get("qty", 0)
            target_unit, factor = UNIT_MAP.get(unit, (unit.strip(), 1))
            ing["unit"] = target_unit
            ing["qty"] = round(qty * factor, 2)
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



