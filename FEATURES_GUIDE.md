# Features Guide

Comprehensive walkthrough of all features in Restaurant Inventory AI.

---

## Table of Contents

1. [Authentication & User Management](#authentication--user-management)
2. [Dashboard](#dashboard)
3. [Demand Forecasting](#demand-forecasting)
4. [Inventory Optimization](#inventory-optimization)
5. [Alert System](#alert-system)
6. [Location & Unit Conversion](#location--unit-conversion)
7. [Advanced Features](#advanced-features)

---

## Authentication & User Management

### Sign Up

**What it does:** Create a new restaurant user account with basic information.

**Steps:**
1. Click "Sign Up" on landing page
2. Enter:
   - First Name
   - Last Name
   - Email address
   - Password
   - Restaurant Name
   - Country (optional)
   - City (optional)
3. Click "Register"
4. Redirected to dashboard

**Features:**
- Email validation (basic)
- Country-aware unit standards automatic selection
- Location tracking (optional - uses browser geolocation)
- Secure session creation

**Example:**
```
Name: John Manager
Email: john@tonys-pizza.com
Password: SecurePass123!
Restaurant: Tony's Pizza
Country: US → Auto-selects lbs/fl oz/USD
```

### Log In

**What it does:** Authenticate with existing account and restore preferences.

**Steps:**
1. Click "Log In"
2. Enter email and password
3. Optional: Grant geolocation permission
4. Optional: Select country manually
5. Click "Sign In"

**Features:**
- Session management (maintains login across pages)
- Automatic location detection (if permitted)
- Unit standard restoration from previous session
- "Stay logged in" functionality

**Demo Credentials:**
```
Email: demo@restaurant.com
Password: demo123
```

### Guest Login

**What it does:** Try the application without creating account.

**Features:**
- Pre-populated with demo data
- Full access to all features
- Data not saved between sessions
- Perfect for testing

**Steps:**
1. Click "Continue as Guest"
2. Instant dashboard access

### OAuth2 Integration (Future)

Planned support for:
- Google Sign-In
- GitHub authentication
- Microsoft account integration

---

## Dashboard

### Overview

**What it shows:**
- Real-time sales metrics for last 7 days
- Top-selling ingredients by volume
- Total ingredients tracked
- Daily average sales
- Sales trend chart

### Key Metrics

#### Total Ingredients
- Count of unique ingredients in system
- Click to view full ingredient list

#### Total Sales (Last 7 Days)
- Sum of all ingredient quantities sold
- Measured in configured units (lbs/kg)

#### Daily Average
- Average per-day sales across 7 days
- Formula: Total Sales ÷ 7

#### Top Ingredients
- Bar chart showing best-selling ingredients
- By volume (quantity, not revenue)
- Click ingredient to see forecast

### Sales Trend Chart

**What it shows:** Line chart of daily sales over 7 days

**Features:**
- Hover for exact values
- Responsive sizing
- Auto-refreshes with new data
- Date labels on x-axis

**Example:**
```
Jan 21: 150.2 lbs
Jan 22: 165.3 lbs (↑ 10%)
Jan 23: 185.1 lbs (↑ 12%)
Jan 24: 175.8 lbs (↓ 5%)
...
```

### Add Sale Records

**What it does:** Manually record ingredient sales for testing.

**Steps:**
1. Choose ingredient from dropdown
2. Enter quantity sold
3. Date defaults to today
4. Click "Add Record"
5. Record saved to data/sales_data.csv

**Why:** Test forecasting without waiting for real sales data

**Example - Adding Tomato Sale:**
```
Ingredient: Tomato
Quantity: 50.5
Date: 2024-01-23 (today)
Unit: lbs (auto-detected from country)
```

### Data Refresh

**What it does:** Manually refresh dashboard data from CSV.

**When to use:**
- After adding sale records
- After updating sales_data.csv manually
- To troubleshoot data inconsistencies

**How:** Click "Refresh Data" button

---

## Demand Forecasting

### Overview

Restaurant Inventory AI uses advanced machine learning to predict ingredient demand 7-30 days in advance.

### How It Works

**Simple View:**
```
1. You select ingredient
2. AI analyzes historical sales
3. System picks best ML model
4. Generates demand prediction for next 7 days
5. Shows confidence level
```

**Technical View:**
- Multiple models evaluated: Prophet, ARIMA, LSTM, Exponential Smoothing
- Best model selected by confidence score
- Predictions include uncertainty bands
- Error metrics display model accuracy

### Using Forecast Feature

**Steps:**
1. Go to "Forecast" tab
2. Select ingredient from dropdown
3. Choose forecast period (1-30 days, default 7)
4. Click "Generate Forecast"
5. Wait for processing (10-30 seconds)
6. Results display with analysis

### Understanding Forecast Results

#### Model Information

**Example:**
```
Model Used: Prophet
Confidence: 92%
Daily Average: 48.5 units
Weekly Total: 340.2 units
```

**What confidence means:**
- 90%+ = Highly reliable, use for ordering decisions
- 80-90% = Good reliability, consider with caution
- 70-80% = Moderate, gather more data if possible
- <70% = Low confidence, use moving average instead

#### Daily Predictions

Shows predicted quantity for each day:

```
Day 1: 48.5 units ± 2.3 (45.2-50.8)
Day 2: 50.2 units ± 2.5 (47.7-52.7)
Day 3: 49.8 units ± 2.4 (47.4-52.2)
Day 4: 51.1 units ± 2.6 (48.5-53.7)
Day 5: 52.3 units ± 2.7 (49.6-55.0)
Day 6: 51.8 units ± 2.6 (49.2-54.4)
Day 7: 50.5 units ± 2.5 (48.0-53.0)
```

**Confidence Intervals:**
- Upper/lower bounds at 95% confidence
- Wider intervals = higher uncertainty
- Helpful for safety stock calculation

#### Error Metrics

**RMSE (Root Mean Square Error):**
- Lower is better
- Typical range: 1-5 units
- Penalizes large errors
- Use for comparing models

**MAE (Mean Absolute Error):**
- Average prediction error in units
- More interpretable than RMSE
- Lower is better

**Example:**
```
RMSE: 2.34 units
MAE: 1.87 units
= Model typically off by ~2 units
```

### Model Selection Logic

The system automatically chooses the best model:

```
IF historical_records >= 20:
  └─ Try LSTM (Deep Learning)
     └─ Best for: Complex, non-linear patterns
        └─ Confidence: Usually 85-95%

IF historical_records >= 10:
  └─ Try Prophet (Facebook's TSA)
     └─ Best for: Seasonal data, trend changes
        └─ Confidence: Usually 88-93%
     
  └─ Try ARIMA
     └─ Best for: Stationary time series
        └─ Confidence: Usually 80-90%
     
  └─ Try Exponential Smoothing
     └─ Best for: Smooth, consistent trends
        └─ Confidence: Usually 75-87%

IF historical_records < 10:
  └─ Use Moving Average
     └─ Best for: When data is limited
        └─ Confidence: 50-70% (use cautiously)

PICK: Model with highest confidence score
```

### Forecast Scenarios

#### Scenario 1: Seasonal Ingredient (Tomato)

**Data:** 
- High sales in summer
- Lower in winter
- Clear 12-month pattern

**Expected Model:** Prophet
**Expected Confidence:** 90%+
**Use Case:** Plan bulk orders for busy season

#### Scenario 2: Steady Ingredient (Olive Oil)

**Data:**
- Consistent daily usage
- Smooth trend
- No seasonal spikes

**Expected Model:** Exponential Smoothing
**Expected Confidence:** 85%+
**Use Case:** Automated regular ordering

#### Scenario 3: New Ingredient (Fresh Basil)

**Data:**
- Only 5 days of history
- Insufficient for advanced models
- High uncertainty

**Expected Model:** Moving Average
**Expected Confidence:** 55-65%
**Use Case:** Collect more data, use conservative estimates

---

## Inventory Optimization

### Reorder Point Calculation

**What it does:** Determines minimum stock level before reordering.

**Formula:**
```
Reorder Point = (Average Daily Demand × Lead Time) + Safety Stock

Where:
- Average Daily Demand = from forecast
- Lead Time = supplier delivery days (default 3)
- Safety Stock = buffer for demand variability
```

**Example - Tomato with 3-day lead time:**
```
Average Daily Demand: 48.5 units
Lead Time: 3 days
Demand During Lead Time: 48.5 × 3 = 145.5 units
Safety Stock (95% service): 42.3 units
Reorder Point: 145.5 + 42.3 = 187.8 units

Action: Order when stock < 188 units
```

### Recommended Order Quantity

**What it suggests:** How much to order each time.

**Formula:**
```
Order Quantity = Forecast Weekly Total + Safety Stock

Optimized for:
- Minimizing stockouts (95% service level)
- Reducing excess inventory
- Balancing warehouse space
```

**Example:**
```
Weekly Forecast: 340.2 units
Safety Stock: 42.3 units
Recommended Order: 382.5 units
```

### Low Stock Alerts

**What triggers them:** Automatic notification when stock drops below reorder point.

**Notifications:**
- Email alert
- SMS (if configured)
- Dashboard banner
- Optional webhook to external system

---

## Alert System

### Alert Channels

#### Email Alerts

**What:** Receives email when stock is low.

**Setup:**
1. Dashboard → Settings
2. Enable "Email Notifications"
3. Add email address
4. Click "Test Email"
5. Check inbox for test message

**Example Email:**
```
Subject: Low Stock Alert - Tomato

Hi John,

Current stock for Tomato is 50 units.
Reorder point is 145 units.

RECOMMENDED ACTION:
Order 200+ units immediately.

Forecast average: 48.5 units/day
Days until stockout: ~1 day

Click here to forecast: [link]

---
Restaurant Inventory AI
```

**Gmail Setup (if required):**
1. Enable 2-Factor Authentication on Google
2. Go to myaccount.google.com/apppasswords
3. Select Mail and Windows Computer
4. Copy 16-character password
5. Add to .env: `MAIL_PASSWORD=xxxx-xxxx-xxxx-xxxx`

#### SMS Alerts

**What:** Receives text message alert (requires Twilio).

**Setup:**
1. Create Twilio account (twilio.com)
2. Get Account SID and Auth Token
3. Add to .env:
   ```
   TWILIO_ACCOUNT_SID=AC...
   TWILIO_AUTH_TOKEN=...
   TWILIO_PHONE_NUMBER=+1-555-0100
   ```
4. In Dashboard → Settings → Enable SMS
5. Enter phone number (+1-555-0123 format)
6. Click "Test SMS"
7. Check your phone

**Example SMS:**
```
ALERT: Tomato stock low (50 units)
Reorder point: 145 units
Order now: www.resto-ai.com
```

### Alert Preferences

**What you can customize:**

| Setting | Options | Default |
|---------|---------|---------|
| Email Alerts | On/Off | On |
| SMS Alerts | On/Off | Off |
| Threshold % | 1-100% | 25% |
| Test Alert | Email/SMS | -- |

**Threshold % Explained:**
- 25% means alert when stock drops to 25% of reorder point
- Example: If reorder point is 200 units, alert at 50 units
- Lower = more sensitive, earlier warnings
- Higher = only critical alerts

### Check Stock & Alert

**What it does:** Manually check stock against reorder point and send alerts if needed.

**Steps:**
1. Go to ingredient page
2. Enter current stock quantity
3. Enter reorder point
4. Click "Check Stock"
5. If low: alerts are sent via configured channels

**API Example:**
```json
POST /api/alerts/check-stock
{
  "ingredient": "Tomato",
  "current_stock": 50.5,
  "reorder_point": 145.5
}

Response:
{
  "alert_triggered": true,
  "alerts_sent": ["email", "sms"],
  "message": "Low stock alert sent via email, sms"
}
```

### Test Alerts

**Why test?**
- Verify email configuration
- Check SMS setup
- Validate alert preferences
- Troubleshoot delivery issues

**How:**
1. Settings → Alert Preferences
2. Click "Test Email" or "Test SMS"
3. Check inbox/phone
4. If failed: Check .env credentials

---

## Location & Unit Conversion

### Location Detection

**What it does:** Auto-detects your location to set unit standards.

**On Sign Up:**
1. Browser requests location permission
2. Get latitude/longitude (if allowed)
3. Map to country code
4. Auto-select unit standards for that country

**Manual Country Selection:**
1. Settings → Location
2. Choose country from dropdown
3. Enter city (optional)
4. Save

**Supported Countries:**

| Country | Units | Currency |
|---------|-------|----------|
| US | lbs, fl oz | USD |
| GB | lbs, fl oz | GBP |
| CA | kg, ml | CAD |
| AU | kg, ml | AUD |
| IN | kg, ml | INR |
| DE | kg, ml | EUR |
| FR | kg, ml | EUR |
| JP | kg, ml | JPY |
| CN | kg, ml | CNY |
| MX | kg, ml | MXN |
| BR | kg, ml | BRL |

### Unit Conversion

**What it does:** Convert quantities between different unit systems.

**Supported Conversions:**

| From | To | Factor |
|------|----|----|
| lbs | kg | 0.454 |
| kg | lbs | 2.205 |
| fl oz | ml | 29.574 |
| ml | fl oz | 0.034 |

**How to Use:**
1. Go to Tools → Unit Converter
2. Enter value
3. Select from unit
4. Select to unit
5. Result shows instantly

**Example:**
```
100 lbs → kg
100 × 0.454 = 45.4 kg
```

**Why it matters:**
- Supplier in Europe? Order in kg
- Dashboard shows lbs? Easy conversion
- International franchises? Standardize by region

---

## Advanced Features

### Confidence Scoring

**What it means:** Probability forecast is accurate.

**Interpretation:**

| Score | Meaning | Action |
|-------|---------|--------|
| 95%+ | Excellent | Full trust, order confidently |
| 85-95% | Very Good | Use as primary forecast |
| 75-85% | Good | Cross-reference with manual review |
| 65-75% | Fair | Gather more data, conservative approach |
| <65% | Low | Use moving average, minimal history |

**How it's calculated:**
- Based on model fit to training data
- Multiple models compared
- Best performer selected
- Validated against error metrics

### Forecast Performance Metrics

#### RMSE (Root Mean Square Error)
```
RMSE = √(mean(observed - predicted)²)

Example: 2.34 units
Meaning: Forecast typically off by ±2.34 units
Use: Comparing models, assess accuracy
```

#### MAE (Mean Absolute Error)
```
MAE = mean(|observed - predicted|)

Example: 1.87 units
Meaning: Average error magnitude is 1.87 units
Use: Simple accuracy metric, easier to interpret
```

**When RMSE > MAE:**
- Indicates occasional large errors
- Consider safety stock accordingly

### Confidence Intervals

**What they show:** Range where actual demand will likely fall.

**Example:**
```
Day 1 Forecast: 50 units
95% Confidence Interval: 45-55 units

Meaning: 95% chance actual demand falls between 45-55
```

**Using for Safety Stock:**
```
If forecast = 50 units
And 95% upper bound = 55 units
Safety stock ≥ 5 units recommended
```

**Wider intervals indicate:**
- Higher uncertainty in forecast
- Less historical data
- More volatile demand pattern
- Need for larger safety margins

### Demand Patterns

#### Trend
- **Definition:** Long-term up/down movement
- **Example:** New restaurant growing sales (uptrend)
- **Forecast impact:** ARIMA and Prophet handle well

#### Seasonality
- **Definition:** Repeating pattern (daily, weekly, yearly)
- **Example:** Pizza sales peak on weekends
- **Forecast impact:** Prophet excellent, ARIMA good

#### Noise
- **Definition:** Random fluctuations
- **Example:** Unusual events, special promotions
- **Forecast impact:** Smoothing models help, outlier detection needed

#### Level Shift
- **Definition:** Sudden jumps up/down
- **Example:** New dish launch, menu change
- **Forecast impact:** Prophet auto-detects changepoints

### Export & Reports

**Current:** Results available on screen

**Future Features:**
- Export forecast to CSV
- Generate PDF reports
- Email forecast summaries
- Scheduled predictions (weekly/monthly)

---

## Mobile/Responsive Features

### Device Support

The application works on:
- **Desktop:** Full functionality
- **Tablet:** Responsive layout, touch-friendly
- **Mobile:** Core features, optimized UI

### Mobile Optimizations

- Vertical layout stacking
- Large touch-friendly buttons
- Minimized charts
- Fast loading (optimized assets)
- Offline capability (planned)

### Mobile Workflows

**Common On-the-Go Tasks:**
1. Check dashboard → verify stock
2. Request one-off forecast
3. Test alert configuration
4. View forecast results
5. Adjust alert thresholds

---

## Troubleshooting Features

### No Data Showing

**Problem:** Dashboard shows 0 ingredients, no sales history

**Solutions:**
1. Check `data/sales_data.csv` exists
2. Verify CSV format (date, ingredient, quantity_sold)
3. Click "Refresh Data"
4. Add sample data via "Add Sale Record"
5. Wait 30 seconds, refresh page

### Forecast Shows Low Confidence

**Problem:** Getting <70% confidence forecast

**Causes:**
- Insufficient historical data (<10 records)
- Inconsistent/noisy sales pattern
- Recent menu changes affecting demand

**Solutions:**
1. Collect more data (2-4 weeks minimum)
2. Use Moving Average temporarily
3. Manually review outliers in data
4. Consider external factors
5. Gather data separately for new ingredients

### Forecast "Insufficient Data" Error

**Problem:** Can't forecast ingredient

**Causes:**
- Less than 10 historical records

**Solutions:**
1. Add more sales records manually
2. Import data from POS system
3. Wait for organic sales to accumulate
4. Check spelling (case-sensitive)

### Email/SMS Not Sending

**Problem:** Test alert fails

**Troubleshooting:**

For Email:
1. Check .env has MAIL_USERNAME and MAIL_PASSWORD
2. Verify Gmail app password (not regular password)
3. Check 2FA enabled on Google account
4. Try different email provider (Office 365, etc)
5. Check spam folder

For SMS:
1. Verify Twilio account active
2. Check TWILIO_ACCOUNT_SID and AUTH_TOKEN in .env
3. Verify phone number in E.164 format: +1-555-0123
4. Check Twilio account has credits
5. Restart app after .env changes

### Model Selection Stuck

**Problem:** Forecast taking too long (>2 minutes)

**Causes:**
- LSTM model training with large dataset
- TensorFlow GPU not available

**Solutions:**
1. Wait (LSTM can take 60+ seconds)
2. Use fewer days of history
3. Disable LSTM in model.py
4. Upgrade system RAM

---

## Tips & Best Practices

### Demand Forecasting

1. **Quality Data:** Ensure sales data is accurate and consistent
2. **Minimum History:** Collect 20+ days before trusting forecasts
3. **Regular Updates:** Add sales daily for best predictions
4. **Review Alerts:** Tune threshold % based on actual stockouts
5. **Seasonal Adjustments:** Manually review seasonal peaks

### Inventory Management

1. **Safety Stock:** Start conservative (s-curves show range)
2. **Lead Time:** Verify exact supplier delivery times
3. **Order Timing:** Order when stock hits reorder point, not below
4. **Batch Adjustments:** Account for minimum order quantities
5. **Monitor Variance:** Compare predicted vs actual, adjust confidence

### Alert Configuration

1. **Email First:** Start with email before SMS
2. **Test Regularly:** Monthly test alerts ensure delivery
3. **Multi-Channel:** Use SMS for critical ingredients only
4. **Escalation:** Ensure someone checks alerts daily
5. **Threshold Tuning:** Start at 25%, adjust based on experience

### System Maintenance

1. **Weekly:** Check dashboard for data anomalies
2. **Monthly:** Test all alert channels
3. **Quarterly:** Review forecast accuracy
4. **Semiannually:** Update ingredient list
5. **Annually:** Archive old data, optimize database

---

## Glossary

| Term | Definition |
|------|-----------|
| **Forecast** | ML prediction of future ingredient demand |
| **Confidence** | Probability the forecast is accurate (%) |
| **Reorder Point** | Stock level triggering automatic order |
| **Safety Stock** | Buffer inventory for demand variability |
| **Lead Time** | Days between order and delivery |
| **RMSE** | Root Mean Square Error - model accuracy metric |
| **MAE** | Mean Absolute Error - average forecast error |
| **Seasonality** | Repeating demand pattern (daily/weekly/yearly) |
| **Trend** | Long-term up/down movement in demand |
| **Outlier** | Unusual unusually high/low sales event |
| **SMTP** | Email protocol for sending alerts |
| **ARIMA** | Statistical time series forecasting model |
| **Prophet** | Facebook's time series library |
| **LSTM** | Deep learning neural network for sequences |

---

## Feature Roadmap

Planned enhancements:

- [ ] **Inventory Tracking:** Real-time stock updates
- [ ] **Supplier Integration:** Auto-calculate lead times
- [ ] **Cost Analysis:** Revenue, COGS, profitability metrics
- [ ] **Batch Cooking:** Predict prep quantities
- [ ] **Waste Tracking:** Monitor spoilage and shrink
- [ ] **Mobile App:** Native iOS/Android
- [ ] **API Webhooks:** Real-time integrations
- [ ] **Multi-Location:** Manage chains
- [ ] **Staff Scheduling:** Correlate with demand
- [ ] **Competitor Analysis:** Market trend integration

---

For more help, see:
- [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md)
