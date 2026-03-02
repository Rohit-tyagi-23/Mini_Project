"""
Application factory pattern for production-ready Flask app.
Supports multiple environments and modular architecture.
"""
from flask import Flask
from app.extensions import db, mail
from app.config import config
import logging
from logging.handlers import RotatingFileHandler
import os


def create_app(config_name='development'):
    """
    Application factory pattern.
    
    Args:
        config_name: Environment configuration (development/production/testing)
    
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__,
                template_folder='../templates',
                static_folder='../static')
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    
    # Configure logging
    configure_logging(app)
    
    # Register blueprints
    from app.routes import auth_bp, dashboard_bp, forecast_bp, alerts_bp, api_bp, health_bp
    app.register_blueprint(auth_bp)
    app.register_blueprint(dashboard_bp)
    app.register_blueprint(forecast_bp)
    app.register_blueprint(alerts_bp)
    app.register_blueprint(api_bp, url_prefix='/api/v1')
    app.register_blueprint(health_bp)
    
    # Initialize database schema
    with app.app_context():
        from app.utils.database import ensure_database_schema
        ensure_database_schema(db)
    
    # Register error handlers
    register_error_handlers(app)
    
    # Performance monitoring
    if app.config.get('ENABLE_PROFILING'):
        from werkzeug.middleware.profiler import ProfilerMiddleware
        app.wsgi_app = ProfilerMiddleware(app.wsgi_app, restrictions=[30])
    
    app.logger.info(f'Application started in {config_name} mode')
    
    return app


def configure_logging(app):
    """Configure production-grade logging with rotation."""
    if not app.debug and not app.testing:
        if not os.path.exists('logs'):
            os.mkdir('logs')
        
        file_handler = RotatingFileHandler(
            'logs/restaurant_ai.log',
            maxBytes=10485760,  # 10MB
            backupCount=10
        )
        file_handler.setFormatter(logging.Formatter(
            '%(asctime)s %(levelname)s: %(message)s [in %(pathname)s:%(lineno)d]'
        ))
        file_handler.setLevel(logging.INFO)
        app.logger.addHandler(file_handler)
        app.logger.setLevel(logging.INFO)
        app.logger.info('Restaurant AI startup')


def register_error_handlers(app):
    """Register global error handlers."""
    from flask import jsonify, render_template
    
    @app.errorhandler(404)
    def not_found_error(error):
        if 'application/json' in str(app.config.get('HTTP_ACCEPT', '')):
            return jsonify({'error': 'Not found'}), 404
        return render_template('404.html'), 404
    
    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        app.logger.error(f'Internal error: {error}')
        if 'application/json' in str(app.config.get('HTTP_ACCEPT', '')):
            return jsonify({'error': 'Internal server error'}), 500
        return render_template('500.html'), 500
    
    @app.errorhandler(403)
    def forbidden_error(error):
        return jsonify({'error': 'Forbidden'}), 403
