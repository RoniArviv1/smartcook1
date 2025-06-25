from flask import Flask
from flask_cors import CORS
from app.extensions import db, migrate, jwt
import os
from app.routes.rating_routes import rating_bp


# Blueprint imports (deferred to avoid circular)
from app.routes.assistant_routes    import assistant_bp
from app.routes.auth_routes         import auth_bp
from app.routes.inventory_routes    import inventory_bp
from app.routes.recipe_routes       import recipe_bp
from app.routes.user_routes         import user_bp
from app.routes.barcode_routes import barcode_bp
from app.routes.scan_routes import scan_bp

def create_app():
    app = Flask(__name__)

    # Base config (env-aware)
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:0504903322Rr@localhost:5432/smartcookdb')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'super-secret-key')

    # ✅ CORS – simplified and effective
    CORS(app, resources={r"/api/*": {
        "origins": [
            "http://localhost:3000",
            "http://localhost:3001",
            "http://localhost:3002"
        ],
        "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        "allow_headers": ["Content-Type", "Authorization"],
        "expose_headers": ["Content-Type", "Authorization"],
        "supports_credentials": True
    }})
    print("✅ CORS configuration loaded!")


    # Init extensions
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # Register Blueprints
    app.register_blueprint(assistant_bp,    url_prefix='/api')
    app.register_blueprint(auth_bp,         url_prefix='/api/auth')
    app.register_blueprint(inventory_bp,    url_prefix='/api/inventory')
    app.register_blueprint(recipe_bp,       url_prefix='/api/recipes')
    app.register_blueprint(user_bp,         url_prefix='/api')
    app.register_blueprint(rating_bp, url_prefix='/api')
    app.register_blueprint(barcode_bp, url_prefix="/api")
    app.register_blueprint(scan_bp, url_prefix="/api")


    return app
