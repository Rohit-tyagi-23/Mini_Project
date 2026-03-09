# Restaurant AI - Deployment Checklist

## Pre-Deployment Verification Checklist

Before deploying to production, ensure all items below are completed.

### 1. Environment Configuration ✅
- [ ] Create `.env` file from `.env.production` template (never commit `.env` to git)
- [ ] Set `FLASK_ENV=production`
- [ ] Generate strong `SECRET_KEY` (minimum 32 characters, recommend 64+)
  ```bash
  python -c "import secrets; print(secrets.token_hex(32))"
  ```
- [ ] Configure PostgreSQL database credentials
- [ ] Set up Redis cache URL
- [ ] Configure SMTP credentials for email notifications
- [ ] (Optional) Configure Twilio for SMS alerts
- [ ] Verify all environment variables are set correctly

```bash
# Validate environment configuration
python -c "from app import create_app; app = create_app('production'); print('✓ Config loaded successfully')"
```

### 2. Database Setup ✅
- [ ] PostgreSQL database created and accessible
- [ ] Database user has proper permissions
- [ ] Run database migrations (if using Alembic):
  ```bash
  alembic upgrade head
  ```
- [ ] Initialize database schema:
  ```bash
  python -c "from app import create_app, db; app = create_app('production'); 
  app.app_context().push(); db.create_all()"
  ```
- [ ] Verify database connection from app server
- [ ] Create initial admin user if needed
- [ ] Test database backup and restore procedures

### 3. Redis Cache Setup ✅
- [ ] Redis server running and accessible
- [ ] Redis credentials configured (if auth enabled)
- [ ] Redis connection tested:
  ```bash
  redis-cli ping
  ```
- [ ] Verify cache TTL settings appropriate for production
- [ ] Test cache functionality:
  ```bash
  python -c "from app.extensions import cache; print('✓ Cache configured')"
  ```

### 4. Security Hardening ✅
- [ ] `SECRET_KEY` is strong and unique (not default)
- [ ] `.env` file is in `.gitignore` (verify with `git status`)
- [ ] No sensitive credentials in code or logs
- [ ] HTTPS/TLS enabled for all endpoints
- [ ] CORS policies configured appropriately
- [ ] Rate limiting enabled (`RATELIMIT_ENABLED=True`)
- [ ] Session cookies configured securely:
  - [x] `SESSION_COOKIE_SECURE=True` (HTTPS only)
  - [x] `SESSION_COOKIE_HTTPONLY=True` (no JavaScript access)
  - [x] `SESSION_COOKIE_SAMESITE='Strict'` (CSRF protection)
- [ ] SQL injection protections in place (using SQLAlchemy ORM)
- [ ] Input validation enabled
- [ ] CSRF tokens enabled for forms

### 5. Application Dependencies ✅
- [ ] All dependencies pinned to specific versions in `requirements.txt`
- [ ] No conflicting package versions
- [ ] pip packages audit for vulnerabilities:
  ```bash
  pip install safety
  safety check
  ```
- [ ] Development dependencies NOT installed in production
- [ ] Virtual environment used for isolation

### 6. Docker Configuration ✅
- [ ] Dockerfile uses production base image (python:3.11-slim)
- [ ] Multi-stage builds implemented (if needed for smaller images)
- [ ] Non-root user running application (UID 1000)
- [ ] Health checks configured:
  ```dockerfile
  HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:5000/health
  ```
- [ ] Docker build tested locally:
  ```bash
  docker build -t restaurant-ai:latest .
  ```
- [ ] Dockerfile security scanned:
  ```bash
  docker scan restaurant-ai:latest
  ```

### 7. Docker Compose (if using) ✅
- [ ] `docker-compose.yml` configured for production
- [ ] Environment variables not hardcoded (using `.env`)
- [ ] Restart policies set appropriately (`restart: unless-stopped`)
- [ ] Health checks configured for all services
- [ ] Volumes mapped correctly for persistence
- [ ] Service dependencies configured with `depends_on`
- [ ] Network isolation with internal networks configured
- [ ] Build tested:
  ```bash
  docker-compose build
  ```

### 8. Logging & Monitoring ✅
- [ ] Logging configured for production:
  - [x] Log level set to INFO (not DEBUG)
  - [x] Rotating file handler configured (10MB files, 10 backups)
  - [x] No sensitive data logged (passwords, tokens, etc.)
