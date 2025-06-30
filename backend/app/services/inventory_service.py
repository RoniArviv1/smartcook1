from app.extensions import db
from app.models import InventoryItem
from datetime import datetime
from app.utils.unit_normalizer import normalize_single_unit  # הוספה

def get_user_inventory(user_id):
    return InventoryItem.query.filter_by(user_id=user_id).all()

from app.extensions import db
from app.models import InventoryItem
from datetime import datetime
from app.utils.unit_normalizer import normalize_single_unit

EQUIVALENT_UNITS = {
    "grams": ["grams", "kg"],
    "ml": ["ml", "l"],
    "pieces": ["pieces"]
}

def are_units_equivalent(unit1, unit2):
    for group in EQUIVALENT_UNITS.values():
        if unit1 in group and unit2 in group:
            return True
    return False

def add_inventory_item(user_id, data):
    print("Received data:", data)

    expiration_date = None
    if data.get('expiration_date'):
        expiration_date = datetime.fromisoformat(data['expiration_date'])

    name = data['name'].strip().lower()
    quantity = data.get('quantity', 0)
    unit = data.get('unit', '')
    normalized_qty, normalized_unit = normalize_single_unit(quantity, unit)

    # חיפוש פריט עם אותו שם ותאריך
    existing_items = InventoryItem.query.filter_by(
        user_id=user_id,
        name=name,
        expiration_date=expiration_date
    ).all()

    for item in existing_items:
        if are_units_equivalent(item.unit, normalized_unit):
            # נרמול כמות קיימת ליחידה אחידה
            existing_qty, _ = normalize_single_unit(item.quantity, item.unit)
            combined_qty = existing_qty + normalized_qty

            # 🔁 נרמול מחדש לכמות מאוחדת
            final_qty, final_unit = normalize_single_unit(combined_qty, normalized_unit)

            item.quantity = final_qty
            item.unit = final_unit
            db.session.commit()
            print(f"✔ Unified with existing item: {item.name} → {item.quantity} {item.unit}")
            return item

    # 🆕 אם לא נמצא פריט – צור חדש
    item = InventoryItem(
        user_id=user_id,
        name=name,
        category=data.get('category', 'Uncategorized'),
        quantity=normalized_qty,
        unit=normalized_unit,
        expiration_date=expiration_date
    )
    db.session.add(item)
    db.session.commit()
    print(f"✅ New item added: {item.name} ({normalized_qty} {normalized_unit})")
    return item




def delete_inventory_item(user_id, item_id):
    item = InventoryItem.query.filter_by(id=item_id, user_id=user_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return item
