# Database Integration - Remaining Work

Complete checklist and implementation guide for finishing the database migration.

---

## Implementation Checklist

### Core Infrastructure ✅ (100% Complete)
- [x] Create SQLAlchemy models (models.py)
- [x] Update Flask configuration for SQLAlchemy
- [x] Create database initialization script (init_db.py)
- [x] Update authentication (login/signup/OAuth)
- [x] Add database dependencies to requirements.txt
- [x] Create configuration template (.env.example)
- [x] Create comprehensive documentation

### API Endpoints ⚠️ (40% Complete)

#### User & Auth Endpoints ✅
- [x] POST /login - ✅ Reads from User table
- [x] POST /signup - ✅ Creates users in database
- [x] GET /logout - ✅ Works with session
- [x] POST /guest-login - ✅ Uses demo account
- [x] POST /auth/<provider> - ✅ Prepared for OAuth
- [x] POST /auth/callback/<provider> - ✅ Creates users in DB

#### Dashboard & Data Endpoints ⚠️
- [ ] GET /dashboard - ✅ Routes correctly
- [ ] GET /forecast - ✅ Routes correctly  
- [ ] POST /result - ⚠️ Needs DB integration
- [ ] GET /api/dashboard-stats - ⚠️ Still reads CSV
- [ ] POST /api/forecast - ⚠️ Still reads CSV, needs saving
- [ ] GET /api/ingredient-history - ⚠️ Still reads CSV

#### Location & Units Endpoints ⚠️
- [ ] GET /api/user/location - ⚠️ Needs update
- [ ] POST /api/location/country - ⚠️ Needs update
- [ ] POST /api/convert-units - ✅ No changes needed

#### Alert Endpoints ⚠️
- [ ] GET /api/alerts/preferences - ⚠️ Needs update
- [ ] POST /api/alerts/preferences - ⚠️ Needs update
- [ ] POST /api/alerts/test - ⚠️ Needs logging
- [ ] POST /api/alerts/check-stock - ⚠️ Needs logging

---

## Priority 1: Critical Endpoints (Must Complete)

### 1. GET /api/dashboard-stats
**Current Status:** Reads from CSV
**Location:** app.py ~line 510

**What to Change:**
```python
# BEFORE (CSV)
df = pd.read_csv(DATA_PATH)
ingredient_df = df[df["ingredient"] == ingredient]

# AFTER (Database)
user = User.query.filter_by(email=session['user']).first()
sales = SalesRecord.query.filter_by(user_id=user.id).all()

# Convert to same format
sales_data = []
for sale in sales:
    sales_data.append({
        'date': sale.sale_date,
        'ingredient': sale.ingredient,
        'quantity_sold': sale.quantity_sold
    })
df = pd.DataFrame(sales_data)
```

**Impact:** Dashboard won't show metrics without this

---

### 2. POST /api/forecast
**Current Status:** Reads from CSV, doesn't save results
**Location:** app.py ~line 520

**What to Change:**
```python
# BEFORE: Load from CSV
df = pd.read_csv(DATA_PATH)
ingredient_df = df[df["ingredient"] == ingredient]

# AFTER: Load from database
user = User.query.filter_by(email=session['user']).first()
sales = SalesRecord.query.filter_by(
    user_id=user.id,
    ingredient=ingredient
).order_by(SalesRecord.sale_date).all()

# Create DataFrame
data = [{
    'date': s.sale_date,
    'quantity_sold': s.quantity_sold
} for s in sales]
df = pd.DataFrame(data)

# ... run forecast ...

# ADD: Save forecast to database
forecast_obj = Forecast(
    user_id=user.id,
    ingredient=ingredient,
    forecast_days=7,
    model_used=forecast['model'],
    confidence=forecast['confidence'],
    rmse=forecast.get('rmse'),
    mae=forecast.get('mae'),
    weekly_total=forecast['weekly'],
    reorder_point=decision['reorder_point'],
    safety_stock=decision['safety_stock'],
    recommended_order_qty=decision['order_qty']
)
forecast_obj.set_daily_predictions(forecast['daily'])
forecast_obj.set_confidence_intervals(forecast['intervals'])
db.session.add(forecast_obj)
db.session.commit()
```

**Impact:** Forecasts won't be cached or trackable

---

### 3. GET /api/ingredient-history/<ingredient>
**Current Status:** Reads from CSV
**Location:** app.py ~line 575

