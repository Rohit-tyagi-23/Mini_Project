# Security Implementation Guide

## Overview

This guide documents the security enhancements implemented to protect Restaurant AI in production.

## Critical Security Reminders - Implementation Status

### ✅ 1. Never Commit `.env` to Git

**Status**: Implemented

**What was done**:
- Enhanced `.gitignore` with comprehensive secret protection patterns
- Added explicit patterns for all sensitive files:
  - `.env`, `.env.local`, `.env.*.local`, `.env.production`, `.env.staging`
  - `*.key`, `*.pem` (private keys and certificates)
  - `config/secrets/`, `private_keys/`, `secrets/`
  - `cookie.txt`, `session*` files
  - API keys, tokens, and credentials

**How to verify**:
```bash
# Ensure no .env files are tracked
git status --ignored | grep env

# Check git history for accidental env commits
git log --all --full-history -- ".env*"

# Prevent future commits
git rm --cached .env 2>/dev/null || true
```

---

### ✅ 2. Use Strong Passwords

**Status**: Implemented

**What was done**:
- Added `User.validate_password_strength()` method in `models.py`
- Enforces minimum 12 characters (production-ready requirement)
- Requires: uppercase, lowercase, digit, special character
- Applied to `User.set_password()` method (validates before hashing)

**Password Requirements**:
```
- Minimum 12 characters
- At least 1 uppercase letter (A-Z)
- At least 1 lowercase letter (a-z)
- At least 1 digit (0-9)
- At least 1 special character (!@#$%^&*()_+-=[]{}|;:,.<>?)

Example strong password:
  ✓ MyRestaurant2024#Secure
  ✓ Inventory@Manager#2026
  ✗ password123 (no uppercase, no special char)
  ✗ MyPassword (no number, no special char)
```

**How to use**:
```python
from models import User, PasswordValidationError

try:
    user.set_password('MyPassword123!')  # Will fail - too weak
except PasswordValidationError as e:
    print(f"Password error: {e}")

# Correct usage
user.set_password('MyRestaurant2024#Secure')  # Will succeed
```

**Helper function for feedback**:
```python
from app.security import get_password_strength_feedback

feedback = get_password_strength_feedback('weak')
print(feedback['valid'])    # False
print(feedback['score'])    # Low score
print(feedback['missing'])  # List of missing requirements
print(feedback['feedback']) # Human-readable message
```

**For user registration**:
```python
from app.security import get_password_strength_feedback

# In signup form validation
feedback = get_password_strength_feedback(user_password)
if not feedback['valid']:
    return {'error': feedback['feedback']}, 400

# Create user with validated password
user = User(email=email)
user.set_password(user_password)  # Raises PasswordValidationError if invalid
db.session.add(user)
db.session.commit()
```

---

### ✅ 3. Update SECRET_KEY Immediately

**Status**: Implemented with validation

**What was done**:
- Added SECRET_KEY validation in `app/config.py`
- Raises error if not set in production (fail-fast)
- Added startup validation in `app/__init__.py`
- Checks minimum length (32+ characters, recommends 64+)

**How to generate SECRET_KEY**:
```bash
# Method 1: Python
python -c "import secrets; print(secrets.token_hex(32))"
# Output: 3a8f9d2e4c1b6a7f9e2d4c8a1b3f5d7e9a2c4e6f8b0d2a4c6e8a0c2e4f6a8

# Method 2: OpenSSL
openssl rand -hex 32
# Output: e8f3a5b7c2d9e1f4a6b8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8c0d2e4f6a8

# Method 3: Linux dd
dd if=/dev/urandom bs=1 count=32 2>/dev/null | xxd -p
```

**How to set in production**:
```bash
# Environment variable
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Docker
docker run -e SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") ...

# Kubernetes
kubectl create secret generic app-secret --from-literal=SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# .env file (production only, never commit)
SECRET_KEY=3a8f9d2e4c1b6a7f9e2d4c8a1b3f5d7e9a2c4e6f8b0d2a4c6e8a0c2e4f6a8
```

**Startup validation**:
The application will automatically validate on startup:
```
PRODUCTION SECURITY VALIDATION
============================================================
✓ SECRET_KEY is properly configured (32+ characters)
✓ PostgreSQL database configured
✓ Redis cache configured
✓ Email configured
✓ DEBUG mode disabled
✓ HTTPS cookies enforced
============================================================
```

---

### ✅ 4. Use Environment Secret Management

**Status**: Documented and validated

