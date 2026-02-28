# Database Setup & Migration Guide

Complete guide to the new database layer for Restaurant Inventory AI

---

## Overview

The project now supports **SQLite** (development) and **PostgreSQL** (production) databases using SQLAlchemy ORM. This guide explains the database setup, migration, and usage.

### What's Changed

| Before | After |
|--------|-------|
| In-memory user dict | PostgreSQL/SQLite User table |
| CSV file for sales | SalesRecord table in DB |
| No forecast history | Forecast table for results |
| No audit trail | AlertHistory table for tracking |
| No ingredient metadata | IngredientMaster table |

---

## System Architecture

```
App (app.py)
     ↓
SQLAlchemy ORM (models.py)
     ↓
┌──────────────────┬────────────────────┐
│   SQLite (Dev)   │  PostgreSQL (Prod) │
│ restaurant_ai.db │  resto_db (remote) │
└──────────────────┴────────────────────┘
     ↓
┌─────────────────────────────────────┐
│     Database Tables                 │
│ - users                              │
│ - locations                          │
│ - sales_records                      │
│ - forecasts                          │
│ - alert_preferences                  │
│ - alert_history                      │
│ - ingredient_master                  │
└─────────────────────────────────────┘
```

---

## Database Models

### 1. User (users table)

```python
from models import User

# Create user
user = User(
    email='owner@restaurant.com',
    first_name='John',
    last_name='Smith',
    restaurant_name='Pizzeria XYZ'
)
user.set_password('secure_password')
db.session.add(user)
db.session.commit()

# Query user
user = User.query.filter_by(email='owner@restaurant.com').first()

# Verify password
if user.check_password('secure_password'):
    print("Login successful")

# Convert to dict
user_dict = user.to_dict()
```

**Fields:**
- `id` - Primary key (auto)
- `email` - Unique email address
- `password_hash` - Bcrypt hashed password
- `first_name` / `last_name` - User name
- `restaurant_name` - Restaurant identifier
- `created_at` / `updated_at` - Timestamps

---

### 2. Location (locations table)

```python
from models import Location

# Create location for user
location = Location(
    user_id=user.id,
    country='US',
    city='New York',
    latitude=40.7128,
    longitude=-74.0060
)
location.set_units({
    'weight': 'lbs',
    'volume': 'fl oz',
    'currency': 'USD'
})
db.session.add(location)
db.session.commit()

# Retrieve location
location = user.location  # Via relationship
units = location.get_units()  # Parse from JSON
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key to users
- `country` - ISO country code (US, CA, etc)
- `city` - City name
- `latitude` / `longitude` - GPS coordinates
- `units_json` - JSON storage for unit standards

---

### 3. SalesRecord (sales_records table)

```python
from models import SalesRecord
from datetime import date

# Add sales record
sale = SalesRecord(
    user_id=user.id,
    ingredient='Tomato',
    quantity_sold=50.5,
    sale_date=date.today(),
    notes='From farmer market'
)
db.session.add(sale)
db.session.commit()

# Query recent sales
from datetime import timedelta
recent_sales = SalesRecord.query.filter(
    SalesRecord.user_id == user.id,
    SalesRecord.ingredient == 'Tomato',
    SalesRecord.sale_date >= date.today() - timedelta(days=30)
).all()

# Get sales for forecasting
sales_data = []
for sale in recent_sales:
    sales_data.append({
        'date': sale.sale_date,
        'quantity': sale.quantity_sold
    })
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key
- `ingredient` - Ingredient name (indexed)
- `quantity_sold` - Float quantity
- `sale_date` - Date of sale (indexed)
- `notes` - Optional notes
- `created_at` - Record creation timestamp

---

### 4. Forecast (forecasts table)

```python
from models import Forecast
from datetime import datetime, timedelta

# Save forecast result
forecast = Forecast(
    user_id=user.id,
    ingredient='Tomato',
    forecast_days=7,
    model_used='Prophet',
    confidence=0.92,
    rmse=2.34,
    mae=1.87,
    reorder_point=145.5,
    safety_stock=42.3,
    recommended_order_qty=200,
    weekly_total=340.2
)

# Store predictions as JSON
forecast.set_daily_predictions([
    {'day': 1, 'quantity': 48.5},
    {'day': 2, 'quantity': 50.2},
    # ...
])

forecast.set_confidence_intervals({
    'upper_95': [50.2, 52.1, 51.8],
    'lower_95': [46.8, 48.3, 47.8]
})

forecast.expires_at = datetime.utcnow() + timedelta(hours=24)
db.session.add(forecast)
db.session.commit()

# Retrieve latest forecast
latest = Forecast.query.filter_by(
    user_id=user.id,
    ingredient='Tomato'
).order_by(Forecast.created_at.desc()).first()

if not latest.is_expired():
    predictions = latest.get_daily_predictions()
    intervals = latest.get_confidence_intervals()
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key
- `ingredient` - Ingredient name (indexed)
- `forecast_days` - Number of days forecasted
- `model_used` - Model type (Prophet, ARIMA, LSTM, etc)
- `confidence` - Confidence score (0.0-1.0)
- `daily_predictions_json` - JSON array of daily predictions
- `confidence_intervals_json` - JSON with upper/lower bounds
- `rmse` / `mae` - Error metrics
- `reorder_point` / `safety_stock` - Inventory calculations
- `recommended_order_qty` / `weekly_total` - Order suggestions
- `created_at` - Timestamp
- `expires_at` - Forecast expiration

---

### 5. AlertPreference (alert_preferences table)

```python
from models import AlertPreference

