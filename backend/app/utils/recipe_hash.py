# backend/utils/recipe_hash.py
import hashlib
import json

def generate_recipe_hash(recipe: dict) -> str:
    base_string = recipe.get("title", "") + json.dumps(recipe.get("ingredients", [])) + json.dumps(recipe.get("instructions", []))
    return hashlib.md5(base_string.encode()).hexdigest()
