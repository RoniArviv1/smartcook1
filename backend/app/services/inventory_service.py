from app import db
from app.models import InventoryItem
from datetime import datetime

def get_user_inventory(user_id):
    return InventoryItem.query.filter_by(user_id=user_id).all()

def add_inventory_item(user_id, data):
    item = InventoryItem(
        user_id=user_id,
        name=data['name'],
        quantity=data['quantity'],
        expiration_date=datetime.fromisoformat(data['expiration_date'])
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
