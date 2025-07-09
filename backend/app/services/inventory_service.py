"""
Inventory Service
-----------------
פעולות עזר לניהול מלאי עבור SmartCook.
"""

from __future__ import annotations

from datetime import datetime
from typing import Optional, Tuple, List
from app.extensions import db
from app.models import InventoryItem
from app.utils.unit_normalizer import normalize_single_unit
from app.services.nutrition_service import fetch_nutrition


# --------------------------------------------------------------------------- #
#                     קונפיגורציית יחידות שקילות (לדוגמה)                    #
# --------------------------------------------------------------------------- #

EQUIVALENT_UNITS = {
    "grams":  ["g", "gram", "grams", "kg", "kilogram", "kilograms"],
    "ml":     ["ml", "milliliter", "milliliters", "l", "liter", "liters"],
    "pieces": ["piece", "pieces", "pcs", "unit", "units"],
}

def are_units_equivalent(unit1: str, unit2: str) -> bool:
    """בודק האם שתי יחידות שייכות לאותה קבוצת שקילות."""
    unit1, unit2 = unit1.lower(), unit2.lower()
    for group in EQUIVALENT_UNITS.values():
        if unit1 in group and unit2 in group:
            return True
    return False

# --------------------------------------------------------------------------- #
#                              CRUD  עיקרי                                    #
# --------------------------------------------------------------------------- #

# ---------- שליפה ----------
def get_user_inventory(user_id: int) -> List[InventoryItem]:
    return InventoryItem.query.filter_by(user_id=user_id).all()

# ---------- הוספה / מיזוג ----------
def add_inventory_item(user_id: int, data: dict) -> InventoryItem:
    """
    מוסיף פריט חדש או מאחד עם קיים (אותו שם + תאריך תפוגה זהה + יחידה שקילה).
    שומר גם ערכים תזונתיים ראשוניים, אם טרם קיימים.
    """
    print("Received data:", data)

    # עיבוד נתונים ראשוני
    name = data["name"].strip().lower()
    quantity = data.get("quantity", 0)
    unit = data.get("unit", "")
    category = data.get("category", "Uncategorized")

    expiration_date: Optional[datetime.date] = None
    if data.get("expiration_date"):
        expiration_date = datetime.fromisoformat(data["expiration_date"])

    # נרמול לכמות + יחידה אחידה
    normalized_qty, normalized_unit = normalize_single_unit(quantity, unit)

    # חיפוש פריטים תואמים (שם + תאריך)
    existing_items = InventoryItem.query.filter_by(
        user_id=user_id, name=name, expiration_date=expiration_date
    ).all()

    for item in existing_items:
        if are_units_equivalent(item.unit, normalized_unit):
            # ממזג כמויות (אחרי נרמול לשני הצדדים)
            existing_qty, _ = normalize_single_unit(item.quantity, item.unit)
            combined_qty = existing_qty + normalized_qty
            final_qty, final_unit = normalize_single_unit(combined_qty, normalized_unit)

            item.quantity = final_qty
            item.unit = final_unit
            _ensure_nutrition(item)            # ודא ערכים תזונתיים
            db.session.commit()

            print(f"✔ Unified with existing item: {item.name} → {item.quantity} {item.unit}")
            return item

    # לא נמצא – יצירת פריט חדש
    item = InventoryItem(
        user_id=user_id,
        name=name,
        category=category,
        quantity=normalized_qty,
        unit=normalized_unit,
        expiration_date=expiration_date,
    )
    _ensure_nutrition(item)
    db.session.add(item)
    db.session.commit()

    print(f"✅ New item added: {item.name} ({normalized_qty} {normalized_unit})")
    return item

# ---------- עדכון ----------
def update_inventory_item(user_id: int, item_id: int, data: dict) -> Optional[InventoryItem]:
    item = InventoryItem.query.filter_by(id=item_id, user_id=user_id).first()
    if not item:
        return None

    # שדות בסיסיים
    item.name     = data.get("name", item.name).strip().lower()
    item.category = data.get("category", item.category)
    item.unit     = data.get("unit", item.unit)

    # כמות + יחידה עשויים להזדקק לנרמול
    quantity      = data.get("quantity", item.quantity)
    item.quantity, item.unit = normalize_single_unit(quantity, item.unit)

    # תאריך תפוגה
    if data.get("expiration_date"):
        item.expiration_date = datetime.fromisoformat(data["expiration_date"])

    _ensure_nutrition(item)
    db.session.commit()
    return item

# ---------- מחיקה ----------
def delete_inventory_item(user_id: int, item_id: int) -> Optional[InventoryItem]:
    item = InventoryItem.query.filter_by(id=item_id, user_id=user_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return item

# --------------------------------------------------------------------------- #
#                              Internal helpers                               #
# --------------------------------------------------------------------------- #

def _ensure_nutrition(item: InventoryItem) -> None:
    """
    אם הערכים התזונתיים חסרים – מנסה להשיגם מה-API ולשמור.
    """
    if all([item.calories, item.protein, item.carbs, item.fat]):
        return  # כבר קיים

    nutri = fetch_nutrition(item.name)
    if nutri:
        print(nutri)
        item.calories = nutri.get("calories")
        item.protein  = nutri.get("protein")
        item.carbs    = nutri.get("carbs")
        item.fat      = nutri.get("fat")
        print(f"🍎 Nutrition saved for {item.name}: {nutri}")
    else:
        print(f"🚫 No nutrition data for {item.name}")
