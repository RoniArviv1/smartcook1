import functools
import time
import requests

API_KEY = "GoxmYrNdpfCtRhRpjVAKeMesPQDfY1DZAWstODEi"
SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"
DETAIL_URL = "https://api.nal.usda.gov/fdc/v1/food"

# ---------------------------------------------------------------------------- #
#        פונקציה ראשית – מחזירה רק קלוריות/חלבון/פחמימות/שומן               #
# ---------------------------------------------------------------------------- #
@functools.lru_cache(maxsize=2048)
def fetch_nutrition(raw_name: str) -> dict | None:
    name = raw_name.strip().lower()

    def get_nutrient(nutrients, name):
        for n in nutrients:
            if n.get("nutrient", {}).get("name", "").lower() == name.lower():
                return n.get("amount")
        return None

    food = fetch_nutrition_raw(name)
    if not food:
        return None

    nutrients = food.get("foodNutrients", [])
    return {
        "calories": get_nutrient(nutrients, "Energy"),
        "protein":  get_nutrient(nutrients, "Protein"),
        "carbs":    get_nutrient(nutrients, "Carbohydrate, by difference"),
        "fat":      get_nutrient(nutrients, "Total lipid (fat)")
    }

# ---------------------------------------------------------------------------- #
#        פונקציה משלימה – מחזירה את כל המידע (כולל foodCategory וכו')        #
# ---------------------------------------------------------------------------- #
@functools.lru_cache(maxsize=2048)
def fetch_nutrition_raw(name: str) -> dict | None:
    name = name.strip().lower()
    max_retries = 3
    timeout = 8

    for attempt in range(1, max_retries + 1):
        try:
            print(f"[USDA RAW] Attempt {attempt} – searching for '{name}'")
            search_res = requests.get(
                SEARCH_URL,
                params={
                    "api_key": API_KEY,
                    "query": name,
                    "pageSize": 1,
                    "dataType": "Foundation,SR Legacy"
                },
                timeout=timeout
            )
            if not search_res.ok:
                print(f"[USDA RAW] Search failed ({search_res.status_code})")
                return None

            results = search_res.json().get("foods", [])
            if not results:
                print(f"[USDA RAW] No results found for '{name}'")
                return None

            fdc_id = results[0]["fdcId"]
            print(f"[USDA RAW] Found FDC ID: {fdc_id} for '{name}'")

            detail_res = requests.get(
                f"{DETAIL_URL}/{fdc_id}",
                params={"api_key": API_KEY},
                timeout=timeout
            )
            if not detail_res.ok:
                print(f"[USDA RAW] Detail fetch failed ({detail_res.status_code})")
                return None

            return detail_res.json()

        except requests.exceptions.Timeout:
            print(f"[USDA RAW] ⏱️ Timeout on attempt {attempt} for '{name}'")
        except requests.RequestException as e:
            print(f"[USDA RAW] ❌ Request failed: {e}")
            break

        time.sleep(1)

    print(f"🚫 No raw data for '{name}' after {max_retries} attempts")
    return None