**What was done**:
- Created `.env.production` template with inline security notes
- Security validation checks all critical env variables
- Application fails fast if critical secrets missing
- Logging never outputs secrets

**Production Secret Management Options**:

#### AWS Secrets Manager
```bash
# Store secret
aws secretsmanager create-secret \
  --name restaurant-ai/prod \
  --secret-string='{"SECRET_KEY":"...","DATABASE_PASSWORD":"..."}'

# Retrieve in application
import boto3
client = boto3.client('secretsmanager')
secret = client.get_secret_value(SecretId='restaurant-ai/prod')
```

#### Kubernetes Secrets
```bash
# Create secret
kubectl create secret generic restaurant-ai-secrets \
  --from-literal=SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") \
  --from-literal=DATABASE_PASSWORD=strong_password

# Use in deployment
env:
  - name: SECRET_KEY
    valueFrom:
      secretKeyRef:
        name: restaurant-ai-secrets
        key: SECRET_KEY
```

#### Docker Secrets
```bash
# Create secret
echo "$(python -c 'import secrets; print(secrets.token_hex(32))')" | \
  docker secret create restaurant_secret_key -

# Use in compose
secrets:
  db_password:
    file: ./secrets/db_password.txt

services:
  app:
    secrets:
      - db_password
```

#### HashiCorp Vault
```python
# Python application code
import hvac

client = hvac.Client(url='https://vault.example.com')
response = client.secrets.kv.read_secret_version(path='restaurant-ai/prod')
secrets = response['data']['data']
```

#### Environment Variables (Simple)
```bash
# Set via environment
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")
export DATABASE_PASSWORD=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# Or in systemd service
[Service]
EnvironmentFile=/etc/restaurant-ai/secrets.env
```

---

### ✅ 5. Rotate Secrets Periodically

**Status**: Implemented with tracking

**What was done**:
- Added `last_password_change` field to User model
- Security utilities for password expiry tracking
- Configuration constants for rotation policy

**Password Rotation Policy**:
```python
from app.security import SecurityConfig

# Settings in SecurityConfig
PASSWORD_EXPIRY_DAYS = 90  # Require change every 90 days
PASSWORD_HISTORY_COUNT = 5  # Prevent reuse of last 5 passwords
```

**How to implement password expiry**:
```python
from datetime import datetime, timedelta
from models import User

def check_password_expiry(user):
    """Check if user needs to change password"""
    if not user.last_password_change:
        return True  # Never set password, force change
    
    days_since_change = (datetime.utcnow() - user.last_password_change).days
    expiry_days = 90  # From SecurityConfig.PASSWORD_EXPIRY_DAYS
    
    if days_since_change > expiry_days:
        return True  # Force password change
    
    return False

# In your login flow
if check_password_expiry(user):
    return redirect(url_for('auth.change_password', 
                           redirect_to=request.referrer))
```

**Database credential rotation**:
```bash
# 1. Generate new database password
NEW_PASSWORD=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# 2. Update database user in PostgreSQL
psql -U postgres << EOF
ALTER USER restaurant_user WITH PASSWORD '$NEW_PASSWORD';
EOF

# 3. Update application configuration
export DATABASE_URL="postgresql://restaurant_user:$NEW_PASSWORD@host/db"

# 4. Test connection
psql $DATABASE_URL -c "SELECT 1;"

# 5. Restart application
docker-compose restart app
```

**API Key rotation**:
```python
# Generate new API key
import secrets
new_api_key = secrets.token_urlsafe(32)

# Hash and store in database
from werkzeug.security import generate_password_hash, check_password_hash
api_key_hash = generate_password_hash(new_api_key)

# Client uses API key in requests
curl -H "Authorization: Bearer $API_KEY" https://api.example.com/data
```

---

## Security Features - How to Use

### 1. Audit Logging

Log security events for compliance and forensics:

```python
from app.security import log_security_event

# Successful login
log_security_event('LOGIN', user_id=user.id, details='Successful login')

# Failed authentication
log_security_event('FAILED_LOGIN', details=f'Failed attempt for email: {email}', severity='WARNING')

# Password change
log_security_event('PASSWORD_CHANGE', user_id=user.id, details='User changed password')

# Unauthorized access attempt
log_security_event('UNAUTHORIZED_ACCESS', user_id=user.id, 
                  details=f'Attempted access to user {target_user_id} resources',
                  severity='WARNING')
```

### 2. Password Strength Checking

