from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_jwt_extended import JWTManager
from app.routes.assistant_routes import assistant_bp  # ייבוא של ה-Blueprint מהנתיב

# אתחול של הספריות
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()

def create_app():
    # יצירת אפליקציה חדשה
    app = Flask(__name__)

    # הגדרת קונפיגורציה לאפליקציה
    app.config['SQLALCHEMY_DATABASE_URI'] = 'postgresql://postgres:0504903322Rr@localhost:5432/smartcookdb'  # הגדרת URI של בסיס הנתונים
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['JWT_SECRET_KEY'] = 'super-secret-key'  # הגדרת המפתח של JWT

    # אתחול של הספריות עם האפליקציה
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)

    # רישום של ה-Blueprint של ה-Assistant
    app.register_blueprint(assistant_bp, url_prefix='/api')

    return app
