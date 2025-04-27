from flask import Flask
from app.extensions import db, migrate, jwt
from flask_cors import CORS  # ייבוא ניהול CORS

# ייבוא כל ה-Blueprints
from app.routes.assistant_routes import assistant_bp
from app.routes.auth_routes import auth_bp
from app.routes.inventory_routes import inventory_bp
from app.routes.notification_routes import notification_bp
from app.routes.recipe_routes import recipe_bp
from app.routes.user_routes import user_bp

def create_app():
    app = Flask(__name__)

    # === קונפיגורציה בסיסית ===
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:0504903322Rr@localhost:5432/smartcookdb'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'super-secret-key'

    # === אתחול הרחבות ===
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # === הגדרת CORS (מאפשר קריאות רק מה-Frontend) ===
    CORS(app, resources={r"/api/*": {"origins": "http://localhost:3000"}})

    # === רישום נתיבים (Blueprints) ===
    app.register_blueprint(assistant_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api')
    app.register_blueprint(inventory_bp, url_prefix='/api/inventory')
    app.register_blueprint(notification_bp, url_prefix='/api/notifications')
    app.register_blueprint(recipe_bp, url_prefix='/api/recipe')
    app.register_blueprint(user_bp, url_prefix='/api/profile')

    return app