# Create/Update alert preferences
prefs = AlertPreference.query.filter_by(user_id=user.id).first()
if not prefs:
    prefs = AlertPreference(user_id=user.id)

prefs.email_enabled = True
prefs.email_address = 'manager@restaurant.com'
prefs.sms_enabled = True
prefs.phone_number = '+1-555-0123'
prefs.threshold_percentage = 20

db.session.add(prefs)
db.session.commit()

# Check preferences
if prefs.email_enabled:
    send_email_alert(prefs.email_address, message)
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key (unique)
- `email_enabled` / `email_address` - Email configuration
- `sms_enabled` / `phone_number` - SMS configuration
- `threshold_percentage` - Alert threshold (1-100%)
- `reorder_point_auto_calculate` - Auto calculation flag
- `contact_name` / `contact_email_backup` - Contact info
- `created_at` / `updated_at` - Timestamps

---

### 6. AlertHistory (alert_history table)

```python
from models import AlertHistory

# Log alert sent
alert_log = AlertHistory(
    user_id=user.id,
    ingredient='Tomato',
    alert_type='low_stock',
    channel='email',
    current_stock=50.5,
    reorder_point=145.5,
    status='sent'
)
db.session.add(alert_log)
db.session.commit()

# Log failed alert
alert_log.status = 'failed'
alert_log.error_message = 'Invalid email address'
db.session.commit()

# Retrieve alert history
recent_alerts = AlertHistory.query.filter(
    AlertHistory.user_id == user.id,
    AlertHistory.created_at >= datetime.utcnow() - timedelta(days=7)
).all()
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key (indexed)
- `ingredient` - Ingredient name (indexed)
- `alert_type` - 'low_stock', 'reorder_reminder', etc
- `channel` - 'email', 'sms', 'dashboard'
- `current_stock` / `reorder_point` - Stock levels
- `status` - 'sent', 'failed', 'bounced'
- `error_message` - Failure reason
- `created_at` - Timestamp (indexed)

---

### 7. IngredientMaster (ingredient_master table)

```python
from models import IngredientMaster

# Create ingredient master record
ingredient = IngredientMaster(
    user_id=user.id,
    ingredient='Tomato',
    unit_of_measure='lbs',
    current_stock=50.5,
    reorder_point=145.5,
    supplier='Fresh Produce Co',
    supplier_lead_time_days=2,
    cost_per_unit=0.75
)
db.session.add(ingredient)
db.session.commit()

# Get all ingredients for user
ingredients = IngredientMaster.query.filter_by(user_id=user.id).all()

# Update stock
ingredient = IngredientMaster.query.filter_by(
    user_id=user.id,
    ingredient='Tomato'
).first()
ingredient.current_stock = 120.0
ingredient.last_forecast_date = datetime.utcnow()
db.session.commit()
```

**Fields:**
- `id` - Primary key
- `user_id` - Foreign key (indexed)
- `ingredient` - Ingredient name (indexed)
- `unit_of_measure` - lbs, kg, pieces, etc
- `current_stock` - Current quantity
- `reorder_point` - Reorder threshold
- `supplier` - Supplier name
- `supplier_lead_time_days` - Days to deliver
- `cost_per_unit` - Unit cost
- `last_reorder_date` - Last order date
- `last_forecast_date` - Last forecast run
- `created_at` / `updated_at` - Timestamps

---

## Database Setup

### Quick Start

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Initialize database
python init_db.py

# 3. Optional: Seed sample data
python init_db.py --seed-data
```

### Step-by-Step Setup

#### Step 1: Configure Database URL

**For SQLite (Development):**
```bash
# .env file
DATABASE_URL=sqlite:///restaurant_ai.db
```

**For PostgreSQL (Production):**
```bash
# .env file
DATABASE_URL=postgresql://username:password@localhost:5432/restaurant_ai_db
```

#### Step 2: Install PostgreSQL (if using production)

**macOS:**
```bash
brew install postgresql
brew services start postgresql
createdb restaurant_ai_db
```

**Windows:**
- Download from postgresql.org
- Install with pgAdmin
- Create database via pgAdmin GUI

