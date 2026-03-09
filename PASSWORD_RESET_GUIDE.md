# Password Reset Feature Implementation Guide

## Overview

The Restaurant Inventory AI application now has a secure password reset feature that allows users to reset their forgotten passwords via secure email links. The feature uses cryptographically secure tokens that expire after 24 hours.

## Features

✅ **Security Features**:
- Cryptographically secure token generation using `secrets.token_urlsafe()`
- 24-hour token expiration
- Database-backed token storage (not volatile)
- SQL injection protection via SQLAlchemy ORM
- Password strength validation (12+ chars, uppercase, lowercase, digit, special char)
- Security event logging for audit trails
- No email information leakage (same message for existing and non-existing emails)

✅ **User Experience**:
- Simple 2-step flow (email → reset password)
- Secure reset link sent via email
- Password strength indicator with live feedback
- Clear password requirements display
- Automatic redirect to login after successful reset

## Architecture

### Database Schema

Two new fields added to the `User` model:

```python
class User(db.Model):
    # ... existing fields ...
    reset_token = db.Column(db.String(255), unique=True, index=True)
    reset_token_expiry = db.Column(db.DateTime)
```

### API Endpoints

#### 1. Request Password Reset
```
POST /api/auth/request-password-reset
Content-Type: application/json

{
  "email": "user@example.com"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Password reset link sent to your email"
}
```

**Response (User not found - security)**:
```json
{
  "success": true,
  "message": "If an account exists with this email, a password reset link will be sent"
}
```

#### 2. Display Password Reset Form
```
GET /reset-password?token=<secure_token>
```

This route:
- Validates the token exists and hasn't expired
- Displays the password reset form with the token embedded
- Redirects to password recovery page if token is invalid/expired

#### 3. Reset Password with Token
```
POST /api/auth/reset-password-with-token
Content-Type: application/json

{
  "token": "<secure_token>",
  "new_password": "NewPassword123!@#"
}
```

**Response (Success)**:
```json
{
  "success": true,
  "message": "Password reset successfully. You can now log in."
}
```

### Helper Functions

#### Token Management
```python
def generate_recovery_token(email):
    """Generate 32-byte URL-safe token using secrets module"""
    
def store_recovery_token(email, token):
    """Store token in database with 24-hour expiry"""
    
def verify_recovery_token(email, token):
    """Verify token hasn't expired"""
    
def clear_recovery_token(user):
    """Clear token after successful password reset"""
```

### Templates

#### password_recovery.html
- Simple email input form
- Shows success message after email is sent
- Explains how the reset link works
- Allows resending email if not received

#### reset_password.html
- Password reset form with token (hidden)
- Live password strength indicator
- Shows password requirements with checkmarks
- Success message and redirect to login

### JavaScript

#### password-recovery.js
- Validates email format
- Shows loading state during submission
- Displays success/error messages
- Allows resending email

#### reset_password.js
- Real-time password strength checking
- Validates all password requirements
- Checks password confirmation matches
- Submits to backend with token
- Shows success and redirects to login

## Setup Requirements

### 1. Environment Variables

Add these to your `.env` file or Docker environment:

```bash
# Required for password reset links
APP_DOMAIN=https://your-domain.com
# or for localhost:
APP_DOMAIN=http://localhost:5000

# Gmail configuration (for sending emails)
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=true
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password

# For other email providers:
# SendGrid
MAIL_SERVER=smtp.sendgrid.net
MAIL_PORT=587
MAIL_USERNAME=apikey
MAIL_PASSWORD=SG.your-sendgrid-api-key

# AWS SES
MAIL_SERVER=email-smtp.region.amazonaws.com
MAIL_PORT=587
MAIL_USERNAME=your-ses-username
MAIL_PASSWORD=your-ses-password
```

### 2. Database Migration

The User model now has two new fields. Apply the migration:

```bash
# If using Flask-Migrate
flask db upgrade

# Or create manually if using raw SQL:
ALTER TABLE users ADD COLUMN reset_token VARCHAR(255) UNIQUE;
ALTER TABLE users ADD COLUMN reset_token_expiry DATETIME;
CREATE INDEX ix_users_reset_token ON users(reset_token);
```

### 3. Email Configuration

The application uses Flask-Mail. Configuration is in `app/config.py`:

```python
MAIL_SERVER = os.getenv('MAIL_SERVER', 'smtp.gmail.com')
MAIL_PORT = int(os.getenv('MAIL_PORT', 587))
MAIL_USE_TLS = os.getenv('MAIL_USE_TLS', 'true').lower() == 'true'
MAIL_USERNAME = os.getenv('MAIL_USERNAME')
MAIL_PASSWORD = os.getenv('MAIL_PASSWORD')
MAIL_DEFAULT_SENDER = os.getenv('MAIL_DEFAULT_SENDER', 'noreply@restaurantinventoryai.com')
```

## User Guide

### For Users

#### To Reset Password:

1. **Go to Login Page**
   - Click on "Forgot Password?" or go to `/password-recovery`

2. **Enter Email Address**
   - Enter the email associated with your account
   - Click "Send Recovery Link"

3. **Check Email**
   - Look for email from "Restaurant Inventory AI"
   - Click the "Reset Your Password" button or copy the link

4. **Set New Password**
   - Enter your new password (min 12 characters)
   - Password must contain: uppercase, lowercase, number, special character
   - Confirm the password
   - Click "Reset Password"

5. **Log In**
   - You'll see a success message
   - Automatically redirected to login page
   - Log in with your new password

### For Administrators

#### Monitor Password Resets:

