import functools  # מאפשר שימוש ב־lru_cache, שהוא קאש לזיכרון פונקציות
import time       # מאפשר השהיות בין קריאות (למשל במקרים של שגיאות)
import requests   # ספרייה לביצוע בקשות HTTP (קריאות API)

# מפתח ה־API של USDA – מאגר מידע ממשלתי עם ערכים תזונתיים
API_KEY = "GoxmYrNdpfCtRhRpjVAKeMesPQDfY1DZAWstODEi"

# כתובת ה־API לחיפוש רכיב לפי שם (כמו "banana")
SEARCH_URL = "https://api.nal.usda.gov/fdc/v1/foods/search"

# כתובת ה־API לשליפת פרטי רכיב לפי מזהה (FDC ID)
DETAIL_URL = "https://api.nal.usda.gov/fdc/v1/food"

# ---------------------------------------------------------------------------- #
# 🌟 פונקציה עיקרית – מחזירה ערכים תזונתיים בסיסיים עבור רכיב אחד
# כוללת קלוריות, חלבון, פחמימות, שומן, ומשקל ממוצע ליחידה
# ---------------------------------------------------------------------------- #

@functools.lru_cache(maxsize=2048)  # שמירה בזיכרון של עד 2048 תוצאות קודמות לפי שם
def fetch_nutrition(raw_name: str) -> dict | None:
    # מנקה את שם הרכיב (מוריד רווחים וממיר לאותיות קטנות)
    name = raw_name.strip().lower()
    print(f"🔍 fetch_nutrition called for: {name}")

    # פונקציית עזר – שולפת ערך תזונתי מסוים מתוך רשימת nutrient-ים
    def get_nutrient(nutrients, name):
        for n in nutrients:
            # מחפש לפי שם הנוטריינט (לדוג' "Protein" או "Energy")
            if n.get("nutrient", {}).get("name", "").lower() == name.lower():
                return n.get("amount")  # מחזיר את הערך המספרי
        return None

    # פונקציית עזר – מוצאת את המשקל בגרמים של יחידת פריט (אם קיימת)
    def get_avg_weight_from_portions(portions):
        # סט של מילות מפתח שמסמנות יחידה שימושית (כמו "head" או "piece")
        priority_modifiers = {"whole", "head", "piece", "medium", "unit"}

        for p in portions:
            unit_name = p.get("measureUnit", {}).get("name", "").lower()
            modifier = p.get("modifier", "").lower()
            gram_weight = p.get("gramWeight")

            if not gram_weight:
                continue  # מדלגים אם אין משקל

            # אם היחידה מתאימה – נחזיר אותה
            if unit_name in {"piece", "unit", "head"} or modifier in priority_modifiers:
                return round(gram_weight)

        # fallback – אם לא נמצאה יחידה עדיפה, ניקח את הראשונה אם קיימת
        if portions:
            return round(portions[0].get("gramWeight", 0))

        return None  # לא נמצא שום משקל

    # קריאה לפונקציה המשלימה שמביאה את כל המידע הגולמי מה־API
    food = fetch_nutrition_raw(name)
    if not food:
        return None  # לא הצלחנו למצוא את הרכיב

    # שליפת שדות רלוונטיים מתוך הפלט שהתקבל
    nutrients = food.get("foodNutrients", [])
    portions = food.get("foodPortions", [])
    avg_weight = get_avg_weight_from_portions(portions)

    print(f"📦 Portions for {name}:", portions)
    print("avarage", avg_weight)

    # מחזיר מילון עם הערכים שרצינו בלבד
    return {
        "calories": get_nutrient(nutrients, "Energy"),
        "protein":  get_nutrient(nutrients, "Protein"),
        "carbs":    get_nutrient(nutrients, "Carbohydrate, by difference"),
        "fat":      get_nutrient(nutrients, "Total lipid (fat)"),
        "avg_weight": avg_weight,
    }

# ---------------------------------------------------------------------------- #
# 📦 פונקציה משלימה – מחזירה את כל המידע הגולמי על רכיב ממסד הנתונים של USDA
# בשני שלבים: 1. חיפוש לפי שם, 2. שליפת פרטים לפי מזהה
# ---------------------------------------------------------------------------- #

@functools.lru_cache(maxsize=2048)  # גם פה מוסיפים cache, כי קריאות API יקרות
def fetch_nutrition_raw(name: str) -> dict | None:
    name = name.strip().lower()
    max_retries = 3  # ננסה עד 3 פעמים אם נכשל
    timeout = 8      # כל ניסיון יקבל מקסימום 8 שניות לפני שייחסם

    for attempt in range(1, max_retries + 1):
        try:
            print(f"[USDA RAW] Attempt {attempt} – searching for '{name}'")

            # שלב 1: קריאה ל־SEARCH API לחיפוש רכיב לפי השם
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

            # שלב 2: קריאה ל־DETAIL API כדי לקבל את כל הנתונים של אותו רכיב
            detail_res = requests.get(
                f"{DETAIL_URL}/{fdc_id}",
                params={"api_key": API_KEY},
                timeout=timeout
            )

            if not detail_res.ok:
                print(f"[USDA RAW] Detail fetch failed ({detail_res.status_code})")
                return None

            return detail_res.json()

        # טיפול בשגיאות
        except requests.exceptions.Timeout:
            print(f"[USDA RAW] ⏱️ Timeout on attempt {attempt} for '{name}'")

        except requests.RequestException as e:
            print(f"[USDA RAW] ❌ Request failed: {e}")
            break

        time.sleep(1)  # מחכה שנייה לפני ניסיון נוסף

    print(f"🚫 No raw data for '{name}' after {max_retries} attempts")
    return None

# ---------------------------------------------------------------------------- #
# 🧽 ניקוי הקאש – מאפשר לרענן את כל התוצאות השמורות מהפונקציות למעלה
# ניתן לקרוא לפונקציה הזו כדי להתחיל הכל מהתחלה
# ---------------------------------------------------------------------------- #

def clear_nutrition_cache():
    fetch_nutrition.cache_clear()
    fetch_nutrition_raw.cache_clear()