**What to Change:**
```python
# BEFORE
df = pd.read_csv(DATA_PATH)
ingredient_df = df[df["ingredient"] == ingredient]

# AFTER
user = User.query.filter_by(email=session['user']).first()
sales = SalesRecord.query.filter_by(
    user_id=user.id,
    ingredient=ingredient
).order_by(SalesRecord.sale_date).all()

history = [{
    'date': s.sale_date.isoformat(),
    'quantity': s.quantity_sold
} for s in sales]
```

**Impact:** Ingredient history won't load

---

## Priority 2: Important Endpoints (Should Complete)

### 4. GET /api/alerts/preferences
**Location:** app.py ~line 725

```python
# AFTER: Get from database
user = User.query.filter_by(email=session['user']).first()
prefs = AlertPreference.query.filter_by(user_id=user.id).first()

if prefs:
    return jsonify({
        "success": True,
        "preferences": prefs.to_dict()
    })
else:
    return jsonify({
        "success": True,
        "preferences": {}
    })
```

---

### 5. POST /api/alerts/preferences
**Location:** app.py ~line 745

```python
# AFTER: Save to database
user = User.query.filter_by(email=session['user']).first()
prefs = AlertPreference.query.filter_by(user_id=user.id).first()

if not prefs:
    prefs = AlertPreference(user_id=user.id)

prefs.email_enabled = request.json.get('email_enabled', True)
prefs.email_address = request.json.get('email_address')
prefs.sms_enabled = request.json.get('sms_enabled', False)
prefs.phone_number = request.json.get('phone_number')
prefs.threshold_percentage = request.json.get('threshold_percentage', 25)

db.session.add(prefs)
db.session.commit()

return jsonify({"success": True, "preferences": prefs.to_dict()})
```

---

### 6. POST /api/alerts/check-stock
**Location:** app.py ~line 810

**What to Add:**
```python
# Add logging
user = User.query.filter_by(email=session['user']).first()
alert_log = AlertHistory(
    user_id=user.id,
    ingredient=ingredient,
    alert_type='low_stock',
    channel='email',  # Would be: SMS, dashboard, etc
    current_stock=current_stock,
    reorder_point=reorder_point,
    status='sent'
)
db.session.add(alert_log)
db.session.commit()
```

**Impact:** Can't audit alerts without this

---

## Priority 3: Nice-to-Have (Can Wait)

- [ ] Cache forecast results (Redis)
- [ ] Add database migrations (Alembic)
- [ ] Implement forecast expiration cleanup
- [ ] Add ingredient master management UI
- [ ] Advanced alert scheduling

---

## Implementation Order

### Phase 1: Core API (2-3 hours)
1. Update GET /api/dashboard-stats
2. Update POST /api/forecast (with saving)
3. Update GET /api/ingredient-history

**Result:** Dashboard and forecasting fully functional with database

### Phase 2: Preferences (1-2 hours)
1. Update GET/POST /api/alerts/preferences
2. Update GET /api/user/location
3. Add AlertHistory logging

**Result:** All user preferences saved in database

### Phase 3 Advanced (1-2 hours)
1. Implement forecast caching
2. Add missing location endpoints
3. Test data migration

**Result:** Production-ready with optimization

---

## Testing Plan

### Unit Tests to Add
```python
# tests/test_models.py
def test_user_password_hashing():
    user = User(email='test@test.com')
    user.set_password('password')
    assert user.check_password('password')
    assert not user.check_password('wrong')

def test_forecast_json_serialization():
    f = Forecast(user_id=1)
    f.set_daily_predictions([{'day': 1, 'qty': 50}])
    assert f.get_daily_predictions() == [{'day': 1, 'qty': 50}]

# tests/test_api.py
def test_login_with_database():
    # Create test user
    user = User(email='test@test.com')
    user.set_password('test123')
    db.session.add(user)
    db.session.commit()
    
    # Test login
    response = client.post('/login', data={
        'email': 'test@test.com',
        'password': 'test123'
    })
    assert response.status_code == 302  # Redirect to dashboard
```

---

## Migration Script Template

