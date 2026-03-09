# Production Environment Setup Guide

## Quick Setup Checklist

Follow this guide to properly set up a secure production environment.

## Step 1: Generate Critical Secrets

### Generate SECRET_KEY (Required)

```bash
# Generate a strong 64-character random key
python -c "import secrets; print(secrets.token_hex(32))"

# Example output:
# 7f8a2b3e9c1d5a6f8e2b4c7a9f1d3e5b7a9c2d4e6f8a0b1c3d5e7f9a1b2c3d

# Save this value - you'll need it in the next step
```

### Generate Database Password

```bash
# Generate a strong database password
python -c "import secrets; print(secrets.token_urlsafe(32))"

# Example output:
# h_2KxL9mN3pQ6rS9uV2wX5yZ8aB1cD4eF7gH0jK3lM6nO9pQ2rS5tU8vW1xY4z

# Save this value
```

### Generate Redis Password (Optional but Recommended)

```bash
python -c "import secrets; print(secrets.token_urlsafe(32))"
```

## Step 2: Create Environment File

```bash
# Copy template to production environment file
cp .env.production .env

# DO NOT commit .env to git!
# Verify it's in .gitignore
grep "^.env$" .gitignore
```

## Step 3: Edit .env File with Real Values

Edit `.env` file and replace all placeholder values:

```bash
# Your text editor
nano .env
# or
vim .env
# or
code .env
```

### Critical Values to Update

**FLASK_ENV** (MUST BE SET)
```
FLASK_ENV=production
```

**SECRET_KEY** (MUST BE SET - Use generated value from Step 1)
```
SECRET_KEY=<paste-your-generated-secret-key-here>
```

**DATABASE Configuration**
```
# PostgreSQL connection string
DATABASE_URL=postgresql://restaurant_user:your_strong_password_here@db.example.com:5432/restaurant_ai

# Individual credentials (for Docker Compose)
DB_USER=restaurant_user
DB_PASSWORD=<paste-your-generated-db-password-here>
DB_NAME=restaurant_ai
DB_HOST=postgres  # or your database server hostname
DB_PORT=5432
```

**REDIS Configuration**
```
REDIS_URL=redis://your_redis_host:6379/0
# If Redis has password:
# REDIS_URL=redis://:password@redis-host:6379/0
```

**Email Configuration** (For Notifications)
```
# Gmail example
MAIL_SERVER=smtp.gmail.com
MAIL_PORT=587
MAIL_USE_TLS=True
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password  # Get from myaccount.google.com/apppasswords

# SendGrid example
# MAIL_SERVER=smtp.sendgrid.net
# MAIL_USERNAME=apikey
# MAIL_PASSWORD=SG.your_sendgrid_api_key

MAIL_DEFAULT_SENDER=noreply@restaurantai.com
```

**Twilio SMS** (Optional)
```
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TWILIO_PHONE_NUMBER=+1234567890
```

**Gunicorn Configuration**
```
GUNICORN_WORKERS=9  # For 4-core CPU: (4 * 2) + 1 = 9
LOG_LEVEL=info      # info, debug, warning, error
```

## Step 4: Verify Environment File

```bash
# Check that .env exists and contains values (not just placeholders)
cat .env | grep -E "^[A-Z_]+" | head -20

# Verify critical values are set
grep "^SECRET_KEY=" .env | grep -v "CHANGE_THIS"
grep "^FLASK_ENV=production" .env
grep "^DATABASE_URL=postgresql://" .env
```

## Step 5: Secure the Environment File

```bash
# Restrict file permissions (readable by owner only)
chmod 600 .env

# Verify permissions
ls -la .env
# Should show: -rw------- (or similar)

# Double-check it's not in git
git status .env
# Should show: .env is not in index (or similar)

# If .env was accidentally added, remove it:
git rm --cached .env
```

## Step 6: Test Database Connection

```bash
# Before starting containers, verify database is accessible

# Test PostgreSQL connection
psql -h <DB_HOST> -U <DB_USER> -d <DB_NAME> -c "SELECT 1;"

# Expected output: 
#  ?column? 
# ----------
#         1

# If connection fails:
# - Verify DATABASE_URL is correct
# - Check database server is running and accessible
# - Verify network connectivity (firewall rules)
# - Check database user exists and password is correct
```

## Step 7: Test Redis Connection

```bash
# Test Redis connection
redis-cli -h <REDIS_HOST> -p 6379 ping

# Expected output:
# PONG

# If connection fails:
# - Verify REDIS_URL is correct
# - Check Redis server is running
# - Check firewall allows connection
```

## Step 8: Start Services

### Option 1: Docker Compose (Recommended)

```bash
# Start all services (PostgreSQL, Redis, App, Nginx)
docker-compose up -d

# Check status
docker-compose ps

# Expected output:
# NAME                   STATUS          PORTS
# restaurant_ai_db       Up (healthy)    5432/tcp
# restaurant_ai_cache    Up (healthy)    6379/tcp
# restaurant_ai_app      Up (healthy)    5000/tcp
# restaurant_ai_nginx    Up              0.0.0.0:80->80, 0.0.0.0:443->443
```

### Option 2: Kubernetes

