# Quick Start - Production Deployment Guide

## 🚀 Getting Started with Production

### Prerequisites
- Docker & Docker Compose installed
- PostgreSQL (if not using Docker)
- Redis (if not using Docker)
- Python 3.11+ (for local development)

---

## Option 1: Docker Compose (Recommended)

### 1. Clone and Configure
```bash
git clone <your-repo>
cd inventory_ai_project

# Configure environment
cp .env.production .env
# Edit .env with your actual credentials
```

### 2. Start All Services
```bash
docker-compose up -d
```

This starts:
- PostgreSQL database
- Redis cache
- Application (3 replicas for HA)
- Nginx reverse proxy

### 3. Verify Deployment
```bash
# Check all services
docker-compose ps

# Check health
curl http://localhost/health

# View logs
docker-compose logs -f app
```

### 4. Initialize Database
```bash
docker-compose exec app python -c "
from app import create_app, db
app = create_app('production')
with app.app_context():
    db.create_all()
    print('Database initialized')
"
```

### 5. Access Application
Open browser: `http://localhost`

---

## Option 2: Kubernetes

### 1. Configure Secrets
```bash
# Edit k8s-deployment.yaml with your actual secrets
# Or use kubectl create secret

kubectl create secret generic app-secrets \
  --from-literal=SECRET_KEY=your-secret \
  --from-literal=DATABASE_URL=your-db-url \
  -n restaurant-ai
```

### 2. Deploy
```bash
kubectl apply -f k8s-deployment.yaml
```

### 3. Check Status
```bash
kubectl get pods -n restaurant-ai
kubectl get svc -n restaurant-ai
```

### 4. Access Application
```bash
kubectl get svc restaurant-ai-service -n restaurant-ai
# Use the EXTERNAL-IP
```

---

## Option 3: Manual Production Setup

### 1. Install Dependencies
```bash
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment
```bash
cp .env.production .env
# Edit .env
```

### 3. Initialize Database
```bash
export FLASK_ENV=production
python -c "
from app import create_app, db
app = create_app('production')
with app.app_context():
    db.create_all()
"
```

### 4. Run with Gunicorn
```bash
gunicorn --config gunicorn.conf.py wsgi:app
```

---

## Scaling

### Docker Compose
```bash
# Scale to 5 app instances
docker-compose up -d --scale app=5
```

### Kubernetes
```bash
# Manual scaling
kubectl scale deployment restaurant-ai-app --replicas=5 -n restaurant-ai

# Auto-scaling is configured via HPA (3-10 replicas based on CPU)
```

---

## Monitoring

### Health Checks
```bash
# Basic health
curl http://localhost/health

# Readiness (database connectivity)
curl http://localhost/health/ready

# Liveness
curl http://localhost/health/live

# Metrics
curl http://localhost/metrics
```

### Logs
```bash
# Docker
docker-compose logs -f app

# Kubernetes
kubectl logs -f deployment/restaurant-ai-app -n restaurant-ai

# Local
tail -f logs/restaurant_ai.log
```

---

## Troubleshooting

### Issue: Database connection failed
```bash
# Check database is running
docker-compose ps postgres
# Or check Kubernetes
kubectl get pods -n restaurant-ai | grep postgres

# Test connection
docker-compose exec postgres psql -U restaurant_user -d restaurant_ai
```

### Issue: App won't start
```bash
# Check logs
docker-compose logs app

# Verify environment variables
docker-compose exec app env | grep DATABASE_URL
```

### Issue: Performance problems
```bash
# Check metrics
curl http://localhost/metrics

# Increase workers
# Edit docker-compose.yml or gunicorn.conf.py
# Set GUNICORN_WORKERS=8
```

---

## Security Checklist

- [ ] Change SECRET_KEY from default
- [ ] Use strong database passwords
- [ ] Enable HTTPS/SSL (configure Nginx)
- [ ] Set up firewall rules
- [ ] Enable rate limiting
- [ ] Regular security updates
- [ ] Backup database regularly

---

## Production Checklist

- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] SSL certificates installed (for HTTPS)
- [ ] Monitoring setup (optional: Prometheus, Grafana)
- [ ] Log aggregation (optional: ELK stack)
- [ ] Backup strategy configured
- [ ] CI/CD pipeline configured
- [ ] Load testing performed
- [ ] Security scanning completed

---

## Performance Tuning

### Database
```sql
-- Add indexes for common queries
CREATE INDEX idx_sales_ingredient ON sales_records(ingredient_id);
CREATE INDEX idx_sales_date ON sales_records(date);
```

### Application
```python
# Enable query result caching
@cache.memoize(timeout=300)
def get_forecast_data(ingredient_id):
    # Expensive ML operation
    pass
```

### Infrastructure
- Use CDN for static assets
- Enable Gzip compression (done in Nginx)
- Use read replicas for database
- Implement Redis for session storage

---

## Backup & Recovery

### Database Backup
```bash
# Docker
docker-compose exec postgres pg_dump -U restaurant_user restaurant_ai > backup.sql

# Restore
docker-compose exec -T postgres psql -U restaurant_user restaurant_ai < backup.sql
```

### Automated Backups
```bash
# Add to crontab
0 2 * * * docker-compose exec postgres pg_dump -U restaurant_user restaurant_ai > /backups/db_$(date +\%Y\%m\%d).sql
```

---

## Support & Resources

- **Architecture**: See `PRODUCTION_ARCHITECTURE.md`
- **API Docs**: `/api/v1/docs` (when implemented)
- **Issue Tracker**: GitHub Issues
- **Monitoring**: Grafana dashboard (when configured)

---

## Next Steps

1. ✅ Deploy using Docker Compose
2. ✅ Verify health checks pass
3. ⏳ Set up monitoring (Prometheus + Grafana)
4. ⏳ Configure HTTPS/SSL
5. ⏳ Set up CI/CD pipeline
6. ⏳ Perform load testing
7. ⏳ Configure automated backups
8. ⏳ Set up alerting (PagerDuty, Slack, etc.)

**Your application is production-ready!** 🎉
