from datetime import datetime, timedelta
from app.models import InventoryItem

def get_expiring_items(user_id):
    today = datetime.today().date()
    upcoming = today + timedelta(days=3)
    items = InventoryItem.query.filter(
        InventoryItem.user_id == user_id,
        InventoryItem.expiration_date <= upcoming
    ).all()

    return [
        {"name": item.name, "expires_in_days": (item.expiration_date - today).days}
        for item in items
    ]
