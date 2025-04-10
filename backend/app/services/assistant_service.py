from huggingface_hub import InferenceClient

# את יכולה לטעון את הטוקן מקובץ חיצוני או להכניס אותו ישירות כאן
client = InferenceClient(api_key="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")

def suggest_recipes_from_huggingface(user_id, ingredients):
    """
    Generates a recipe based on user input using Hugging Face's Mistral model.
    
    :param user_id: str or int - ID of the user requesting the recipe
    :param ingredients: str - list of ingredients (e.g. "tomato, egg, onion")
    :return: dict with the result or error message
    """
    try:
        prompt = f"Give me a simple recipe using: {ingredients}"

        result = client.text_generation(
            prompt,
            model="mistralai/Mistral-7B-Instruct-v0.1",
            max_new_tokens=200
        )

        return {
            "user_id": user_id,
            "ingredients": ingredients,
            "recipe": result
        }

    except Exception as e:
        return {
            "user_id": user_id,
            "error": str(e)
        }