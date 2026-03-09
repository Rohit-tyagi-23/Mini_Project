# Security Hardening Guide for Restaurant AI

## Overview
This guide outlines security best practices for deploying Restaurant AI to production.

## 1. Authentication & Authorization

### Password Security
- ✅ Passwords hashed with PBKDF2:sha256 (werkzeug.security)
- ✅ Minimum length enforced during signup
- Recommendation: Enforce minimum 12 characters
- Recommendation: Require password reset every 90 days

### Session Management
- ✅ Session cookies are HTTPOnly (no JavaScript access)
- ✅ Session cookies are Secure (HTTPS only)
- ✅ SameSite=Strict (prevents CSRF)
- ✅ 24-hour session timeout configured
- Set `PERMANENT_SESSION_LIFETIME=timedelta(hours=24)` in production

### API Authentication
- If implementing API keys:
  - Store as salted hashes in database
  - Regenerate keys periodically
  - Never log full API keys
  - Use strong random generation: `secrets.token_urlsafe(32)`

## 2. Environment Configuration

### Critical: Never Hardcode Secrets
```python
# ❌ WRONG - Never do this
SECRET_KEY = 'your-secret-key-change-in-production'
DATABASE_URL = 'postgresql://user:password@localhost/db'

# ✅ CORRECT - Always use environment variables
SECRET_KEY = os.getenv('SECRET_KEY')
DATABASE_URL = os.getenv('DATABASE_URL')
```

### Environment Variable Protection
```bash
# In production, use secure secret management:
# - AWS Secrets Manager / Parameter Store
# - Azure Key Vault
# - HashiCorp Vault
# - Kubernetes Secrets
# - Docker Secrets (Swarm)

# Never:
# - Commit .env to git
# - Log environment variables
# - Pass secrets through command line (visible in ps output)
# - Store in configuration management without encryption
```

### Sensitive File Handling
```bash
# Ensure .gitignore includes:
.env
.env.local
.env.production
cookie.txt
*.db
*.sqlite
private_keys/
secrets/

# Verify with:
git status --ignored
```

## 3. Database Security

### PostgreSQL Configuration
```sql
-- Create limited-privilege user (not superuser)
CREATE USER restaurant_user WITH PASSWORD 'very-strong-password-here';
CREATE DATABASE restaurant_ai OWNER restaurant_user;

-- Grant minimal permissions
GRANT CONNECT ON DATABASE restaurant_ai TO restaurant_user;
GRANT USAGE ON SCHEMA public TO restaurant_user;
GRANT CREATE ON SCHEMA public TO restaurant_user;

-- Revoke dangerous permissions
REVOKE ALL PRIVILEGES ON DATABASE template1 FROM restaurant_user;
```

### Connection Security
```python
# In production config:
DATABASE_URL = 'postgresql://restaurant_user:password@db.internal:5432/restaurant_ai'

# Configuration in app/config.py (✅ Already configured):
SQLALCHEMY_ENGINE_OPTIONS = {
    'pool_size': 10,
    'pool_recycle': 3600,  # Recycle connections every hour
    'pool_pre_ping': True,  # Test connection before using
    'max_overflow': 20
}

# Enable SSL/TLS for database connections:
# Add to connection string: ?sslmode=require
DATABASE_URL='postgresql://...?sslmode=require'
```

### SQL Injection Prevention
- ✅ Using SQLAlchemy ORM (parameterized queries)
- ✅ All models use ORM methods
- ✅ No raw SQL queries vulnerable to injection
- Always use: `db.session.execute(text(...), {...})`

### Query Optimization
- Index frequently queried fields:
  ```python
  email = db.Column(db.String(255), unique=True, nullable=False, index=True)
  phone_number = db.Column(db.String(20), unique=True, index=True)
  role = db.Column(db.String(20), default='manager', nullable=False, index=True)
  ```

## 4. API Security

### HTTPS/TLS
- ✅ HTTPS enforced via reverse proxy
- TLS version >= 1.2 (preferably 1.3)
- Certificate: Install valid SSL/TLS certificate
  - Use Let's Encrypt for free automated renewal
  - Wildcard or SAN certificate recommended
  - Auto-renewal configured to prevent expiration

