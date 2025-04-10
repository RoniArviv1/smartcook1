from app.utils.recommendation_engine import recommend_recipes
from app.models import InventoryItem

def get_recommended_recipes(user_id):
    items = InventoryItem.query.filter_by(user_id=user_id).all()
    inventory = [item.name.lower() for item in items]
    return recommend_recipes(inventory)
