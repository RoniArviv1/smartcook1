# app/services/nutrition_service.py
# -------------------------------------------------------------
# Fetch basic nutrition facts (per 100 g/ml) from USDA FoodData Central
# -------------------------------------------------------------
import functools
import requests

API_KEY = "GoxmYrNdpfCtRhRpjVAKeMesPQDfY1DZAWstODEi"

SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
DETAIL_URL = "https://api.nal.usda.gov/fdc/v1/food"

@functools.lru_cache(maxsize=2048)
def fetch_nutrition(raw_name: str) -> dict | None:
    """
    Query USDA FoodData Central for the given ingredient name and return
    a dict with calories (kcal), protein, carbs and fat per 100g.
    Returns None if no product with nutrition data is found.
    """
    name = raw_name.strip().lower()

    try:
        # שלב 1: חיפוש
        search_res = requests.get(
            SEARCH_URL,
            params={
                "api_key": API_KEY,
                "query": name,
                "pageSize": 1,
                "dataType": "Foundation,SR Legacy"
            },
            timeout=5
        )

        if not search_res.ok:
            print(f"[USDA] Search failed: {search_res.status_code}")
            return None

        results = search_res.json().get("foods", [])
        if not results:
            print(f"[USDA] No results found for '{name}'")
            return None

        fdc_id = results[0]["fdcId"]
        # שלב 2: בקשת פרטי מזון
        detail_res = requests.get(
            f"{DETAIL_URL}/{fdc_id}",
            params={"api_key": API_KEY},
            timeout=5
        )

        if not detail_res.ok:
            print(f"[USDA] Detail fetch failed: {detail_res.status_code}")
            return None

        food = detail_res.json()
        nutrients = food.get("foodNutrients", [])
        def get_nutrient(name: str):
            for n in nutrients:
                if n.get("nutrient", {}).get("name", "").lower() == name.lower():
                    return n.get("amount")
            return None

        return {
            "calories": get_nutrient("Energy"),
            "protein": get_nutrient("Protein"),
            "carbs": get_nutrient("Carbohydrate, by difference"),
            "fat": get_nutrient("Total lipid (fat)")
        }

    except (requests.RequestException, ValueError) as exc:
        print(f"[USDA] Error fetching '{name}': {exc}")
        return None
