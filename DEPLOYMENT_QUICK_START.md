# Quick Start: Deploying Restaurant AI to Production

This guide provides step-by-step instructions for deploying Restaurant AI to production using Docker Compose or Kubernetes.

## Prerequisites

- Docker and Docker Compose (for Docker deployment)
- kubectl (for Kubernetes deployment)  
- PostgreSQL 15+ (or managed database service)
- Redis 7+ (or managed cache service)
- SMTP credentials (for email notifications)

## 1. Prepare Environment

### Step 1: Set Up Environment Variables

Create `.env` file from the production template:
```bash
cp .env.production .env
```

Edit `.env` and set required values:
```bash
# Critical - Generate a strong secret key
python -c "import secrets; print(secrets.token_hex(32))" > secret.txt
# Copy output to SECRET_KEY= in .env

# Set database credentials
FLASK_ENV=production
DATABASE_URL=postgresql://restaurant_user:your_strong_password@postgres:5432/restaurant_ai
REDIS_URL=redis://redis:6379/0
SECRET_KEY=<generated-32-char-hex>

# Set email configuration
MAIL_USERNAME=your-email@gmail.com
MAIL_PASSWORD=your-app-specific-password
```

**Security Notes:**
- Never commit `.env` to git
- Use strong passwords (16+ characters, mixed case, numbers, symbols)
- For production, use secure secret management (AWS Secrets Manager, etc.)

### Step 2: Verify Configuration

```bash
# Test that configuration loads without errors
python -c "from app import create_app; app = create_app('production'); print('✓ Configuration loaded')"
```

---

## 2. Deploy with Docker Compose (Easiest)

### Step 1: Start Services

```bash
# Build and start all services (PostgreSQL, Redis, App, Nginx)
docker-compose up -d

# Check status
docker-compose ps
```

Expected output:
```
NAME                   STATUS          PORTS
restaurant_ai_db       Up (healthy)    5432/tcp
restaurant_ai_cache    Up (healthy)    6379/tcp  
restaurant_ai_app      Up (healthy)    5000/tcp
restaurant_ai_nginx    Up             0.0.0.0:80->80/tcp, 0.0.0.0:443->443/tcp
```

### Step 2: Initialize Database

```bash
# Create database tables
docker-compose exec app python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Verify database connection
docker-compose exec app python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.session.execute(db.text('SELECT 1')); print('✓ Database connected')"
```

### Step 3: Health Checks

```bash
# Basic health check
curl http://localhost/health
# Expected: {"status": "healthy", "service": "restaurant-ai"}

# Readiness check  
curl http://localhost/health/ready
# Expected: {"status": "ready", "database": true, "overall": true}
```

### Step 4: Create Admin User (Optional)

```bash
# Import and create user interactively
docker-compose exec app python -c "
from app import create_app, db
from models import User
app = create_app('production')
with app.app_context():
    user = User(
        email='admin@example.com',
        first_name='Admin',
        last_name='User',
        restaurant_name='Your Restaurant',
        role='admin'
    )
    user.set_password('temporary_password_123')
    db.session.add(user)
    db.session.commit()
    print(f'✓ Admin user created: {user.email}')
"
```

---

## 3. Deploy to Kubernetes

### Step 1: Create Namespace

```bash
kubectl create namespace restaurant-ai
```

### Step 2: Create Secrets

```bash
# Create secret for environment variables
kubectl create secret generic restaurant-ai-secrets \
  --from-literal=SECRET_KEY=$(python -c "import secrets; print(secrets.token_hex(32))") \
  --from-literal=DATABASE_URL=postgresql://restaurant_user:password@postgres:5432/restaurant_ai \
  --from-literal=REDIS_URL=redis://redis:6379/0 \
  --from-literal=MAIL_USERNAME=email@gmail.com \
  --from-literal=MAIL_PASSWORD=app_password \
  -n restaurant-ai
```

### Step 3: Deploy Application