- [ ] Logs persist to disk or external service
- [ ] Monitoring/alerting configured:
  - [ ] Health check endpoint accessible: `/health`
  - [ ] Readiness endpoint working: `/health/ready`
  - [ ] Application performance metrics collected
- [ ] Error tracking configured (e.g., Sentry, DataDog)

### 9. Database Backups ✅
- [ ] Automated backup schedule configured:
  ```bash
  # Example: Daily backup at 2 AM UTC
  0 2 * * * pg_dump -U restaurant_user restaurant_ai > /backups/db_$(date +\%Y\%m\%d).sql
  ```
- [ ] Backup retention policy defined
- [ ] Restore procedures tested and documented
- [ ] Point-in-time recovery tested (if using WAL archiving)
- [ ] Off-site backup replication configured

### 10. Gunicorn Configuration ✅
- [ ] `gunicorn.conf.py` optimized for production
- [ ] Worker count appropriate for CPU cores:
  ```
  workers = (cpu_count * 2) + 1
  # For reference: 4 cores = 9 workers
  ```
- [ ] Worker timeout set to 30 seconds
- [ ] Max requests per worker configured (1000)
- [ ] Worker class appropriate (sync, gevent, or eventlet)
- [ ] Access logs configured to stdout (container-friendly)
- [ ] Graceful shutdown configured

### 11. Reverse Proxy (Nginx/Load Balancer) ✅
- [ ] Reverse proxy configured to forward traffic to Gunicorn
- [ ] HTTPS/TLS certificates installed and valid
- [ ] SSL/TLS version >= 1.2, prefer TLS 1.3
- [ ] Strong cipher suites configured
- [ ] HTTP to HTTPS redirect configured
- [ ] Security headers configured:
  - [x] `Strict-Transport-Security` (HSTS)
  - [x] `X-Content-Type-Options`
  - [x] `X-Frame-Options`
  - [x] `X-XSS-Protection`
  - [x] `Content-Security-Policy`
- [ ] Rate limiting configured at reverse proxy level
- [ ] Gzip compression enabled
- [ ] Static files served directly from Nginx

### 12. Testing ✅
- [ ] Unit tests pass:
  ```bash
  pytest tests.py -v
  ```
- [ ] Integration tests pass with production database config
- [ ] Load testing done to verify capacity:
  ```bash
  apache2-benchmark or wrk
  ```
- [ ] Security testing completed:
  - [ ] SQL injection tests
  - [ ] XSS vulnerability tests
  - [ ] CSRF protection verified
  - [ ] Authentication/authorization verified
- [ ] Manual smoke tests on staging environment
- [ ] Database migration tested on staging

### 13. API & Endpoints ✅
- [ ] All API endpoints functional
- [ ] API documentation up-to-date
- [ ] Rate limiting boundaries tested
- [ ] Error responses standardized and informative
- [ ] Health check endpoints working:
  - [ ] `/health` (liveness)
  - [ ] `/health/ready` (readiness)
- [ ] Authentication flows working correctly
- [ ] Authorization checks in place

### 14. Email & Notifications ✅
- [ ] SMTP credentials configured and tested
- [ ] Test email sending:
  ```bash
  python -c "from app.extensions import mail; 
  mail.send('test@example.com', 'Test', 'Test email')"
  ```
- [ ] Email templates use production sender
- [ ] (Optional) SMS/Twilio configured and tested
- [ ] Alert notification channels verified

### 15. File Permissions & Ownership ✅
- [ ] Application files readable by app user (UID 1000)
- [ ] Log directory writable by app user: `/app/logs`
- [ ] Data directory accessible: `/app/data`
- [ ] Database socket/files accessible by app user
- [ ] No world-readable sensitive files
- [ ] Proper umask configured (0077 for sensitive files)

### 16. Kubernetes Configuration (if applicable) ✅
- [ ] Kubernetes manifests reviewed: `k8s-deployment.yaml`
- [ ] Resource requests/limits configured
- [ ] Probes configured:
  - [ ] Liveness probe
  - [ ] Readiness probe
  - [ ] Startup probe
- [ ] Service account configured with minimal permissions
- [ ] Network policies configured
- [ ] RBAC rules configured
- [ ] Secrets management configured (not in ConfigMaps)
- [ ] PersistentVolumes configured for data durability
- [ ] ImagePullSecrets configured for private registries