```bash
# Create namespace
kubectl create namespace restaurant-ai

# Create secrets
kubectl create secret generic restaurant-ai-secrets \
  --from-literal=SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") \
  --from-literal=DATABASE_URL="postgresql://user:pass@postgres:5432/db" \
  -n restaurant-ai

# Deploy
kubectl apply -f k8s-deployment.yaml -n restaurant-ai

# Check status
kubectl get deployment -n restaurant-ai
```

### Option 3: Manual Server

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Start with Gunicorn
gunicorn --config gunicorn.conf.py wsgi:app
```

## Step 9: Verify Security Validation

When application starts, it will show security validation:

```
============================================================
PRODUCTION SECURITY VALIDATION
============================================================
✓ SECRET_KEY is properly configured (32+ characters)
✓ PostgreSQL database configured
✓ Redis cache configured
✓ Email configured: your-email@gmail.com
✓ DEBUG mode disabled
✓ HTTPS cookies enforced
============================================================
Security validation complete
============================================================
```

**If you see warnings or errors**:
- Check logs: `docker-compose logs app`
- Fix the issue and restart: `docker-compose restart app`
- See SECURITY_IMPLEMENTATION.md for detailed troubleshooting

## Step 10: Post-Startup Health Checks

```bash
# Basic health check
curl http://localhost/health

# Expected response:
# {"status": "healthy", "service": "restaurant-ai", "timestamp": 1234567890.123}

# Readiness check
curl http://localhost/health/ready

# Expected response:
# {"status": "ready", "database": true, "overall": true}
```

## Step 11: Test Core Features

```bash
# Test database connectivity
curl http://localhost/health/ready | grep -o '"database": true'

# Test email configuration (if configured)
# Send a test email through the application

# Test API endpoints
curl http://localhost/api/v1/health
```

## Critical Security Reminders

### Never Do This ❌
```bash
# ❌ Don't commit .env to git
git add .env
git commit -m "Add env file"

# ❌ Don't use default passwords
DATABASE_PASSWORD=password123
SECRET_KEY=mysecretkey

# ❌ Don't share secrets in chat/email/Slack
"Here's the SECRET_KEY: 3f8a2b..."

# ❌ Don't hardcode credentials in code
app.config['DATABASE_URL'] = 'postgresql://user:password@localhost/db'

# ❌ Don't run containers as root
user: root  # In docker-compose.yml

# ❌ Don't use DEBUG=True in production
FLASK_ENV=development  # Should be 'production'

# ❌ Don't expose secrets in logs
logger.info(f"Database: {DATABASE_URL}")  # Would log password!
```

### Always Do This ✓
```bash
# ✓ Use environment variables
export SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))")

# ✓ Use strong passwords (12+ chars, mixed case, numbers, special chars)
DB_PASSWORD=$(python -c "import secrets; print(secrets.token_urlsafe(32))")

# ✓ Keep .env in .gitignore
grep ".env" .gitignore

# ✓ Use secret management services
# AWS Secrets Manager, Kubernetes Secrets, HashiCorp Vault, etc.

# ✓ Rotate secrets periodically
# Change database password every 90 days
# Rotate API keys

# ✓ Verify startup validation passes
docker-compose logs app | grep "Security validation complete"

# ✓ Monitor security logs
docker-compose logs app | grep SECURITY_EVENT

# ✓ Test from multiple angles
curl http://localhost/health
curl http://localhost/health/ready
psql $DATABASE_URL -c "SELECT 1;"
redis-cli ping
```

## Rotating Secrets (Important!)

Secrets should be rotated periodically. See [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md#5-rotate-secrets-periodically) for detailed procedures.

```bash
# Every 90 days:
# 1. Generate new SECRET_KEY
# 2. Update database password
# 3. Rotate API keys
# 4. Update Twilio/email credentials if needed
```

## Troubleshooting

### Application Won't Start
```bash
docker-compose logs app | head -50

# Common causes:
# - SECRET_KEY not set or too weak
# - DATABASE_URL incorrect or database not running
# - Port 5000 already in use
```

### Database Connection Failed
```bash
# Verify database is running
docker-compose ps postgres

# Check connection
psql $DATABASE_URL -c "SELECT 1;"

# View logs
docker-compose logs postgres
```

### Email Not Sending
```bash
# Verify SMTP credentials
# For Gmail: Get app-specific password from myaccount.google.com/apppasswords

# Test email configuration
python -c "
from app import create_app
app = create_app('production')
with app.app_context():
    from app.extensions import mail
    mail.send('test@example.com', 'Test', 'Test email')
    print('✓ Email sent')
"
```

### Rate Limiting Not Working
```bash
# Verify Redis is running
redis-cli ping

# Should respond: PONG

# Check Redis connection
docker-compose logs redis
```

## Next Steps

1. Review [DEPLOYMENT_QUICK_START.md](DEPLOYMENT_QUICK_START.md)
2. Run through [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)
3. Study [SECURITY_HARDENING.md](SECURITY_HARDENING.md)
4. Read [SECURITY_IMPLEMENTATION.md](SECURITY_IMPLEMENTATION.md)

---

**Last Updated**: March 2026