**Linux (Ubuntu):**
```bash
sudo apt install postgresql postgresql-contrib
sudo -u postgres createdb restaurant_ai_db
sudo -u postgres psql -c "CREATE USER resto_user WITH PASSWORD 'secure_pass';"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE restaurant_ai_db TO resto_user;"
```

#### Step 3: Run Initialization Script

```bash
# Interactive mode
python init_db.py

# Or direct commands
python init_db.py --init          # Create tables
python init_db.py --seed-data     # Add sample data
python init_db.py --check          # Verify database
```

#### Step 4: Verify Setup

```bash
# Check database
python init_db.py --info

# Output should show:
# Database URL: sqlite:///restaurant_ai.db
# Users: 1 (demo@restaurant.com)
# Sales Records: 12
# Ingredients: 5
```

---

## Migrating from CSV to Database

### Option 1: Automatic Migration (Recommended)

```python
# migrate_csv_to_db.py
import pandas as pd
from app import app, db
from models import User, SalesRecord
from datetime import datetime

# Load demo user
user = User.query.filter_by(email='demo@restaurant.com').first()

# Load CSV
df = pd.read_csv('data/sales_data.csv')
df['date'] = pd.to_datetime(df['date'])

# Import records
count = 0
for _, row in df.iterrows():
    existing = SalesRecord.query.filter_by(
        user_id=user.id,
        ingredient=row['ingredient'],
        sale_date=row['date']
    ).first()
    
    if not existing:
        record = SalesRecord(
            user_id=user.id,
            ingredient=row['ingredient'],
            quantity_sold=float(row['quantity_sold']),
            sale_date=row['date'].date()
        )
        db.session.add(record)
        count += 1

db.session.commit()
print(f"Imported {count} records from CSV")
```

### Option 2: Keep CSV as Backup

```python
# Load from CSV for forecasting
def get_sales_data_for_forecast(user_id, ingredient):
    # Try database first
    sales = SalesRecord.query.filter_by(
        user_id=user_id,
        ingredient=ingredient
    ).all()
    
    if sales:
        return pd.DataFrame([{
            'date': s.sale_date,
            'quantity_sold': s.quantity_sold
        } for s in sales])
    
    # Fall back to CSV if no DB records
    df = pd.read_csv('data/sales_data.csv')
    return df[df['ingredient'] == ingredient]
```

---

## API Integration

### Updated API Endpoints

The API endpoints now use database queries instead of CSV:

**Before (CSV):**
```python
df = pd.read_csv(DATA_PATH)
ingredient_df = df[df["ingredient"] == ingredient]
```

**After (Database):**
```python
from models import SalesRecord
sales = SalesRecord.query.filter_by(
    user_id=session['user_id'],
    ingredient=ingredient
).all()
ingredient_df = pd.DataFrame([...])
```

### Example: Updated Forecast Endpoint

```python
@app.route("/api/forecast", methods=["POST"])
def api_forecast():
    """Updated to use database"""
    data = request.get_json()
    ingredient = data.get("ingredient")
    
    # Get user from session
    user = User.query.filter_by(email=session['user']).first()
    
    # Load sales from database
    sales = SalesRecord.query.filter_by(
        user_id=user.id,
        ingredient=ingredient
    ).order_by(SalesRecord.sale_date).all()
    
    if not sales:
        return jsonify({"error": "No data"}), 404
    
    # Convert to DataFrame for forecasting
    df = pd.DataFrame([{
        'date': s.sale_date,
        'quantity_sold': s.quantity_sold
    } for s in sales])
    
    # Run forecast
    forecast_result = forecast_demand(df)
    
    # Save forecast to database
    forecast = Forecast(
        user_id=user.id,
        ingredient=ingredient,
        model_used=forecast_result['model'],
        confidence=forecast_result['confidence'],
        weekly_total=forecast_result['weekly']
    )
    forecast.set_daily_predictions(forecast_result['daily'])
    db.session.add(forecast)
    db.session.commit()
    
    return jsonify(forecast.to_dict())
```

---

## Production Deployment

### Docker Setup with PostgreSQL

```dockerfile
# Dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
ENV DATABASE_URL=postgresql://user:password@db:5432/resto_db
CMD ["gunicorn", "-w", "4", "-b", "0.0.0.0:5000", "app:app"]
```

```yaml
# docker-compose.yml
version: '3.8'
services:
  app:
    build: .
    ports:
      - "5000:5000"
    environment:
      DATABASE_URL: postgresql://resto_user:secure_pass@db:5432/resto_db
    depends_on:
      - db
    command: sh -c "python -c 'from app import db; db.create_all()' && gunicorn -w 4 -b 0.0.0.0:5000 app:app"

  db:
    image: postgres:14
    environment:
      POSTGRES_DB: resto_db
      POSTGRES_USER: resto_user
      POSTGRES_PASSWORD: secure_pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

Deploy:
```bash
docker-compose up -d
```

---

## Common Scenarios

### Scenario 1: User Signs Up

```python
# 1. Create user
user = User(email='new@restaurant.com', first_name='John', ...)
user.set_password('password')
db.session.add(user)

