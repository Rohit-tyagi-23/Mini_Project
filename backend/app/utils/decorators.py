"""
Custom decorators for authentication, authorization, and rate limiting.
"""
from functools import wraps
from flask import session, redirect, url_for, request, jsonify
from models import User


def login_required(f):
    """Require user to be authenticated."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if 'user' not in session:
            # Check for simple browser session fallback
            client_key = f"{request.remote_addr}|{request.headers.get('User-Agent', '')}"
            # This would need access to simple_browser_sessions - consider moving to auth service
            if request.headers.get('Accept', '').startswith('application/json'):
                return jsonify({'error': 'Authentication required'}), 401
            return redirect(url_for('auth.login'))
        return f(*args, **kwargs)
    return decorated_function


def role_required(*roles):
    """Require user to have specific role(s)."""
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            if 'user' not in session:
                return jsonify({'error': 'Authentication required'}), 401
            
            user_role = session.get('role', 'staff')
            if user_role not in roles:
                return jsonify({'error': 'Insufficient permissions'}), 403
            
            return f(*args, **kwargs)
        return decorated_function
    return decorator


def api_key_required(f):
    """Require valid API key for API endpoints."""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        api_key = request.headers.get('X-API-Key')
        if not api_key:
            return jsonify({'error': 'API key required'}), 401
        
        # Validate API key against database
        # This is a placeholder - implement proper API key validation
        if api_key != 'valid-key':
            return jsonify({'error': 'Invalid API key'}), 401
        
        return f(*args, **kwargs)
    return decorated_function