```bash
# Apply Kubernetes manifests
kubectl apply -f k8s-deployment.yaml -n restaurant-ai

# Check deployment status
kubectl get deployment -n restaurant-ai
kubectl get pods -n restaurant-ai
```

### Step 4: Initialize Database

```bash
# Run database initialization as a one-time job
kubectl run-pod init-db \
  --image=restaurant-ai:latest \
  --restart=Never \
  --command -- python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()" \
  -n restaurant-ai

# Check logs
kubectl logs init-db -n restaurant-ai
```

### Step 5: Expose Service

```bash
# Create a LoadBalancer or Ingress to expose the app
kubectl expose deployment restaurant-ai \
  --type=LoadBalancer \
  --name=restaurant-ai-service \
  --port=80 \
  --target-port=5000 \
  -n restaurant-ai

# Get external IP
kubectl get svc restaurant-ai-service -n restaurant-ai
```

---

## 4. Advanced: Manual Server Deployment

### Step 1: Install System Dependencies

```bash
# Ubuntu/Debian
sudo apt-get install -y python3.11 python3.11-venv postgresql-client redis-tools

# Create application directory
sudo mkdir -p /opt/restaurant-ai
sudo chown $USER:$USER /opt/restaurant-ai
cd /opt/restaurant-ai
```

### Step 2: Set Up Application

```bash
# Create virtual environment
python3.11 -m venv venv
source venv/bin/activate

# Install dependencies
pip install --upgrade pip
pip install -r requirements.txt

# Set environment
cp .env.production .env
# Edit .env with actual credentials

# Initialize database
python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"
```

### Step 3: Start with Systemd

Create `/etc/systemd/system/restaurant-ai.service`:
```ini
[Unit]
Description=Restaurant AI Flask Application
After=network.target postgresql.service redis.service

[Service]
User=restaurant
WorkingDirectory=/opt/restaurant-ai
ExecStart=/opt/restaurant-ai/venv/bin/gunicorn \
  --config gunicorn.conf.py \
  --bind 0.0.0.0:5000 \
  wsgi:app

Restart=always
RestartSec=10

# Environment variables
EnvironmentFile=/opt/restaurant-ai/.env

[Install]
WantedBy=multi-user.target
```

Start the service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable restaurant-ai
sudo systemctl start restaurant-ai
sudo systemctl status restaurant-ai
```

---

## 5. Post-Deployment Verification

### Health Checks

```bash
# Liveness probe
curl https://yourdomain.com/health

# Readiness probe
curl https://yourdomain.com/health/ready

# Both should return 200 OK
```

### Test Core Features

```bash
# 1. Frontend accessibility
curl https://yourdomain.com

# 2. Database connection
# Dashboard → Settings (should load without DB errors)

# 3. Forecast generation
# Dashboard → Forecast tab (should calculate forecasts)

# 4. Alerts
# Settings → Alerts (should allow alert configuration)
```

### Monitor Logs

```bash
# Docker Compose
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/restaurant-ai -n restaurant-ai

# Direct server
tail -f /var/log/restaurant-ai/app.log
```

---

## 6. Scaling

### Docker Compose

```bash
# Scale application to 3 instances
docker-compose up -d --scale app=3

# Scale specific service
docker-compose up -d --scale app=3 app
```

### Kubernetes

```bash
# Scale to 3 replicas
kubectl scale deployment restaurant-ai --replicas=3 -n restaurant-ai

# Auto-scaling (requires metrics server)
kubectl autoscale deployment restaurant-ai \
  --min=3 --max=10 --cpu-percent=70 \
  -n restaurant-ai
```

---

## 7. Backup & Recovery

### Backup Database

```bash
# Docker Compose
docker-compose exec postgres pg_dump \
  -U restaurant_user \
  -d restaurant_ai \
  | gzip > db_backup_$(date +%Y%m%d_%H%M%S).sql.gz

