from __future__ import annotations  # תמיכה באנוטציות טיפוסים גם בגרסאות ישנות יותר של פייתון
import json, os, re, time, random  # יבוא של מודולים שימושיים
from typing import Any, List, Union, Dict  # טיפוסים להשלמת Type Hints
from dotenv import load_dotenv  # מאפשר קריאה של משתני סביבה מקובץ .env
import openai  # ספריית OpenAI לשליחת בקשות למודל
from openai.error import OpenAIError  # מחלקת שגיאה מבית OpenAI

# יבוא פונקציות עזר פנימיות מהפרויקט
from app.utils.unit_normalizer import normalize_ingredient_units  # מנרמל יחידות מדידה לפי סוג רכיב
from app.services.spice_service import get_spices_for_user  # מביא תבלינים אישיים לפי user_id
from app.services.rating_learning import summarize_user_ratings_for_prompt  # מחלץ סיכום דירוגים של המשתמש

# קריאת משתני סביבה מהקובץ .env
load_dotenv()
openai.api_key = os.getenv("GROQ_API_KEY")  # מפתח API אישי ל-Groq
openai.api_base = "https://api.groq.com/openai/v1"  # כתובת בסיס לבקשות אל Groq

# מילון רכיבים אסורים לפי מגבלות תזונה נפוצות
RESTRICTED = {
    "vegetarian": {"beef", "pork", "chicken", "turkey", "fish", "shrimp", "lamb", "bacon"},
    "vegan": {
        "beef", "pork", "chicken", "turkey", "fish", "shrimp", "lambqty",
        "milk", "cheese", "butter", "yogurt", "cream", "egg", "honey",
    },
    "gluten free": {
        "wheat", "barley", "rye", "bread", "pasta", "flour",
        "spaghetti", "noodles", "bulgur", "couscous", "semolina",
    },
}

# פונקציה פנימית – מחזירה מחרוזת JSON תקנית מאוזנת מתוך טקסט ארוך
def _balanced_json_snippet(text: str) -> str | None:
    start = text.find("{")
    if start == -1:
        return None
    depth = 0
    for i, ch in enumerate(text[start:], start=start):
        if ch == "{":
            depth += 1
        elif ch == "}":
            depth -= 1
            if depth == 0:
                return text[start: i + 1]
    return None

# מנסה לפרסר JSON מתוך טקסט שיכול להיות מעוצב גם כ־markdown
def _extract_json(text: str) -> dict[str, Any] | None:
    for candidate in (
        text,
        _balanced_json_snippet(text) or "",
        text.replace("```json", "").replace("```", "").strip(),
    ):
        try:
            return json.loads(candidate)
        except Exception:
            pass
    for m in re.finditer(r"```json([\s\S]*?)```", text):
        try:
            return json.loads(m.group(1))
        except Exception:
            continue
    return None

# סינון רכיבים שנוגדים את מגבלות התזונה
def _filter_inventory(inv: List[Any], dietary: List[str]) -> List[Any]:
    banned = set()
    for d in dietary:
        banned |= RESTRICTED.get(d.lower(), set())

    def _get_name(item: Any) -> str:
        return item if isinstance(item, str) else item.get("name", "").lower()

    return [item for item in inv if _get_name(item) not in banned]

# בונה הערה למודל לגבי מגבלות התזונה
def _build_restriction_note(dietary: List[str]) -> str:
    notes = []
    dset = {d.lower() for d in dietary}
    if "vegan" in dset:
        notes.append("IMPORTANT: 100 % plant-based – no meat, fish, dairy or eggs. Use tofu/legumes instead.")
    elif "vegetarian" in dset:
        notes.append("IMPORTANT: No meat or fish. Use plant-based substitutes.")
    if "gluten free" in dset:
        notes.append("IMPORTANT: Must be 100 % gluten-free – no wheat, barley, rye or derivatives.")
    if "kosher" in dset:
        notes.append("IMPORTANT: Keep recipe kosher – no pork/shellfish; do not mix meat with dairy.")
    if "halal" in dset:
        notes.append("IMPORTANT: Keep recipe halal – no pork or alcohol.")
    if "keto" in dset:
        notes.append("IMPORTANT: Keep net carbs very low (< 20 g per serving); moderate protein, high fat.")
    if "paleo" in dset:
        notes.append("IMPORTANT: Paleo – no grains, legumes or processed sugar; focus on meat, fish, vegetables, fruit, nuts.")
    return " ".join(notes)

# מחזיר תיאור טקסטואלי של רכיב (כולל יחידה וכמות אם קיימים)
def _ing_to_str(item: Any) -> str:
    if isinstance(item, str):
        return item
    name = item.get("name", "")
    quantity = item.get("quantity")
    unit = item.get("unit")
    return f"{quantity} {unit} {name}" if quantity and unit else name

# מספר מקסימלי של ניסיונות קריאה למודל
MAX_ATTEMPTS = 8
RETRY_DELAY = (0.6, 1.4)  # השהיה רנדומלית בין ניסיונות

