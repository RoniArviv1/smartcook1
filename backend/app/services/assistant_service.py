from huggingface_hub import InferenceClient
from dotenv import load_dotenv
import os

load_dotenv()
client = InferenceClient(api_key=os.getenv("HUGGINGFACE_API_KEY"))

def suggest_recipes_from_huggingface(user_id, ingredients, user_message):
    try:
        ingredients_text = ', '.join(ingredients) if ingredients else 'common ingredients like eggs, flour, and milk'

        prompt = (
            f"You are a helpful cooking assistant.\n"
            f"Suggest a simple and creative recipe using these ingredients: {ingredients_text}.\n"
            f"Write it as a short paragraph, including the recipe title, main ingredients, and brief instructions.\n"
            f"Keep it clear and concise."
        )

        print("📤 Sending prompt to AI:\n", prompt)

        result = client.text_generation(
            prompt=prompt,
            model="google/flan-t5-large",
            max_new_tokens=150,
            temperature=0.9
        )

        print("🎯 AI Raw Response:\n", result)

        recipe_data = {
            "title": "AI Suggested Recipe",
            "ingredients": ingredients if ingredients else ['Eggs', 'Flour', 'Milk'],
            "instructions": [result.strip()]   # כל הפסקה בתוך רשימה אחת
        }

        return {
            "user_id": user_id,
            "recipes": [recipe_data]
        }

    except Exception as e:
        print("❗ Hugging Face Error:", e)
        return {
            "user_id": user_id,
            "recipes": [],
            "error": str(e)
        }
