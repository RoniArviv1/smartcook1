"""
קריאה ל-Groq, אכיפת העדפות (צמחוני/טבעוני), כמויות מדויקות,
8-12 צעדים, ותמיכה בבקשות המשך (`prev_recipe`).
"""

from __future__ import annotations
import json, os, re
from typing import Any, List

from dotenv import load_dotenv
import openai
from openai.error import OpenAIError

load_dotenv()
openai.api_key  = os.getenv("GROQ_API_KEY")
openai.api_base = "https://api.groq.com/openai/v1"

_JSON_RE = re.compile(r"(?:```(?:json)?|)[\s\*]*(\{[^`]*\})[\s\*]*```?", re.I | re.S)
def _extract_json(text: str) -> dict[str, Any] | None:
    m = _JSON_RE.search(text)
    snippet = m.group(1) if m else text.strip()
    try:
        return json.loads(snippet)
    except Exception:
        return None

RESTRICTED = {
    "vegetarian": {"beef","pork","chicken","turkey","fish","shrimp"},
    "vegan": {
        "beef","pork","chicken","turkey","fish","shrimp",
        "milk","cheese","butter","egg","honey",
    },
}

def _filter_inventory(inv: List[str], dietary: List[str]) -> List[str]:
    banned = RESTRICTED["vegan"] if "vegan" in dietary else (
        RESTRICTED["vegetarian"] if "vegetarian" in dietary else set()
    )
    return [i for i in inv if i.lower() not in banned]

def suggest_recipes_from_groq(
    user_id: int,
    ingredients: List[str],
    user_message: str,
    user_prefs: dict[str, Any],
    prev_recipe: dict[str, Any] | None = None,    # 🆕
) -> dict[str, Any]:

    dietary   = [d.lower() for d in user_prefs.get("dietary", [])]
    allergies = user_prefs.get("allergies", [])
    safe_inv  = _filter_inventory(ingredients, dietary)

    pref_txt = "; ".join(filter(None, [
        f"dietary restrictions: {', '.join(dietary)}" if dietary else "",
        f"allergies: {', '.join(allergies)}" if allergies else "",
    ])) or "no special preferences"

    ing_txt = ", ".join(safe_inv) if safe_inv else "common pantry items"

    restriction_note = ""
    if "vegan" in dietary:
        restriction_note = ("IMPORTANT: 100% plant-based – no meat, fish, dairy or eggs. "
                            "Use tofu / legumes instead.")
    elif "vegetarian" in dietary:
        restriction_note = ("IMPORTANT: No meat or fish. "
                            "Use plant-based substitutes.")

    # ---------- prompt ----------
    if prev_recipe:
        # שיפור או שינוי מתכון קיים
        prompt = (
            "You are a helpful cooking assistant.\n"
            "Here is the previous recipe JSON the user received:\n"
            f"{json.dumps(prev_recipe)}\n\n"
            f"User request: {user_message}\n\n"
            "• If the user asks for *modifications*, update the JSON accordingly.\n"
            "• If the user asks for a *completely new recipe*, create one that satisfies "
            "the same dietary/allergy constraints.\n"
            "Return RAW JSON only, same schema as above."
        )
    else:
        # בקשה ראשונה
        prompt = (
            "You are a helpful cooking assistant.\n"
            f"User message: {user_message}\n"
            f"Available ingredients: {ing_txt}\n"
            f"User {pref_txt}.\n"
            f"{restriction_note}\n\n"
            "Return RAW JSON only with this schema:\n"
            '{'
            '"title":"",'
            '"description":"",'
            '"difficulty":"",'
            '"servings":0,'
            '"prep_minutes":0,'
            '"cook_minutes":0,'
            '"calories_per_serving":0,'
            '"ingredients":[{"qty":200,"unit":"g","name":"Tofu"}],'
            '"instructions":["Step 1","Step 2","... (8-12 steps)"]'
            '}\n\n'
            "Rules:\n"
            "• Qty must be numeric + unit (g, kg, ml, l, cup, tbsp, tsp, piece).\n"
            "• Provide 8-12 detailed steps.\n"
        )

    try:
        res = openai.ChatCompletion.create(
            model="llama3-70b-8192",
            messages=[{"role": "user", "content": prompt}],
            temperature=0.4,
            max_tokens=750,
            response_format={"type": "json_object"},
        )
        raw = res["choices"][0]["message"]["content"]
    except OpenAIError as e:
        return {"error": f"Groq API error: {e}", "recipes": []}

    recipe = _extract_json(raw)

    # Fallback
    if recipe is None:
        recipe = {
            "title": "AI Suggested Recipe",
            "difficulty": "Medium",
            "servings": 2,
            "prep_minutes": 15,
            "cook_minutes": 25,
            "calories_per_serving": None,
            "ingredients": [{"qty": None, "unit": "", "name": n} for n in safe_inv],
            "instructions": [raw],
        }

    # כמות מספרית
    for ing in recipe.get("ingredients", []):
        if not isinstance(ing.get("qty"), (int, float)):
            ing["qty"], ing["unit"] = 100, "g"

    # מספיק צעדים
    if len(recipe.get("instructions", [])) < 6:
        try:
            fix = openai.ChatCompletion.create(
                model="llama3-70b-8192",
                messages=[
                    {"role": "assistant", "content": json.dumps(recipe)},
                    {"role": "user",
                     "content": "Expand to 8-12 detailed steps. Return JSON only."},
                ],
                temperature=0.3,
                max_tokens=400,
                response_format={"type": "json_object"},
            )
            fixed = _extract_json(fix["choices"][0]["message"]["content"])
            if fixed:
                recipe = fixed
        except Exception:
            pass

    return {"user_id": user_id, "recipes": [recipe]}