```python
# migrate_csv_to_db.py
"""Migrate existing sales data from CSV to database"""

import pandas as pd
from app import app, db
from models import User, SalesRecord
from datetime import datetime

def migrate_csv_to_database():
    with app.app_context():
        # Get or create demo user
        user = User.query.filter_by(email='demo@restaurant.com').first()
        if not user:
            print("Demo user not found. Run init_db.py --seed-data first")
            return
        
        # Load CSV
        try:
            df = pd.read_csv('data/sales_data.csv')
        except FileNotFoundError:
            print("sales_data.csv not found")
            return
        
        df['date'] = pd.to_datetime(df['date'])
        
        # Import records
        count = 0
        for _, row in df.iterrows():
            # Check if already exists
            existing = SalesRecord.query.filter_by(
                user_id=user.id,
                ingredient=row['ingredient'],
                sale_date=row['date'].date()
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
        print(f"✓ Migrated {count} records from CSV to database")

if __name__ == '__main__':
    migrate_csv_to_database()
```

---

## Common Pitfalls to Avoid

### ❌ Don't
- Mix CSV and database reads in same request
- Forget to `db.session.commit()`
- Use in-memory variables instead of database
- Leave `users_db` dictionary in code
- Run queries outside of `with app.app_context():`

### ✅ Do
- Always query database for current data
- Test database changes immediately
- Use transactions (commit/rollback)
- Implement proper error handling
- Keep database schema documented

---

## Integration Testing Checklist

### Scenario 1: New User Registration
- [ ] User signs up via form
- [ ] Data saves to users, locations, alert_preferences tables
- [ ] User can log in immediately after signup
- [ ] Location preferences are remembered

### Scenario 2: Dashboard Display
- [ ] Dashboard loads without errors
- [ ] Sales metrics calculated from database
- [ ] Top ingredients list correct
- [ ] Sales trend chart renders

### Scenario 3: Forecast Generation
- [ ] User requests forecast
- [ ] System loads sales from database
- [ ] Forecast is generated
- [ ] Results saved to Forecast table
- [ ] Same forecast returned from cache (next 24 hours)

### Scenario 4: Alert Configuration
- [ ] User updates alert preferences
- [ ] Changes saved to database
- [ ] Email/SMS settings persisted
- [ ] Alert sent when stock is low

### Scenario 5: CSV Migration
- [ ] CSV data imported to database
- [ ] No duplicate records
- [ ] Data integrity verified
- [ ] CSV can be removed

---

## Deployment Checklist

### Development (SQLite)
- [ ] Database file created
- [ ] Tables created with init_db.py
- [ ] Sample data seeded
- [ ] All API endpoints working
- [ ] No CSV fallback needed

### Staging (PostgreSQL)
- [ ] Database created
- [ ] User credentials configured
- [ ] Tables initialized
- [ ] Sample data imported
- [ ] Performance tested

### Production (PostgreSQL)
- [ ] Separate database server
- [ ] Backups configured
- [ ] Monitoring enabled
- [ ] Connection pooling set up
- [ ] Load tested with real data

---

## Estimated Timeline

| Phase | Tasks | Time |
|-------|-------|------|
| 1 | API endpoints (3 critical) | 2-3h |
| 2 | Alert/location endpoints | 1-2h |
| 3 | Testing & documentation | 1-2h |
| 4 | Production deployment | 1-2h |
| **Total** | | **5-9h** |

---

## Quick Reference

### Start Fresh Database
```bash
rm restaurant_ai.db  # If SQLite
python init_db.py --reset --seed-data
python app.py
```

### Check Database Status
```bash
python init_db.py --info
```

### Test Specific Endpoint
```python
# In Python shell
from app import app, db
from models import User, SalesRecord

with app.app_context():
    users = User.query.all()
    sales = SalesRecord.query.count()
    print(f"Users: {len(users)}, Sales: {sales}")
```

---

## Support Resources

- **[DATABASE_SETUP.md](DATABASE_SETUP.md)** - Complete database guide
- **[models.py](models.py)** - Model definitions
- **[init_db.py](init_db.py)** - Database scripts
- **[DATABASE_INTEGRATION_STATUS.md](DATABASE_INTEGRATION_STATUS.md)** - Current status
- **[INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)** - Setup help

---

## Questions?

Key questions for implementation:
1. Should CSV remain as backup or be removed?
2. Should forecasts auto-expire after 24h or indefinitely?
3. Should alert history be pruned after N days?
4. Should we add Alembic migrations now or later?
5. PostgreSQL or stay with SQLite for now?

---

**Last Updated:** February 28, 2026
**Status:** Infrastructure Complete → Endpoints In Progress
