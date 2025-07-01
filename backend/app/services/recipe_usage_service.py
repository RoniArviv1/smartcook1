#recipe_usage_service.py

from app.models import InventoryItem
from app.extensions import db
from app.utils.ingredient_utils import classify_ingredient, AVERAGE_WEIGHT
from app.utils.unit_normalizer import UNIT_MAP

def normalize(name: str, qty: float, unit: str) -> tuple[float, str]:
    name = name.lower()
    unit = unit.lower().strip()
    ingredient_type = classify_ingredient(name)

    # המרה לפי טבלת יחידות
    target_unit, factor = UNIT_MAP.get(unit, (unit, 1))
    qty *= factor

    # אם מדובר ברכיב "ספור" כמו ביצה – נתרגם ל־grams אם יש משקל ממוצע
    if ingredient_type == "countable" and target_unit == "pieces":
        avg_weight = AVERAGE_WEIGHT.get(name)
        if avg_weight:
            return qty * avg_weight, "grams"

    return qty, target_unit


def update_inventory_after_recipe(user_id: int, ingredients: list) -> dict:
    if not user_id or not ingredients:
        return {"error": "Missing user_id or ingredients"}

    updated_items = []
    skipped_items = []
    removed_items = []        # ⭐️ חדש – נעקוב אחרי פריטים שנמחקו

    for ingredient in ingredients:
        name = ingredient.get("name")
        used_qty = float(ingredient.get("quantity", 0))
        used_unit = ingredient.get("unit")

        if not name or used_qty <= 0 or not used_unit:
            continue

        # שלב 1: נרמול רכיב מהמתכון
        used_qty_norm, used_unit_norm = normalize(name, used_qty, used_unit)

        # שלב 2: שליפת פריט מהמלאי
        item = InventoryItem.query.filter_by(user_id=user_id, name=name).first()
        if not item:
            skipped_items.append(name)
            continue

        # שלב 3: נרמול פריט מהמלאי
        inv_qty_norm, inv_unit_norm = normalize(name, item.quantity, item.unit)

        # שלב 4: השוואת יחידות
        if used_unit_norm != inv_unit_norm:
            skipped_items.append(name)
            continue

        # שלב 5: עדכון / מחיקה
        new_qty = max(inv_qty_norm - used_qty_norm, 0)

        if new_qty == 0:
            # 🔥 מוחקים את הפריט מהמלאי
            db.session.delete(item)
            removed_items.append(name)
        else:
            item.quantity = new_qty
            item.unit = inv_unit_norm
            updated_items.append({
                "name": name,
                "unit": inv_unit_norm,
                "from": round(inv_qty_norm, 2),
                "to":   round(new_qty,    2)
            })

    db.session.commit()

    return {
        "message": "Inventory updated after using recipe",
        "updated_items": updated_items,
        "removed": removed_items,   # ⭐️ מוחזרים הפריטים שנמחקו
        "skipped": skipped_items
    }