Check security events logged:
```python
# Security events are logged with:
# Event type: PASSWORD_RESET_REQUESTED, PASSWORD_RESET_COMPLETED
# User ID, IP address, timestamp
# Location: app/logs/ or check with logging infrastructure
```

#### Emergency - Clear Reset Tokens:

If a user's reset token is compromised:
```python
# SQL command
UPDATE users SET reset_token = NULL, reset_token_expiry = NULL 
WHERE email = 'user@example.com';
```

## Security Considerations

### Token Security
- **Generation**: Uses `secrets.token_urlsafe(32)` (cryptographically secure)
- **Storage**: Database (indexed for fast lookup)
- **Transport**: Sent via HTTPS only (use HTTPS in production)
- **Validation**: Verified against stored token and expiration

### Password Security
- **Requirements**: 
  - Minimum 12 characters (enforced)
  - At least 1 uppercase letter
  - At least 1 lowercase letter
  - At least 1 digit
  - At least 1 special character (!@#$%^&*)
- **Hashing**: PBKDF2 with SHA256, automatically updated on reset
- **Validation**: Server-side validation on both sides

### Email Security
- **No Information Leakage**: Same response for existing and non-existing emails
- **Rate Limiting**: Can add rate limiting (currently disabled in code)
- **Expiration**: 24-hour token expiration
- **One-Time Use**: Token cleared after successful password change

### HTTPS Requirement
- **Production**: HTTPS must be enabled
- **Links**: Reset links include full domain (APP_DOMAIN environment variable)
- **Cookies**: Session cookies should be HTTP-only and Secure

## Testing

### Manual Testing

1. **Test Email Sending**:
   ```bash
   # In Flask shell
   flask shell
   from flask_mail import Message, Mail
   from app import create_app
   app = create_app('production')
   mail = Mail(app)
   msg = Message('Test', recipients=['your-email@example.com'], 
                 body='Test email')
   mail.send(msg)
   ```

2. **Test Token Generation**:
   ```python
   import secrets
   token = secrets.token_urlsafe(32)
   print(f"Token: {token}")  # Example: "abc123_XyZ..."
   ```

3. **Test Full Flow**:
   - Go to `/password-recovery`
   - Enter a user's email
   - Check email for reset link
   - Click link and verify it goes to `/reset-password?token=...`
   - Reset password and verify login works

### Automated Testing

Tests are in `tests.py`. Key test cases:

```python
def test_password_reset_request():
    """Test requesting password reset"""
    # Sends email and stores token

def test_password_reset_with_token():
    """Test resetting password with valid token"""
    # Creates user, requests reset, verifies token, resets password

def test_password_reset_invalid_token():
    """Test resetting with invalid/expired token"""
    # Verifies security of token validation

def test_password_reset_token_expiry():
    """Test token expiration after 24 hours"""
    # Verifies token expires correctly
```

## Troubleshooting

### Email Not Being Sent

**Problem**: User submits email but doesn't receive reset link

**Solutions**:
1. Check MAIL_SERVER configuration
2. Verify MAIL_USERNAME and MAIL_PASSWORD are correct
3. Check email spam/junk folder
4. For Gmail: Enable "Less secure app access" or use app-specific password
5. Check application logs for SMTP errors:
   ```bash
   tail -f app/logs/app.log
   ```

### Token Expired Errors

**Problem**: User clicks reset link and gets "token expired" message

**Solution**:
- Links expire after 24 hours by design
- User must request a new reset link
- For development, change expiration in `app.py`:
  ```python
  # In store_recovery_token function
  user.reset_token_expiry = datetime.utcnow() + timedelta(hours=1)  # 1 hour
  ```

### Password Doesn't Meet Requirements

**Problem**: User tries to set password that doesn't meet requirements

**Solutions**:
- Check password requirements on form
- Ensure password has ALL of: uppercase, lowercase, digit, special char
- Minimum 12 characters required
- Valid special characters: !@#$%^&*()_+-=[]{}|;:,.<>?

### Can't Reset Because User Not Found

**Problem**: Email not registered in system

**Solution**:
- User must sign up first before resetting password
- Check email spelling
- For security, system shows same message for existing/non-existing emails

## Database Migration Example

If using raw SQL without migrations:

```sql
-- Add columns if they don't exist
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token VARCHAR(255);
ALTER TABLE users ADD COLUMN IF NOT EXISTS reset_token_expiry DATETIME;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS ix_users_reset_token ON users(reset_token);

-- Clean up old tokens (run periodically)
UPDATE users SET reset_token = NULL, reset_token_expiry = NULL 
WHERE reset_token_expiry < NOW() AND reset_token_expiry IS NOT NULL;
```

## Production Deployment Checklist

- [ ] APP_DOMAIN set to your domain (HTTPS)
- [ ] MAIL_SERVER, MAIL_USERNAME, MAIL_PASSWORD configured
- [ ] MAIL_PORT and MAIL_USE_TLS set correctly
- [ ] Database migration applied (reset_token fields)
- [ ] HTTPS enabled at application level
- [ ] Security headers configured (HSTS, etc.)
- [ ] Rate limiting enabled on password reset endpoints
- [ ] Logs configured to capture security events
- [ ] Email sending tested with real account
- [ ] Full password reset flow tested end-to-end

## Related Documentation

- [Security Implementation Guide](SECURITY_IMPLEMENTATION.md) - Password validation, security events
- [Production Environment Setup](PRODUCTION_ENV_SETUP.md) - Email configuration
- [API Documentation](docs/API_DOCUMENTATION.md) - Full API reference
- [Installation Guide](docs/INSTALLATION_GUIDE.md) - Setup instructions