Provide real-time feedback during password entry:

```python
from app.security import get_password_strength_feedback

# Frontend validation (before submission)
feedback = get_password_strength_feedback(user_input)

print(feedback)
# Output:
# {
#   'score': 75,
#   'valid': False,
#   'missing': ['At least one special character'],
#   'feedback': 'Password is weak. Missing: At least one special character'
# }
```

### 3. Data Ownership Validation

Prevent unauthorized access:

```python
from app.security import validate_data_ownership

@app.route('/api/user/<int:user_id>/data')
def get_user_data(user_id):
    current_user_id = session.get('user_id')
    
    # Validate user can only access their own data
    if not validate_data_ownership(current_user_id, user_id):
        return {'error': 'Forbidden'}, 403
    
    # Safe to proceed
    return {'data': user_data}
```

### 4. Sensitive Data Masking

Protect sensitive data in logs:

```python
from app.security import mask_sensitive_data

email = "admin@example.com"
masked = mask_sensitive_data(email, 'email')
print(masked)  # Output: ad***@example.com

phone = "555-123-4567"
masked = mask_sensitive_data(phone, 'phone')
print(masked)  # Output: ***-***-4567

# For logging
logger.info(f"Email updated: {mask_sensitive_data(email, 'email')}")
```

### 5. HTTPS Enforcement

Decorator to enforce HTTPS:

```python
from app.security import require_https
from flask import request

@app.route('/sensitive-data')
@require_https
def sensitive_endpoint():
    # This endpoint will return 403 if accessed via HTTP in production
    return {'data': 'sensitive'}
```

---

## Startup Security Validation

When the application starts in production mode, it automatically validates:

```
PRODUCTION SECURITY VALIDATION
============================================================
✓ SECRET_KEY is properly configured (32+ characters)
✓ PostgreSQL database configured
✓ Redis cache configured
✓ Email configured: admin@example.com
✓ DEBUG mode disabled
✓ HTTPS cookies enforced
============================================================
Security validation complete
============================================================
```

**If any checks fail**:
```
❌ CRITICAL: SQLite database configured for production!
   Configure PostgreSQL instead:
   export DATABASE_URL="postgresql://user:password@host:5432/database"
   Raises: ValueError - Application will not start!
```

---

## Security Checklist for Deployment

Before deploying to production:

- [ ] Generated strong SECRET_KEY (32+ hex characters)
- [ ] Configured PostgreSQL database (not SQLite)
- [ ] Set up Redis for caching and rate limiting
- [ ] Configured SMTP for email notifications
- [ ] Set FLASK_ENV=production
- [ ] Disabled DEBUG mode
- [ ] Ensured .env file is in .gitignore
- [ ] Never committed any .env files
- [ ] Verified `.env` file not in git history: `git log --all --full-history -- ".env*"`
- [ ] Tested startup validation: See success output above
- [ ] Configured secure secret management (AWS, K8s, Vault, etc.)
- [ ] Set password rotation policy
- [ ] Enabled audit logging
- [ ] Tested password strength validation
- [ ] Verified HTTPS enforcement
- [ ] Set up monitoring/alerting for security events

---

## Common Issues & Solutions

### Issue: `ValueError: CRITICAL: SECRET_KEY must be set to a strong random value in production!`

**Solution**:
```bash
# Generate and set SECRET_KEY
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# Verify it's set
echo $SECRET_KEY

# Start application
docker-compose up -d
```

### Issue: `ValueError: CRITICAL: SQLite cannot be used in production. Use PostgreSQL!`

**Solution**:
```bash
# Update .env or environment
export DATABASE_URL="postgresql://restaurant_user:password@localhost:5432/restaurant_ai"

# Verify PostgreSQL is running
psql $DATABASE_URL -c "SELECT 1;"
```

### Issue: User gets `PasswordValidationError` during signup

**Solution**: Show password requirements to user:
```python
from models import PasswordValidationError
from app.security import get_password_strength_feedback

try:
    user.set_password(user_password)
except PasswordValidationError as e:
    feedback = get_password_strength_feedback(user_password)
    return {
        'error': str(e),
        'suggestion': feedback['feedback'],
        'requirements': feedback['missing']
    }, 400
```

---

## References

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Password Guidelines](https://pages.nist.gov/800-63-3/sp800-63b.html)
- [Flask Security Best Practices](https://flask.palletsprojects.com/en/latest/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)

---

**Last Updated**: March 2026  
**Status**: Fully Implemented ✅
