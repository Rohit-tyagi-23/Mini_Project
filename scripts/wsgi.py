"""
Production WSGI entry point.
Used by Gunicorn, uWSGI, or other WSGI servers.
"""
import os
import sys

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.dirname(SCRIPT_DIR)

if PROJECT_ROOT not in sys.path:
    sys.path.insert(0, PROJECT_ROOT)

from app import create_app

# Get environment from environment variable
config_name = os.getenv('FLASK_ENV', 'production')

# Create application instance
app = create_app(config_name)

if __name__ == '__main__':
    app.run()
