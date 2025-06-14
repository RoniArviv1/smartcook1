from __future__ import annotations
import json, os, re, time, random
from typing import Any, List

from dotenv import load_dotenv
import openai
from openai.error import OpenAIError

load_dotenv()
openai.api_key  = os.getenv("GROQ_API_KEY")
openai.api_base = "https://api.groq.com/openai/v1"

RESTRICTED = {
    "vegetarian": {"beef", "pork", "chicken", "turkey", "fish", "shrimp", "lamb", "bacon"},
    "vegan": {
        "beef", "pork", "chicken", "turkey", "fish", "shrimp", "lamb",
        "milk", "cheese", "butter", "yogurt", "cream", "egg", "honey",
    },
    "gluten free": {
        "wheat", "barley", "rye", "bread", "pasta", "flour",
        "spaghetti", "noodles", "bulgur", "couscous", "semolina",
    },
}

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
                return text[start : i + 1]
    return None

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

def _filter_inventory(inv: List[str], dietary: List[str]) -> List[str]:
    banned = set()
    for d in dietary:
        banned |= RESTRICTED.get(d.lower(), set())
    return [i for i in inv if i.lower() not in banned]

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

MAX_ATTEMPTS = 8
RETRY_DELAY = (0.6, 1.4)

def suggest_recipes_from_groq(
    user_id: int,
    ingredients: List[str],
    user_message: str,
    user_prefs: dict[str, Any],
    prev_recipe: dict[str, Any] | None = None,
) -> dict[str, Any]:

    dietary = [d.strip().lower() for d in user_prefs.get("dietary", [])]
    allergies = user_prefs.get("allergies", [])
    safe_inv = _filter_inventory(ingredients, dietary)

    pref_txt = "; ".join(filter(None, [
        f"dietary restrictions: {', '.join(dietary)}" if dietary else "",
        f"allergies: {', '.join(allergies)}" if allergies else "",
    ])) or "no special preferences"

    ing_txt = ", ".join(safe_inv) if safe_inv else "common pantry items"
    restriction_note = _build_restriction_note(dietary)

    SYSTEM_LINE = (
        "SYSTEM: You must reply with ONE valid JSON object only. "
        "Do NOT wrap it in markdown. If you cannot comply, reply with an empty object {}."
    )

    temperature = 0.9 if any(w in user_message.lower() for w in ["surprise", "different"]) else 0.4

    last_error = ""
    for attempt in range(1, MAX_ATTEMPTS + 1):

        base_prompt = (
            f"{SYSTEM_LINE}\n\n"
            "You are a helpful cooking assistant.\n"
            f"User message: {user_message}\n"
            f"Available ingredients: {ing_txt}\n"
            "IMPORTANT: You MUST ONLY use ingredients from the list above. "
            "Do NOT include or suggest any ingredients not in the list.\n"
            f"User {pref_txt}.\n"
            f"{restriction_note}\n\n"
            "Return RAW JSON only with this schema:\n"
            "{\n"
            '  "title":       <string>,\n'
            '  "description": <string>,\n'
            '  "difficulty":  <"Easy"|"Medium"|"Hard">,\n'
            '  "servings":    <integer>,\n'
            '  "prep_minutes":<integer>,\n'
            '  "cook_minutes":<integer>,\n'
            '  "calories_per_serving":<integer|null>,\n'
            '  "ingredients":[{"qty":<number>,"unit":<string>,"name":<string>}],\n'
            '  "instructions":["Step 1 text", "Step 2 text", ..., "Step 8+"]\n'
            "}"
        )

        prompt = base_prompt if not prev_recipe else (
            base_prompt.replace(
                "User message:",
                f"User previously received this recipe: {prev_recipe.get('title', 'Unnamed')}\n\nUser request:"
            )
        )

        try:
            res = openai.ChatCompletion.create(
                model="llama3-70b-8192",
                messages=[{"role": "user", "content": prompt}],
                temperature=temperature,
                max_tokens=750,
                response_format={"type": "json_object"},
            )
            raw_content = res["choices"][0]["message"]["content"]
        except OpenAIError as e:
            last_error = f"Groq API error ({e})"
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        recipe = _extract_json(raw_content)

        if recipe is None:
            try:
                fix = openai.ChatCompletion.create(
                    model="llama3-70b-8192",
                    messages=[
                        {"role": "system", "content": "Convert the following into ONE valid JSON object only, same schema, no markdown:"},
                        {"role": "user", "content": raw_content},
                    ],
                    temperature=0.0,
                    max_tokens=400,
                    response_format={"type": "json_object"},
                )
                recipe = _extract_json(fix["choices"][0]["message"]["content"])
            except Exception:
                recipe = None

        if recipe is None:
            last_error = "Invalid JSON from model"
            if attempt < MAX_ATTEMPTS:
                time.sleep(random.uniform(*RETRY_DELAY))
                continue
            return {"error": last_error, "recipes": []}

        for ing in recipe.get("ingredients", []):
            if not isinstance(ing.get("qty"), (int, float)):
                ing["qty"], ing["unit"] = 100, "g"

        if len(recipe.get("instructions", [])) < 8:
            try:
                fix = openai.ChatCompletion.create(
                    model="llama3-70b-8192",
                    messages=[
                        {"role": "assistant", "content": json.dumps(recipe)},
                        {"role": "user", "content": "Expand instructions to 8-12 detailed steps. Return JSON only."},
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

        if len(recipe.get("instructions", [])) >= 8:
            return {"user_id": user_id, "recipes": [recipe]}

        last_error = "Recipe too short / invalid"
        if attempt < MAX_ATTEMPTS:
            time.sleep(random.uniform(*RETRY_DELAY))
            continue

    return {"error": f"Groq failed after {MAX_ATTEMPTS} attempts: {last_error}", "recipes": []}
