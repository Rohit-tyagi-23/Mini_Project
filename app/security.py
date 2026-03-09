"""
Security utilities and functions for Restaurant AI.
Handles password validation, audit logging, and security event tracking.
"""

import logging
import re
from datetime import datetime
from functools import wraps
from flask import request, current_app, session


def log_security_event(event_type, user_id=None, details=None, severity='INFO'):
    """
    Log a security-relevant event for audit trail.
    
    Args:
        event_type: Type of event (LOGIN, LOGOUT, PASSWORD_CHANGE, FAILED_AUTH, etc.)
        user_id: Associated user ID
        details: Additional event details (non-sensitive)
        severity: Log level (INFO, WARNING, ERROR, CRITICAL)
    
    Example:
        log_security_event('LOGIN', user_id=123, details='Successful login')
        log_security_event('FAILED_AUTH', details=f'Failed login attempt for email: {email}', severity='WARNING')
    """
    timestamp = datetime.utcnow().isoformat()
    
    # Build audit log message (never include passwords, tokens, or sensitive data)
    audit_msg = f"SECURITY_EVENT | {event_type} | user_id: {user_id} | {details} | ip: {get_client_ip()}"
    
    logger = current_app.logger if current_app else logging.getLogger(__name__)
    
    log_method = getattr(logger, severity.lower(), logger.info)
    log_method(audit_msg)


def get_client_ip():
    """Get client IP address, accounting for proxies."""
    if request:
        # Check for IP behind proxy
        if request.headers.get('X-Forwarded-For'):
            return request.headers.get('X-Forwarded-For').split(',')[0].strip()
        return request.remote_addr or 'unknown'
    return 'unknown'


def is_password_strong(password):
    """
    Check if password meets minimum strength requirements.
    Does NOT raise exception, just returns boolean.
    
    Requirements:
    - Minimum 12 characters
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    """
    if not password or len(password) < 12:
        return False
    
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    has_special = any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password)
    
    return has_upper and has_lower and has_digit and has_special


def get_password_strength_feedback(password):
    """
    Get detailed feedback on password strength.
    
    Returns:
        dict: {
            'score': 0-100,
            'valid': bool,
            'missing': [list of missing conditions],
            'feedback': "human readable feedback"
        }
    """
    feedback = {
        'score': 0,
        'valid': True,
        'missing': [],
        'feedback': 'Password is strong'
    }
    
    if not password:
        feedback['valid'] = False
        feedback['feedback'] = 'Password is required'
        return feedback
    
    # Length check
    length = len(password)
    if length < 8:
        feedback['missing'].append('At least 8 characters')
        feedback['score'] = 0
    elif length < 12:
        feedback['missing'].append('16+ characters recommended for production')
        feedback['score'] += 25
    else:
        feedback['score'] += 25
    
    # Uppercase check
    if not any(c.isupper() for c in password):
        feedback['missing'].append('At least one uppercase letter (A-Z)')
        feedback['score'] = max(0, feedback['score'] - 25)
    else:
        feedback['score'] += 25
    
    # Lowercase check
    if not any(c.islower() for c in password):
        feedback['missing'].append('At least one lowercase letter (a-z)')
        feedback['score'] = max(0, feedback['score'] - 25)
    else:
        feedback['score'] += 25
    
    # Digit check
    if not any(c.isdigit() for c in password):
        feedback['missing'].append('At least one number (0-9)')
        feedback['score'] = max(0, feedback['score'] - 25)
    else:
        feedback['score'] += 25
    
    # Special character check
    if not any(c in '!@#$%^&*()_+-=[]{}|;:,.<>?' for c in password):
        feedback['missing'].append('At least one special character (!@#$%^&*()_+-=[]{}|;:,.<>?)')
        feedback['score'] = max(0, feedback['score'] - 25)
    else:
        feedback['score'] += 25
    
    feedback['valid'] = len(feedback['missing']) == 0
    
    if feedback['missing']:
        feedback['feedback'] = 'Password is weak. Missing: ' + ', '.join(feedback['missing'][:2])
    elif length < 12:
        feedback['feedback'] = 'Password is acceptable but consider 12+ characters for production'
    
    return feedback