# Direct PostgreSQL
pg_dump -U restaurant_user -h localhost restaurant_ai | gzip > backup.sql.gz

# Kubernetes
kubectl exec -it pod/restaurant-ai-db-0 \
  -- pg_dump -U restaurant_user -d restaurant_ai \
  | gzip > backup.sql.gz
```

### Restore Database

```bash
# From backup file
gzip -d backup.sql.gz
psql -U restaurant_user -d restaurant_ai < backup.sql

# Verify restore
psql -U restaurant_user -d restaurant_ai -c "SELECT COUNT(*) FROM users;"
```

---

## 8. Troubleshooting

### Application won't start

```bash
# Check logs
docker-compose logs app

# Check environment variables
env | grep -E "FLASK|DATABASE|REDIS"

# Test Python import
python -c "from app import create_app; print('✓ Import successful')"
```

### Database connection error

```bash
# Check PostgreSQL is running
pg_isready -h localhost -U restaurant_user

# Test connection
psql -h localhost -U restaurant_user -d restaurant_ai -c "SELECT 1;"

# Check credentials in .env
grep DATABASE_URL .env
```

### Redis connection error

```bash
# Check Redis is running
redis-cli ping

# Test connection string
redis-cli -u redis://localhost:6379/0 ping
```

### Email not sending

```bash
# Test SMTP configuration
python -c "
from app import create_app
from app.extensions import mail
app = create_app('production')
with app.app_context():
    mail.send(
        subject='Test',
        body='Test email',
        recipients=['test@example.com']
    )
    print('✓ Email sent')
"
```

---

## 9. Updates & Maintenance

### Update Application

```bash
# Docker Compose
git pull origin main
docker-compose build --no-cache
docker-compose up -d app

# Kubernetes
git pull origin main
docker build -t restaurant-ai:v1.0.1 .
docker push myregistry.com/restaurant-ai:v1.0.1
kubectl set image deployment/restaurant-ai \
  app=myregistry.com/restaurant-ai:v1.0.1 \
  -n restaurant-ai
```

### Database Migrations

```bash
# After code update, run migrations
docker-compose exec app python -c "from app import create_app, db; app = create_app('production'); app.app_context().push(); db.create_all()"

# Or with Alembic (if implemented)
docker-compose exec app alembic upgrade head
```

---

## 10. Monitoring & Alerts

### Set Up Monitoring

Use one of:
- **Prometheus + Grafana** - Open-source metrics
- **Datadog** - Cloud-based monitoring
- **New Relic** - Application performance monitoring  
- **Sentry** - Error tracking

Example Prometheus setup:
```yaml
# prometheus.yml
scrape_configs:
  - job_name: 'restaurant-ai'
    static_configs:
      - targets: ['localhost:5000']
```

### Key Metrics to Monitor

- **Application**: Response time, error rate, requests per second
- **Database**: Connection pool size, query latency, slow queries
- **Redis**: Hit rate, eviction rate, memory usage
- **System**: CPU usage, memory usage, disk space

---

## Useful Commands Reference

```bash
# Health checks
curl http://localhost/health
curl http://localhost/health/ready

# Database operations
docker-compose exec app python -c "from app import create_app, db; ..."

# Logs
docker-compose logs -f app
docker-compose logs -f postgres
docker-compose logs -f redis

# Database management
docker-compose exec postgres psql -U restaurant_user -d restaurant_ai -c "SELECT * FROM users;"

# Stop services
docker-compose down

# Remove data (WARNING - deletes all data)
docker-compose down -v
```

---

## Need Help?

- **Logs**: Check `logs/restaurant_ai.log` for application errors
- **Database**: Verify connectivity with `psql` or `pg_isready`
- **Cache**: Test Redis with `redis-cli ping`
- **Documentation**: See [DEPLOYMENT.md](DEPLOYMENT.md), [SECURITY_HARDENING.md](SECURITY_HARDENING.md), [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

---

**Last Updated**: March 2026
