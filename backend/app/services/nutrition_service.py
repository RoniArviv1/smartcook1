# app/services/nutrition_service.py
# -------------------------------------------------------------
# Fetch basic nutrition facts (per 100 g/ml) from Open Food Facts
# -------------------------------------------------------------
import functools
import requests

SEARCH_URL = (
    "https://world.openfoodfacts.org/cgi/search.pl?"
    "action=process&json=1&search_simple=1&page_size=10"
    "&fields=product_name,nutriments"
)

@functools.lru_cache(maxsize=2048)
def fetch_nutrition(raw_name: str) -> dict | None:
    """
    Query Open Food Facts for the given ingredient name and return
    a dict with calories (kcal), protein, carbs and fat per 100 g.
    Returns None if no product with nutrition data is found.
    """
    name = raw_name.strip().lower()

    try:
        resp = requests.get(
            SEARCH_URL,
            params={"search_terms": name},
            timeout=5
        )
        if not resp.ok:
            print(f"[NutritionService] HTTP {resp.status_code} for '{name}'")
            return None

        data = resp.json()

        # Iterate over results until a product with calories is found
        for product in data.get("products", []):
            nutr = product.get("nutriments", {})
            kcal = (
                nutr.get("energy-kcal_100g") or
                _kj_to_kcal(nutr.get("energy-kj_100g"))
            )
            if kcal is None:
                continue

            return {
                "calories": kcal,
                "protein":  nutr.get("proteins_100g"),
                "carbs":    nutr.get("carbohydrates_100g"),
                "fat":      nutr.get("fat_100g"),
            }

        return None  # No suitable product found

    except (requests.RequestException, ValueError) as exc:
        print(f"[NutritionService] Error fetching '{name}': {exc}")
        return None


def _kj_to_kcal(kj):
    """Convert kilojoules to kilocalories if needed."""
    return round(float(kj) * 0.239006, 1) if kj is not None else None