### Security Headers
Configure in Nginx:
```nginx
# Strict-Transport-Security (HSTS)
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains; preload";

# Prevent MIME sniffing
add_header X-Content-Type-Options "nosniff";

# Clickjacking protection
add_header X-Frame-Options "SAMEORIGIN";

# XSS protection
add_header X-XSS-Protection "1; mode=block";

# Content Security Policy
add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'";

# Referrer Policy
add_header Referrer-Policy "strict-origin-when-cross-origin";
```

## 5. Cross-Site Request Forgery (CSRF) Prevention
- ✅ Session cookies have SameSite=Strict
- ✅ CSRF tokens enabled in Flask-WTF
- All state-changing operations require CSRF token verification

## 6. Cross-Site Scripting (XSS) Prevention
- ✅ Template auto-escaping enabled
- ✅ User input sanitized by Jinja2
- Audit for unsafe escaping:
  ```python
  # ❌ WRONG
  {{ user_input | safe }}
  
  # ✅ CORRECT
  {{ user_input }}  # Auto-escaped by default
  ```

## 7. Rate Limiting

### Configuration
```python
# In app/config.py (✅ Already configured):
RATELIMIT_ENABLED = True
RATELIMIT_STORAGE_URL = os.getenv('REDIS_URL', 'memory://')
```

### Production Setup
- Redis backend required (not in-memory)
- Configure rate limits:
  ```python
  # Example
  @limiter.limit("5 per minute")  # 5 requests per minute
  @app.route('/api/login', methods=['POST'])
  def login():
      pass
  ```

## 8. Dependency Management

### Vulnerability Scanning
```bash
# Check installed packages for vulnerabilities
pip install safety
safety check

# Or use pip-audit
pip install pip-audit
pip-audit

# GitHub Dependabot will also scan requirements.txt
```

### Dependency Pinning
All versions must be pinned in requirements.txt:
```
Flask==3.0.0              # ✅ Pinned
Flask-SQLAlchemy==3.0.0   # ✅ Pinned
pandas==2.0.0             # ✅ Pinned

# ❌ WRONG - Never use unpinned versions in production
Flask>=3.0.0
pandas>=2.0.0
```

### Regular Updates
- Review dependency updates monthly
- Test updates in staging before production
- Keep Python version up-to-date (3.11+)

## 9. Logging & Monitoring

### Secure Logging
- ✅ Log level: INFO (not DEBUG in production)
- ✅ Rotating file handler: 10MB files, 10 backups
- ✅ No sensitive data logged

**NEVER log:**
```python
# ❌ WRONG
logger.info(f"User: {email}, Password: {password}")
logger.debug(f"Database URL: {DATABASE_URL}")
logger.info(f"API Key: {api_key}")

# ✅ CORRECT
logger.info(f"User login attempt: {email}")
logger.debug("Database connected successfully")
logger.info("API request processed")
```

### Log Storage
- Store logs persistently (not in container only)
- Use a log aggregation service:
  - ELK Stack (Elasticsearch, Logstash, Kibana)
  - Splunk
  - Sumo Logic
  - CloudWatch (AWS)
  - Stackdriver (GCP)

### Error Tracking
Configure error tracking service:
```python
# Example: Sentry
import sentry_sdk
sentry_sdk.init(
    dsn=os.getenv('SENTRY_DSN'),
    environment=os.getenv('FLASK_ENV'),
    traces_sample_rate=0.1
)
```

## 10. Input Validation

### Form Validation
- ✅ Length limits enforced
- ✅ Email validation enforced
- ✅ Phone number validation enforced
- ✅ Role enumeration (not free text)

### File Upload Security (if applicable)
```python
# ✅ Validate file uploads
ALLOWED_EXTENSIONS = {'csv', 'xlsx', 'json'}
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB

def validate_upload(file):
    if file.filename.rsplit('.', 1)[1].lower() not in ALLOWED_EXTENSIONS:
        raise ValidationError("File type not allowed")
    if file.content_length > MAX_CONTENT_LENGTH:
        raise ValidationError("File too large")
```

## 11. Docker Security

