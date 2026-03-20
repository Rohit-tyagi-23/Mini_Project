"""
Environment-specific configuration classes.
Supports development, production, and testing environments.
"""
import os
from datetime import timedelta


def _normalized_database_url(default_url):
    """Normalize DATABASE_URL for SQLAlchemy compatibility on hosted platforms."""
    raw_url = os.getenv('DATABASE_URL')
    if not raw_url:
        return default_url
    if raw_url.startswith('postgres://'):
        return raw_url.replace('postgres://', 'postgresql://', 1)
    return raw_url


class Config:
    """Base configuration with common settings."""
    
    # Core Flask settings
    # IMPORTANT: Set SECRET_KEY via environment variable in production.
    # Fallback is kept to avoid hard startup failures on misconfigured first deploys.
    SECRET_KEY = os.getenv('SECRET_KEY')
    if not SECRET_KEY:
        SECRET_KEY = 'unsafe-temporary-key-change-me'
    
    JSON_SORT_KEYS = False
    
    # Database settings
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_RECORD_QUERIES = True
    SQLALCHEMY_ECHO = False
    
    # Session settings
    SESSION_COOKIE_SECURE = True  # HTTPS only
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Lax'
    PERMANENT_SESSION_LIFETIME = timedelta(hours=24)
    
    # Email settings
    MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
    MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
    MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'True') == 'True'
    MAIL_USERNAME = os.getenv('MAIL_USERNAME')
    MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
    MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@restaurantai.com')
    
    # Alert settings
    TWILIO_ACCOUNT_SID = os.getenv('TWILIO_ACCOUNT_SID')
    TWILIO_AUTH_TOKEN = os.getenv('TWILIO_AUTH_TOKEN')
    TWILIO_PHONE_NUMBER = os.getenv('TWILIO_PHONE_NUMBER')
    
    # Cache settings
    CACHE_TYPE = 'simple'
    CACHE_DEFAULT_TIMEOUT = 300
    
    # Rate limiting
    RATELIMIT_ENABLED = True
    RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
    
    # Performance
    ENABLE_PROFILING = False
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max request
    
    # Logging
    LOG_LEVEL = 'INFO'
    
    @staticmethod
    def init_app(app):
        """Initialize application-specific configuration."""
        pass


class DevelopmentConfig(Config):
    """Development environment configuration."""
    DEBUG = True
    TESTING = False
    
    SQLALCHEMY_DATABASE_URI = _normalized_database_url('sqlite:///restaurant_ai_dev.db')
    
    # Looser security for development
    SESSION_COOKIE_SECURE = False
    
    CACHE_TYPE = 'simple'
    SQLALCHEMY_ECHO = False  # Can be True for SQL debugging
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        app.logger.setLevel('DEBUG')


class ProductionConfig(Config):
    """Production environment configuration with enhanced security."""
    DEBUG = False
    TESTING = False
    
    SQLALCHEMY_DATABASE_URI = _normalized_database_url('sqlite:///restaurant_ai_prod_fallback.db')
    
    # Production database optimizations
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 3600,
        'pool_pre_ping': True,
        'max_overflow': 20
    }
    
    # Redis cache for production
    CACHE_TYPE = 'redis'
    CACHE_REDIS_URL = os.getenv('REDIS_URL', 'redis://localhost:6379/0')
    
    # Strict security
    SESSION_COOKIE_SECURE = True
    SESSION_COOKIE_HTTPONLY = True
    SESSION_COOKIE_SAMESITE = 'Strict'
    
    @staticmethod
    def init_app(app):
        Config.init_app(app)
        
        # Production-specific initialization
        import logging
        from logging.handlers import SysLogHandler
        
        syslog_handler = SysLogHandler()
        syslog_handler.setLevel(logging.WARNING)
        app.logger.addHandler(syslog_handler)


class TestingConfig(Config):
    """Testing environment configuration."""
    TESTING = True
    DEBUG = True
    
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    WTF_CSRF_ENABLED = False
    
    # Disable email sending in tests
    MAIL_SUPPRESS_SEND = True
    
    # Fast hashing for tests
    BCRYPT_LOG_ROUNDS = 4
    
    CACHE_TYPE = 'null'
    RATELIMIT_ENABLED = False


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}
