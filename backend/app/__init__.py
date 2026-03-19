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
import re


def create_app(config_name='development'):
    """
    Application factory pattern.
    
    Args:
        config_name: Environment configuration (development/production/testing)
    
    Returns:
        Configured Flask application instance
    """
    app = Flask(__name__,
                template_folder='../../frontend/templates',
                static_folder='../../frontend/static')
    
    # Load configuration
    app.config.from_object(config[config_name])
    config[config_name].init_app(app)
    
    # Initialize extensions
    db.init_app(app)
    mail.init_app(app)
    
    # Configure logging
    configure_logging(app)
    
    # Validate security configuration
    validate_security_config(app, config_name)
    
    # Register blueprints
    # Note: Most routes are currently in app.py
    # Future: Move routes to modular blueprints
    from app.routes import health_bp
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


def validate_security_config(app, config_name):
    """
    Validate critical security configuration.
    Issues warnings for weak settings in production.
    """
    logger = app.logger
    
    if config_name == 'production':
        logger.info('=' * 60)
        logger.info('PRODUCTION SECURITY VALIDATION')
        logger.info('=' * 60)
        
        # Check SECRET_KEY
        secret_key = app.config.get('SECRET_KEY')
        if not secret_key or secret_key == 'dev-key-change-in-production':
            logger.error('❌ CRITICAL: SECRET_KEY not properly set for production!')
            logger.error('   Set environment variable: export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")')
            raise ValueError("CRITICAL: SECRET_KEY must be set to a strong random value in production!")
        elif len(secret_key) < 32:
            logger.warning(f'⚠️  WARNING: SECRET_KEY is only {len(secret_key)} characters. Recommend 64+ characters.')
        else:
            logger.info('✓ SECRET_KEY is properly configured (32+ characters)')
        
        # Check DATABASE_URL
        db_url = app.config.get('SQLALCHEMY_DATABASE_URI')
        if db_url and 'sqlite' in db_url:
            logger.error('❌ CRITICAL: SQLite database configured for production!')
            logger.error('   Configure PostgreSQL instead:')
            logger.error('   export DATABASE_URL="postgresql://user:password@host:5432/database"')
            raise ValueError("CRITICAL: SQLite cannot be used in production. Use PostgreSQL!")
        elif db_url and ':changeme@' in db_url:
            logger.warning('⚠️  WARNING: Database password appears to be default value')
        elif db_url:
            logger.info('✓ PostgreSQL database configured')
        
        # Check REDIS_URL
        redis_url = app.config.get('RATELIMIT_STORAGE_URL')
        if redis_url == 'memory://':
            logger.warning('⚠️  WARNING: Rate limiting using in-memory storage (not persistent)')
            logger.warning('   Configure Redis:')
            logger.warning('   export REDIS_URL="redis://localhost:6379/0"')
        elif redis_url:
            logger.info('✓ Redis cache configured')
        
        # Check MAIL configuration
        mail_username = app.config.get('MAIL_USERNAME')
        if not mail_username:
            logger.warning('⚠️  WARNING: MAIL_USERNAME not configured. Email notifications disabled.')
        else:
            logger.info(f'✓ Email configured: {mail_username}')
        
        # Check Flask DEBUG mode
        if app.debug:
            logger.error('❌ CRITICAL: DEBUG mode enabled in production!')
            logger.error('   Set environment variable: export FLASK_ENV=production')
            raise ValueError("CRITICAL: DEBUG mode must be disabled in production!")
        else:
            logger.info('✓ DEBUG mode disabled')
        
        # Check HTTPS/TLS enforcement
        if not app.config.get('SESSION_COOKIE_SECURE'):
            logger.warning('⚠️  WARNING: SESSION_COOKIE_SECURE not enabled (HTTPS required)')
        else:
            logger.info('✓ HTTPS cookies enforced')
        
        logger.info('=' * 60)
        logger.info('Security validation complete')
        logger.info('=' * 60)
    
    elif config_name == 'development':
        logger.info('🚀 Development mode - some security features relaxed')
        logger.info('   Remember: Never use development settings in production!')
    
    elif config_name == 'testing':
        logger.info('🧪 Testing mode - security features relaxed for tests')


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