def require_https(f):
    """
    Decorator to enforce HTTPS for a route.
    Raises 403 if request is not HTTPS in production.
    Skipped in development.
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if current_app.config.get('FLASK_ENV') == 'production':
            if request.scheme != 'https':
                log_security_event('INSECURE_REQUEST', details='Attempted HTTP access to HTTPS-only endpoint', severity='WARNING')
                return {'error': 'HTTPS required'}, 403
        return f(*args, **kwargs)
    return decorated_function


def sanitize_sql_safe(value):
    """
    Basic sanitization for logging purposes only.
    NEVER use this for SQL injection prevention - use SQLAlchemy ORM instead.
    Only removes newlines and truncates for safe logging.
    """
    if not isinstance(value, str):
        return str(value)[:100]
    return value.replace('\n', ' ').replace('\r', ' ')[:100]


def check_session_validity():
    """
    Check if current session is valid.
    Returns: (is_valid, reason)
    """
    if 'user_id' not in session or 'last_activity' not in session:
        return False, 'No session'
    
    # Add your session timeout checks here
    return True, 'Valid'


class SecurityConfig:
    """Security configuration constants"""
    
    # Password requirements
    MIN_PASSWORD_LENGTH = 12
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_DIGITS = True
    REQUIRE_SPECIAL_CHARS = True
    
    # Password policy
    PASSWORD_EXPIRY_DAYS = 90  # Require change every 90 days
    PASSWORD_HISTORY_COUNT = 5  # Prevent reuse of last 5 passwords
    
    # Session security
    SESSION_TIMEOUT_MINUTES = 1440  # 24 hours
    MAX_CONCURRENT_SESSIONS = 5  # Max sessions per user
    
    # Rate limiting (requests per minute)
    LOGIN_RATE_LIMIT = 5
    API_RATE_LIMIT = 100
    PASSWORD_RESET_RATE_LIMIT = 3
    
    # Audit logging
    AUDIT_LOG_RETENTION_DAYS = 365
    LOG_SENSITIVE_OPERATIONS = True
    
    # IP whitelist/blacklist
    ENABLE_IP_BASED_SECURITY = False
    # WHITELIST_IPS = ['10.0.0.0/8']
    # BLACKLIST_IPS = []


def validate_data_ownership(user_id, resource_user_id):
    """
    Verify user has permission to access resource.
    Prevents privilege escalation/lateral movement.
    """
    if user_id != resource_user_id:
        log_security_event(
            'UNAUTHORIZED_ACCESS',
            user_id=user_id,
            details=f'Attempted access to resource owned by user {resource_user_id}',
            severity='WARNING'
        )
        return False
    return True


def mask_sensitive_data(value, mask_type='email'):
    """
    Mask sensitive data for display/logging.
    
    Args:
        value: The value to mask
        mask_type: 'email', 'phone', 'credit_card', etc.
    
    Returns:
        Masked version of the value
    """
    if mask_type == 'email' and '@' in value:
        parts = value.split('@')
        return f"{parts[0][:2]}***@{parts[1]}"
    elif mask_type == 'phone' and len(value) >= 4:
        return f"***-***-{value[-4:]}"
    elif mask_type == 'credit_card' and len(value) >= 4:
        return f"****-****-****-{value[-4:]}"
    else:
        return '***' + str(value)[-2:] if len(str(value)) > 2 else '***'


# Security event types for audit logging
SECURITY_EVENTS = {
    'LOGIN': 'User successfully logged in',
    'LOGOUT': 'User logged out',
    'FAILED_LOGIN': 'Failed login attempt',
    'PASSWORD_CHANGE': 'User changed password',
    'PASSWORD_RESET': 'Password reset initiated',
    'ACCOUNT_CREATED': 'New user account created',
    'ACCOUNT_DISABLED': 'User account disabled',
    'ROLE_CHANGED': 'User role changed',
    'PERMISSION_DENIED': 'Access denied to resource',
    'UNAUTHORIZED_ACCESS': 'Attempted unauthorized access',
    'SUSPICIOUS_ACTIVITY': 'Suspicious activity detected',
    'API_KEY_GENERATED': 'API key generated',
    'API_KEY_REVOKED': 'API key revoked',
    'CONFIG_CHANGED': 'Configuration changed',
    'BACKUP_CREATED': 'Backup created',
    'BACKUP_RESTORED': 'Backup restored',
    'SECURITY_SCAN': 'Security scan completed',
}
