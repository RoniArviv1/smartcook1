from app.services.inventory_service import get_category_and_avg_weight
# פונקציה שמחזירה את הקטגוריה (כמו dairy, countable וכו') ואת המשקל הממוצע של רכיב מסוים

from app.utils.unit_constants import AVERAGE_WEIGHT, UNIT_MAP, MIN_QTY, MAX_QTY
# מילוני עזר: ממירים יחידות, מחזיקים משקל ממוצע פר פריט, כמויות מינימום ומקסימום לפי קטגוריה

def normalize_ingredient_units(recipes: list[dict], user_id: int) -> list[dict]:
    """
    מנרמלת יחידות וכמויות של רכיבים בכל מתכון.
    לדוגמה: במקום 150 גרם בננה → 1-2 בננות (יחידות)
    משתמשת במידע אישי של המשתמש והגדרות כלליות.
    """
    
    category_cache = {}  # קאש פנימי – חוסך קריאות חוזרות לקטגוריה ומשקל ממוצע

    # פונקציה פנימית שמחזירה את הקטגוריה והמשקל הממוצע של רכיב מסוים
    def get_cached_info(name: str) -> tuple[str, float | None]:
        if name in category_cache:
            return category_cache[name]  # אם כבר קיים בקאש – מחזיר משם

        # אחרת, שולף ומעדכן בקאש
        cat, avg_weight = get_category_and_avg_weight(name, user_id)
        category_cache[name] = (cat, avg_weight)
        return cat, avg_weight

    # ריצה על כל מתכון
    for recipe in recipes:
        for ing in recipe.get("ingredients", []):  # לכל רכיב במתכון
            name = ing.get("name", "").lower()
            unit = ing.get("unit", "").lower()
            quantity = ing.get("quantity", 0)

            # שליפת הקטגוריה (למשל: dairy, fruit_And_Vegetable, countable)
            category, avg_weight = get_cached_info(name)

            # אם אין משקל ממוצע ספציפי – נ fallback ל־AVERAGE_WEIGHT גלובלי
            avg_weight = avg_weight or AVERAGE_WEIGHT.get(name)

            # 🍎 קטגוריה: פירות וירקות – נעדיף להמיר ליחידות (pieces)
            if category == "fruit_And_Vegetable":
                if unit in ["grams", "g", "kg"] and avg_weight:
                    # ממירים את המשקל הכולל ל־grams
                    total_grams = quantity * 1000 if unit == "kg" else quantity
                    # מחשבים כמה יחידות שוות הכמות הזו לפי משקל ממוצע
                    pieces = round(total_grams / avg_weight)
                    ing["unit"] = "pieces"
                    ing["quantity"] = max(1, pieces)  # לפחות 1 יחידה
                else:
                    # אם היחידה כבר ב־pieces או לא ניתנת להמרה – נשארים איתה
                    ing["unit"] = unit
                    ing["quantity"] = round(quantity)

            # 🥚 קטגוריה: פריטים ניתנים לספירה – לדוגמה ביצים, לחמניות
            elif category == "countable":
                if unit in ["grams", "g", "kg"]:
                    if avg_weight:
                        total_grams = quantity * 1000 if unit == "kg" else quantity
                        pieces = round(total_grams / avg_weight)
                        ing["unit"] = "pieces"
                        ing["quantity"] = max(1, pieces)
                    else:
                        # אם אין לנו משקל ממוצע – מניחים יחידה אחת כברירת מחדל
                        ing["unit"] = "pieces"
                        ing["quantity"] = 1
                else:
                    # כבר ב־pieces – לא משנים
                    ing["unit"] = "pieces"

            # 🧀 קטגוריה: מוצרי חלב – נרצה לאחד ליחידות מוכרות כמו גרמים/מ"ל
            elif category == "dairy":
                target_unit, factor = UNIT_MAP.get(unit, (unit.strip(), 1))
                ing["unit"] = target_unit
                ing["quantity"] = round(quantity * factor, 2)

            # 🧂 כל שאר הקטגוריות – משתמשים ב־UNIT_MAP להמרה, ואז מגבילים
            else:
                target_unit, factor = UNIT_MAP.get(unit, (unit.strip(), 1))
                ing["unit"] = target_unit
                ing["quantity"] = round(quantity * factor, 2)

                # הגבלות בטיחות/היגיון: כמות מינימלית/מקסימלית לפי קטגוריה
                min_qty = MIN_QTY.get(category)
                max_qty = MAX_QTY.get(category)

                if min_qty and ing["quantity"] < min_qty:
                    ing["quantity"] = min_qty
                if max_qty and ing["quantity"] > max_qty:
                    ing["quantity"] = max_qty

    return recipes  # מחזיר את רשימת המתכונים עם רכיבים מנורמלים