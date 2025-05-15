from app.extensions import db
from app.models import InventoryItem
from datetime import datetime

def get_user_inventory(user_id):
    return InventoryItem.query.filter_by(user_id=user_id).all()

def add_inventory_item(user_id, data):
    print("Received data:", data)   # בדיקה

    expiration_date = None
    if data.get('expiry_date'):
        expiration_date = datetime.fromisoformat(data['expiry_date'])

    item = InventoryItem(
        user_id=user_id,
        name=data['name'],
        category=data.get('category', 'Uncategorized'),
        quantity=data['quantity'],
        unit=data.get('unit', ''),
        expiration_date=expiration_date
    )
    db.session.add(item)
    db.session.commit()
    return item


def delete_inventory_item(user_id, item_id):
    item = InventoryItem.query.filter_by(id=item_id, user_id=user_id).first()
    if item:
        db.session.delete(item)
        db.session.commit()
    return item