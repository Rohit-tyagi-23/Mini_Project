"""
Blueprint registration for modular route organization.
Each blueprint represents a major feature area.

Note: Routes are currently defined in app.py. Blueprints are defined here
for future modular route organization.
"""
from flask import Blueprint

# Authentication routes
auth_bp = Blueprint('auth', __name__)

# Dashboard routes
dashboard_bp = Blueprint('dashboard', __name__)

# Forecasting routes
forecast_bp = Blueprint('forecast', __name__)

# Alert management routes
alerts_bp = Blueprint('alerts', __name__)

# API v1 routes
api_bp = Blueprint('api', __name__)

# Health check and monitoring routes
health_bp = Blueprint('health', __name__)

# Import only existing route handlers
from app.routes import health
