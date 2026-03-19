"""
Shared Flask extensions initialized here to avoid circular imports.
Following the application factory pattern.
"""
from flask_sqlalchemy import SQLAlchemy
from flask_mail import Mail

# Initialize extensions without app binding
db = SQLAlchemy()
mail = Mail()

# Cache will be initialized based on environment
cache = None

def init_cache(app):
    """Initialize cache based on configuration."""
    global cache
    cache_type = app.config.get('CACHE_TYPE', 'simple')
    
    if cache_type == 'redis':
        from flask_caching import Cache
        cache = Cache(app, config={
            'CACHE_TYPE': 'redis',
            'CACHE_REDIS_URL': app.config.get('CACHE_REDIS_URL'),
            'CACHE_DEFAULT_TIMEOUT': app.config.get('CACHE_DEFAULT_TIMEOUT', 300)
        })
    else:
        from flask_caching import Cache
        cache = Cache(app, config={'CACHE_TYPE': 'simple'})
    
    return cache