### Image Security
```dockerfile
# Use specific version, not 'latest'
FROM python:3.11-slim  # ✅ Pinned version

# Run as non-root user
RUN useradd -m -u 1000 appuser
USER appuser  # ✅ Non-root

# Don't run as root
# ❌ USER root
```

### Scanning Images
```bash
# Use Trivy for vulnerability scanning
trivy image restaurant-ai:latest

# Or use Docker Scout
docker scout cves restaurant-ai:latest
```

## 12. Network Security

### Reverse Proxy (Nginx)
- ✅ Only expose public interface (port 80/443)
- ✅ Block direct access to app port (5000)
- Internal network for database/redis

### Firewall Rules
```bash
# Example AWS Security Group
# Inbound:
# - 80 (HTTP, from anywhere) → Redirect to 443
# - 443 (HTTPS, from anywhere)
# - 22 (SSH, from admin IPs only) - if needed

# Outbound:
# - 443 (HTTPS for package updates, email, etc.)
# - 5432 (PostgreSQL to RDS)
# - 6379 (Redis to ElastiCache)
# - 25,587 (SMTP for email)
```

### VPC/Network Isolation
- Database in private subnet
- Redis in private subnet
- Application load balancer in public subnet
- NAT Gateway for outbound connections from private subnets

## 13. Backup & Disaster Recovery

### Database Backups
```bash
# Daily backup script
#!/bin/bash
BACKUP_DIR="/backups"
DATABASE_URL="postgresql://..."

pg_dump "$DATABASE_URL" \
  | gzip > "$BACKUP_DIR/db_backup_$(date +%Y%m%d_%H%M%S).sql.gz"

# Retention: Delete backups older than 30 days
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +30 -delete
```

### Backup Testing
- Monthly test restores from backup
- Verify data integrity after restore
- Document restore procedure

### Point-in-Time Recovery
- Enable WAL archiving for PostgreSQL:
  ```sql
  wal_level = replica
  archive_mode = on
  archive_command = 'cp %p /archive/%f'
  ```

## 14. Incident Response

### Security Incident Procedure
1. **Detect**: Monitor logs, alerts, security scanners
2. **Respond**: Isolate affected systems
3. **Investigate**: Analyze logs, determine scope
4. **Remediate**: Fix vulnerability, patch systems
5. **Verify**: Confirm fix works
6. **Document**: Record incident details
7. **Improve**: Update controls based on lessons learned

### Secret Rotation
If a secret is exposed:
1. Immediately revoke the old secret
2. Generate a new secret
3. Update all systems using the old secret
4. Monitor for any misuse of old secret
5. Document incident

## 15. Compliance & Auditing

### Audit Logging
Log all security-relevant events:
- Login attempts (success and failures)
- Password changes
- Permission changes
- Admin actions
- Data access for sensitive information

```python
def log_security_event(event_type, user_id, details):
    """Log security-relevant event for audit trail"""
    app.logger.info(f"SECURITY_EVENT: {event_type} | user_id: {user_id} | {details}")
```

### Retention Policy
- Keep logs for minimum 90 days (regulatory requirement)
- Archive logs for minimum 1 year
- Secure deletion after retention period

### GDPR/Privacy Compliance
- Users can request data download: Include export functionality
- Users can request data deletion: Implement account deletion
- Handle personal data securely: Encrypt sensitive fields if needed
- Document privacy policy and terms of service

## 16. Checklist for Deployment

Before deploying to production:
- [ ] All secrets set via environment variables
- [ ] `.env` files not in git
- [ ] Dependencies scanned for vulnerabilities
- [ ] Database configured with minimal privileges
- [ ] SSL/TLS certificates installed
- [ ] Security headers configured
- [ ] Rate limiting enabled
- [ ] Logging configured (INFO level)
- [ ] Monitoring & alerting set up
- [ ] Backup procedures tested
- [ ] Incident response plan documented
- [ ] Team trained on security procedures

## Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework)
- [Flask Security](https://flask.palletsprojects.com/en/3.0.x/security/)
- [PostgreSQL Security](https://www.postgresql.org/docs/current/sql-syntax.html)

---

**Last Updated**: March 2026
