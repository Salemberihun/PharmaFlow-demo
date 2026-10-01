from flask import Flask, jsonify
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from config import config

db = SQLAlchemy()
migrate = Migrate()

def create_app(config_name='default'):
    app = Flask(__name__)
    app.config.from_object(config[config_name])

    # Enable CORS for React frontend (localhost:5173, etc.)
    CORS(app, resources={r"/api/*": {"origins": "*"}})

    # Initialize extensions
    db.init_app(app)
    migrate.init_app(app, db)

    # Register models with metadata
    from app import models

    # Register API Blueprints
    from app.routes.health import health_bp
    from app.routes.medicines import medicines_bp
    from app.routes.batches import batches_bp
    from app.routes.dispensing import dispensing_bp
    from app.routes.dashboard import dashboard_bp
    from app.routes.reports import reports_bp
    from app.routes.categories import categories_bp
    from app.routes.suppliers import suppliers_bp
    from app.routes.users import users_bp

    app.register_blueprint(health_bp, url_prefix='/api')
    app.register_blueprint(medicines_bp, url_prefix='/api/medicines')
    app.register_blueprint(batches_bp, url_prefix='/api/batches')
    app.register_blueprint(dispensing_bp, url_prefix='/api/dispensing')
    app.register_blueprint(dashboard_bp, url_prefix='/api/dashboard')
    app.register_blueprint(reports_bp, url_prefix='/api/reports')
    app.register_blueprint(categories_bp, url_prefix='/api/categories')
    app.register_blueprint(suppliers_bp, url_prefix='/api/suppliers')
    app.register_blueprint(users_bp, url_prefix='/api/users')

    # Global Error Handlers
    @app.errorhandler(400)
    def bad_request(error):
        return jsonify({
            'error': True,
            'message': str(error.description if hasattr(error, 'description') else 'Bad Request')
        }), 400

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({
            'error': True,
            'message': str(error.description if hasattr(error, 'description') else 'Resource not found')
        }), 404

    @app.errorhandler(409)
    def conflict(error):
        return jsonify({
            'error': True,
            'message': str(error.description if hasattr(error, 'description') else 'Conflict')
        }), 409

    @app.errorhandler(500)
    def internal_error(error):
        try:
            db.session.rollback()
        except Exception:
            pass
        
        # In debug mode or development, return descriptive error
        orig_error = getattr(error, 'original_exception', error)
        msg = str(orig_error) if app.config.get('DEBUG') else 'An internal server error occurred'
        
        return jsonify({
            'error': True,
            'message': msg
        }), 500

    return app
