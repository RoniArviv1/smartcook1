def recommend_recipes(available_ingredients):
    recipes = [
        {"title": "Tomato Pasta", "ingredients": ["tomato", "pasta", "olive oil"]},
        {"title": "Fruit Smoothie", "ingredients": ["banana", "milk", "honey"]}
    ]

    recommended = [r for r in recipes if any(i in available_ingredients for i in r["ingredients"])]
    return recommended
