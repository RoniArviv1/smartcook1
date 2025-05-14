import json, os
from dotenv import load_dotenv
import openai
load_dotenv()

openai.api_key  = os.getenv("GROQ_API_KEY")
openai.api_base = "https://api.groq.com/openai/v1"

def suggest_recipes_from_groq(user_id, ingredients, user_message, user_prefs):
    """
    user_prefs  ← dict שמגיע מה-Frontend: למשל
      { 'dietary': ['vegetarian'], 'allergies': ['nuts'] }
    """

    # הופכים העדפות לטקסט קריא:
    pref_txt = []
    if user_prefs.get("dietary"):
        pref_txt.append(f"dietary restrictions: {', '.join(user_prefs['dietary'])}")
    if user_prefs.get("allergies"):
        pref_txt.append(f"allergies: {', '.join(user_prefs['allergies'])}")
    pref_txt = "; ".join(pref_txt) or "no special preferences"

    ing_txt = ", ".join(ingredients) if ingredients else "common pantry items"

    prompt = (
        "You are a helpful cooking assistant.\n"
        f"User message: {user_message}\n"
        f"Available ingredients: {ing_txt}\n"
        f"User {pref_txt}.\n"
        "Suggest ONE recipe and return **ONLY valid JSON** with the keys:\n"
        "{"
        '"title", "difficulty", "prep_minutes", "cook_minutes",'
        ' "ingredients", "instructions"'
        "}"
    )

    resp = openai.ChatCompletion.create(
        model="llama3-70b-8192",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.8,
        max_tokens=400,
    )

    # מנסים לפענח JSON
    raw = resp["choices"][0]["message"]["content"].strip()
    try:
        recipe = json.loads(raw)
    except Exception:
        # fallback – עוטפים כתשובת טקסט
        recipe = {
            "title": "AI Suggested Recipe",
            "difficulty": "Medium",
            "prep_minutes": 15,
            "cook_minutes": 25,
            "ingredients": ingredients,
            "instructions": [raw],
        }

    return {"user_id": user_id, "recipes": [recipe]}