### 17. Documentation ✅
- [ ] README.md updated with production deployment info
- [ ] DEPLOYMENT.md reviewed and complete
- [ ] PRODUCTION_ARCHITECTURE.md accurate
- [ ] Environment variable documentation complete
- [ ] Runbook created for common operational tasks
- [ ] Emergency procedures documented (e.g., rollback)
- [ ] Team has access to documentation

### 18. DNS & Infrastructure ✅
- [ ] DNS records point to production server
- [ ] SSL/TLS certificates valid and not expiring soon
- [ ] Certificate auto-renewal configured (Let's Encrypt)
- [ ] Firewall rules configured (inbound: 443, 80; outbound as needed)
- [ ] VPC/Security groups restrict traffic appropriately
- [ ] CDN configured (if using for static assets)
- [ ] DDoS protection enabled (if available)

### 19. Scalability & Performance ✅
- [ ] Database connection pooling configured
- [ ] Query optimization verified (index on frequently filtered columns)
- [ ] Caching strategy implemented for expensive operations
- [ ] Static files cached with proper ETags and expiration headers
- [ ] API response times acceptable (< 500ms typical)
- [ ] Database query times acceptable (< 100ms typical)
- [ ] Load testing confirms ability to handle expected traffic

### 20. Final Pre-Deployment ✅
- [ ] All team members notified of deployment window
- [ ] Rollback plan reviewed and tested
- [ ] On-call support person identified
- [ ] Communication channels open (Slack, PagerDuty, etc.)
- [ ] Database backup completed immediately before deployment
- [ ] Maintenance mode page prepared (if needed)
- [ ] Deployment procedure documented and rehearsed

## Post-Deployment Verification

After deploying, verify:

1. **Application Health**
   ```bash
   curl https://yourdomain.com/health
   # Expected: 200 OK with status: "healthy"
   ```

2. **Database Connectivity**
   ```bash
   curl https://yourdomain.com/health/ready
   # Expected: 200 OK if ready, 503 if not
   ```

3. **User Authentication**
   - [ ] Login works
   - [ ] Password reset works
   - [ ] Session management works

4. **Core Features**
   - [ ] Dashboard loads without errors
   - [ ] Forecast generation works
   - [ ] Alerts trigger and send notifications
   - [ ] Inventory management functions properly

5. **Performance Monitoring**
   - [ ] Check application logs for errors: `logs/restaurant_ai.log`
   - [ ] Monitor system resources (CPU, memory, disk)
   - [ ] Check database performance metrics
   - [ ] Monitor Redis cache hit rates

6. **Security Validation**
   - [ ] HTTPS works (no mixed content warnings)
   - [ ] Security headers present (check with browser dev tools)
   - [ ] No sensitive data in logs or responses
   - [ ] Rate limiting active

## Deployment Command Reference

### Docker Deployment
```bash
# Build
docker build -t restaurant-ai:v1.0.0 .

# Test locally
docker run -p 5000:5000 --env-file .env.production restaurant-ai:v1.0.0

# Push to registry
docker tag restaurant-ai:v1.0.0 myregistry.com/restaurant-ai:v1.0.0
docker push myregistry.com/restaurant-ai:v1.0.0
```

### Docker Compose Deployment
```bash
# Start services
docker-compose up -d

# Check status
docker-compose ps

# View logs
docker-compose logs -f app

# Initialize database
docker-compose exec app python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Stop services
docker-compose down
```

### Kubernetes Deployment
```bash
# Apply manifests
kubectl apply -f k8s-deployment.yaml

# Check status
kubectl get deployments
kubectl get pods

# View logs
kubectl logs -f deployment/restaurant-ai

# Scale
kubectl scale deployment restaurant-ai --replicas=3

# Rollout
kubectl rollout status deployment/restaurant-ai
```

### Direct Server Deployment
```bash
# Create virtual environment
python -m venv /app/venv
source /app/venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Initialize database
python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Start with Gunicorn
gunicorn --config gunicorn.conf.py wsgi:app
```

## Support & Troubleshooting

If issues occur:

1. **Check logs**: `tail -f logs/restaurant_ai.log`
2. **Verify environment**: `env | grep -E "FLASK|DATABASE|REDIS|MAIL|SECRET"`
3. **Test connectivity**: 
   ```bash
   psql $DATABASE_URL -c "SELECT 1;"
   redis-cli ping
   ```
4. **Restart application**: Services should restart automatically if using supervisor/systemd/kubernetes
5. **Contact support team** with logs and error messages

---

**Last Updated**: March 2026  
**Version**: 1.0
