# app/utils/ingredient_utils.py

def classify_ingredient(name: str) -> str:
    lowered = name.lower()

    if any(x in lowered for x in ["milk", "juice", "oil", "water", "syrup", "vinegar", "wine"]):
        return "liquid"

    if any(x in lowered for x in [
        "egg", "apple", "orange", "banana", "onion", "tomato", "clove",
        "garlic", "lemon", "lime", "carrot", "potato", "pepper",
        "avocado", "bread", "roll", "bun", "pita", "bagel"
    ]):
        return "countable"

    return "solid"


def get_allowed_units(name: str) -> list[str]:
    lowered = name.lower()

    if any(x in lowered for x in ["bread", "pita", "roll", "bun", "bagel"]):
        return ["pieces", "grams"]

    unit_categories = {
        "solid": ["grams", "kg"],
        "liquid": ["ml", "l"],
        "countable": ["pieces"]
    }

    ingredient_type = classify_ingredient(name)
    return unit_categories.get(ingredient_type, ["grams"])
