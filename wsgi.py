"""
Production WSGI entry point.
Used by Gunicorn, uWSGI, or other WSGI servers.
"""
import os
from app import create_app

# Get environment from environment variable
config_name = os.getenv('FLASK_ENV', 'production')

# Create application instance
app = create_app(config_name)

if __name__ == '__main__':
    app.run()