# פונקציה עיקרית: יוצרת בקשת מתכונים מהמודל Groq
def suggest_recipes_from_groq(
    user_id: int,
    ingredients: List[Union[str, Dict[str, Any]]],
    user_message: str,
    user_prefs: dict[str, Any],
    prev_recipe: dict[str, Any] | None = None,
    num_recipes: int = 3
    
) -> dict[str, Any]:
    user_prefs = user_prefs or {}

    # חילוץ העדפות תזונתיות ואלרגיות
    dietary = [d.strip().lower() for d in user_prefs.get("dietary", [])]
    allergies = user_prefs.get("allergies", [])

    # סינון מלאי חומרים שלא מתאימים לדיאטה
    safe_inv = _filter_inventory(ingredients, dietary)

    if not safe_inv:
        return {"error": "No safe ingredients available.", "recipes": []}

    # טקסט מגבלות
    pref_txt = "; ".join(filter(None, [
        f"dietary restrictions: {', '.join(dietary)}" if dietary else "",
        f"allergies: {', '.join(allergies)}" if allergies else "",
    ])) or "no special preferences"

    # המרת רשימת רכיבים למחרוזת
    ing_txt = ", ".join(_ing_to_str(i) for i in safe_inv)

    # הערות למודל
    restriction_note = _build_restriction_note(dietary)

    # סיכום דירוגים קודמים
    rating_summary = summarize_user_ratings_for_prompt(user_id)

    # תבלינים מועדפים
    user_spices = get_spices_for_user(user_id)
    spices_txt = ", ".join(user_spices) if user_spices else "no specific spices available"

    # הוראה למודל להחזיר JSON בלבד, ללא markdown
    SYSTEM_LINE = (
        "SYSTEM: You are a recipe API. Output ONLY valid JSON. "
        "Do not include any conversational text, preamble, or markdown formatting like ```json."
)

    # קביעת רמת יצירתיות לפי הטקסט
    temperature = 0.7 if any(w in user_message.lower() for w in ["surprise", "different"]) else 0.4
    last_error = ""

    # לולאת ניסיונות בקשת מתכון
    for attempt in range(1, MAX_ATTEMPTS + 1):
        # בניית פרומפט מפורט
        base_prompt = (
            f"{SYSTEM_LINE}\n\n"
            "You are a helpful cooking assistant.\n"
            f"User message: {user_message}\n"
            f"Available ingredients: {ing_txt}\n"
            f"User {pref_txt}.\n"
            f"Available spices: {spices_txt}\n"
            f"{restriction_note}\n"
            f"{rating_summary}\n\n"
            "IMPORTANT:\n"
            "- You may assume the user has basic pantry items: Water, Oil, Salt, Pepper.\n" 
            "- Try to use MAINLY ingredients from the list above, but you can add basic pantry items if needed.\n"
            "- Use ONLY the following units: grams, kg, ml, l, pieces.\n"
            "- DO NOT use cups, tablespoons, teaspoons or any imperial/volume-based units.\n"
            "- Use only allowed units per ingredient type: "
            "liquids → ml/l, solids → grams/kg, countable (e.g. tomato, egg, orange) → pieces only.\n"
            "- Use realistic quantities per ingredient type:\n"
            "    - Spices (e.g. paprika, cumin): 1–15 grams max\n"
            "    - Liquids (e.g. milk, oil): 10–200 ml\n"
            "    - Salt and intense flavorings: very small amounts only (1–5 grams)\n"
            f"- You MUST return exactly {num_recipes} clearly different recipes using only the listed ingredients.\n"
            "- Recipes must not repeat title or main ingredients.\n"
            "- Each recipe must include AT LEAST 5 instruction steps.\n"
            "- Return a JSON object with this schema:\n"
            "{\n"
            '  "recipes": [\n'
            "    {\n"
            '      "title": <string>,\n'
            '      "description": <string>,\n'
            '      "difficulty": "Easy"|"Medium"|"Hard",\n'
            '      "servings": <integer>,\n'
            '      "prep_minutes": <integer>,\n'
            '      "cook_minutes": <integer>,\n'
            '      "calories_per_serving": <integer|null>,\n'
            '      "ingredients": [{"quantity": <number>, "unit": <string>, "name": <string>}],\n'
            '      "instructions": ["Step 1", "Step 2", ..., "Step 8+"]\n'
            "    }, ...\n"
            "  ]\n"
            "}"
        )

        # התאמה אם יש מתכון קודם
        prompt = base_prompt if not prev_recipe else (
            base_prompt.replace(
                "User message:",
                f"User previously received this recipe: {prev_recipe.get('title', 'Unnamed')}\n\nUser request:"
            )
        )
        MODEL_NAME = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        # שליחת בקשה למודל Groq
        try:
            res = openai.ChatCompletion.create(
                model=MODEL_NAME,
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=1200,
                response_format={"type": "json_object"},
            )
            raw_content = res["choices"][0]["message"]["content"]
            print("🧠 GROQ RAW (first 500):", raw_content[:500])


        
            parsed = _extract_json(raw_content)
            print("🧠 PARSED KEYS:", list(parsed.keys()) if parsed else None)
            if parsed and "recipes" in parsed:
                    print("🧠 RECIPES COUNT:", len(parsed["recipes"]))



        except OpenAIError as e:
            last_error = f"Groq API error ({e})"
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        # חילוץ JSON מהתגובה
        parsed = _extract_json(raw_content)
        if parsed is None or "recipes" not in parsed:
            last_error = "Invalid or missing 'recipes' in JSON"
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        # סינון מתכונים תקפים בלבד
        valid_recipes = []
        for r in parsed["recipes"]:
            if not isinstance(r, dict) or "title" not in r:
                continue
            valid_recipes.append(r)

        # אם יש מתכונים תקפים, מנרמל יחידות ומחזיר
        if valid_recipes:
            normalized = normalize_ingredient_units(valid_recipes, user_id)
            return {"recipes": normalized}



        # אם אין, ממשיך לנסות
        last_error = "No valid recipes returned"
        if attempt < MAX_ATTEMPTS:
            time.sleep(random.uniform(*RETRY_DELAY))
            continue

    # אם כל הניסיונות כשלו – מחזיר שגיאה
    return {"error": last_error, "recipes": []}
  # ותעיפי החוצה "error" או תזרקי Exception

