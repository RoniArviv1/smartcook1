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

    if any(x in lowered for x in [
        "salt", "sugar", "cinnamon", "paprika", "turmeric", "cumin",
        "oregano", "basil", "thyme", "spice", "chili", "pepper powder"
    ]):
        return "spice"

    return "solid"



def get_allowed_units(name: str) -> list[str]:
    lowered = name.lower()

    # יוצאי דופן שמותרים גם כ-pieces וגם כ-grams
    if any(x in lowered for x in ["bread", "pita", "roll", "bun", "bagel"]):
        return ["pieces", "grams"]

    unit_categories = {
        "solid": ["grams", "kg"],
        "liquid": ["ml", "l"],
        "countable": ["pieces"]
    }

    ingredient_type = classify_ingredient(name)
    return unit_categories.get(ingredient_type, ["grams"])


# משקל ממוצע בגרמים ליחידה של רכיב countable
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
    # אפשר להרחיב בהמשך
}


def get_average_weight(name: str) -> float | None:
    lowered = name.lower()
    return AVERAGE_WEIGHT.get(lowered)
