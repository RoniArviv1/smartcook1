from . import db
from werkzeug.security import generate_password_hash, check_password_hash
from sqlalchemy.dialects.postgresql import JSON


class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(64), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.Text, nullable=False)

    # store preferences as JSON
    preferences = db.Column(JSON, nullable=True, default=dict)

    def set_password(self, password: str):
        self.password_hash = generate_password_hash(password)

    def check_password(self, password: str) -> bool:
        return check_password_hash(self.password_hash, password)


class InventoryItem(db.Model):
    __tablename__ = 'inventory_items'

    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50))
    quantity = db.Column(db.Float, nullable=False)
    unit = db.Column(db.String(20))
    expiration_date = db.Column(db.Date, nullable=False)

    # FK → users.id
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    user = db.relationship('User', backref=db.backref('inventory_items', lazy=True))

    def to_dict(self):
        return {
            "id": self.id,
            "name": self.name,
            "category": self.category,
            "quantity": self.quantity,
            "unit": self.unit,
            "expiration_date": self.expiration_date.strftime('%Y-%m-%d') if self.expiration_date else None
        }
    
class SavedRecipe(db.Model):
    __tablename__ = 'saved_recipes'

    id           = db.Column(db.Integer, primary_key=True)
    user_id      = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    title        = db.Column(db.String(255), nullable=False)
    description  = db.Column(db.Text)
    difficulty   = db.Column(db.String(50))
    prep_minutes = db.Column(db.Integer)
    cook_minutes = db.Column(db.Integer)
    servings     = db.Column(db.Integer)
    ingredients  = db.Column(JSON)   # רשימה של dicts: {name, qty, unit}
    instructions = db.Column(JSON)   # רשימת צעדים (strings)
    dietary_tags = db.Column(JSON)   # תגיות דיאטה
    image_url    = db.Column(db.String(512))

    user = db.relationship('User', backref=db.backref('saved_recipes', lazy=True))

    def to_dict(self):
        return {
            "title": self.title,
            "description": self.description,
            "difficulty": self.difficulty,
            "prep_minutes": self.prep_minutes,
            "cook_minutes": self.cook_minutes,
            "servings": self.servings,
            "ingredients": self.ingredients,
            "instructions": self.instructions,
            "dietary_tags": self.dietary_tags,
            "image_url": self.image_url,
        }