# 2. Create location
location = Location(user_id=user.id, country='US')
location.set_units({'weight': 'lbs', ...})
db.session.add(location)

# 3. Create alert preferences
prefs = AlertPreference(user_id=user.id, email_enabled=True)
db.session.add(prefs)

db.session.commit()
```

### Scenario 2: User Adds Sales Data

```python
sale = SalesRecord(
    user_id=user.id,
    ingredient='Tomato',
    quantity_sold=50.5,
    sale_date=date.today()
)
db.session.add(sale)
db.session.commit()
```

### Scenario 3: Generate and Save Forecast

```python
# Query sales data
sales = SalesRecord.query.filter_by(
    user_id=user.id,
    ingredient='Tomato'
).all()

# Run forecast
forecast_data = forecast_demand(convert_to_df(sales))

# Save to database
forecast = Forecast(
    user_id=user.id,
    ingredient='Tomato',
    model_used=forecast_data['model'],
    confidence=forecast_data['confidence']
)
forecast.set_daily_predictions(forecast_data['predictions'])
db.session.add(forecast)
db.session.commit()
```

### Scenario 4: Monitor Alert History

```python
# Log alert
alert = AlertHistory(
    user_id=user.id,
    ingredient='Tomato',
    alert_type='low_stock',
    channel='email',
    current_stock=50.5,
    status='sent'
)
db.session.add(alert)
db.session.commit()

# Query recent alerts
recent = AlertHistory.query.filter(
    AlertHistory.user_id == user.id,
    AlertHistory.created_at >= datetime.utcnow() - timedelta(days=7)
).order_by(AlertHistory.created_at.desc()).all()
```

---

## Performance Optimization

### Indexes

Database includes indexes on:
- `users.email` - Fast login
- `sales_records.user_id` - Filter by user
- `sales_records.ingredient` - Filter by ingredient
- `sales_records.sale_date` - Filter by date
- `forecasts.user_id` - User forecasts
- `alert_history.user_id` - User alerts

### Query Optimization

```python
# ❌ Bad: N+1 query problem
users = User.query.all()
for user in users:
    locations = user.location  # Query for each user

# ✅ Good: Single query with join
users = User.query.options(
    db.joinedload('location')
).all()

# ✅ Good: Limit results
recent_sales = SalesRecord.query.filter_by(
    user_id=user.id
).order_by(SalesRecord.sale_date.desc()).limit(100).all()
```

### Caching

```python
from functools import lru_cache

@lru_cache(maxsize=128)
def get_ingredient_forecast(user_id, ingredient):
    """Cache forecast results (24 hours)"""
    return Forecast.query.filter_by(
        user_id=user_id,
        ingredient=ingredient
    ).order_by(Forecast.created_at.desc()).first()
```

---

## Troubleshooting

### Database Connection Errors

```
Error: (psycopg2.OperationalError) FATAL: role "resto_user" does not exist
```

**Solution:**
```bash
# PostgreSQL
sudo -u postgres createuser resto_user
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE resto_db TO resto_user;"
```

### SQLite File Permission Errors

```
Error: database is locked
```

**Solution:**
```bash
# Remove old database and reinitialize
rm restaurant_ai.db
python init_db.py --init
```

### Flask-SQLAlchemy Import Errors

```
ImportError: cannot import name 'SQLAlchemy' from 'flask_sqlalchemy'
```

**Solution:**
```bash
pip install --upgrade Flask-SQLAlchemy
```

---

## Next Steps

1. **Run initialization:** `python init_db.py --seed-data`
2. **Verify setup:** `python init_db.py --check`
3. **Start application:** `python app.py`
4. **Test database:** Log in and add sales data
5. **Monitor:** Use init_db.py --info to check database growth

---

## Reference

### Common Tasks

| Task | Command |
|------|---------|
| Initialize DB | `python init_db.py --init` |
| Add sample data | `python init_db.py --seed-data` |
| Check status | `python init_db.py --check` |
| Reset database | `python init_db.py --reset` |
| Show info | `python init_db.py --info` |

### Database URLs

| Type | URL | Notes |
|------|-----|-------|
| SQLite | `sqlite:///restaurant_ai.db` | Development (default) |
| PostgreSQL | `postgresql://user:pass@localhost/db` | Production |
| MySQL | `mysql+pymysql://user:pass@localhost/db` | Alternative |

---

**For more info:** See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md#production-database-setup) and [ARCHITECTURE.md](ARCHITECTURE.md#data-model)
