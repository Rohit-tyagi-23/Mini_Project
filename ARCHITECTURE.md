# Architecture Overview

## System Design

Restaurant Inventory AI is built with a modern, scalable architecture designed for production environments.

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                             │
│  (HTML/CSS/JavaScript - Flask Templates)                        │
│  - Landing Page  - Dashboard  - Forecast  - Results             │
└────────────────────────────┬────────────────────────────────────┘
                             │
                             ↓
┌─────────────────────────────────────────────────────────────────┐
│                     APPLICATION LAYER                           │
│                      (Flask Web Server)                         │
│  - Request Routing  - Session Management  - Authentication      │
│  - User Management  - Data Validation  - Business Logic         │
└────────┬──────────────┬──────────────┬─────────────┬────────────┘
         │              │              │             │
    ┌────▼──┐      ┌────▼──┐     ┌────▼──┐     ┌────▼──┐
    │ ML    │      │ Alert │     │ Unit  │     │ Auth  │
    │ Models│      │System │     │Convert│     │System │
    └────┬──┘      └────┬──┘     └────┬──┘     └────┬──┘
         │              │              │             │
         └──────────────┼──────────────┼─────────────┘
                        ↓
         ┌──────────────────────────────┐
         │      DATA PERSISTENCE        │
         │  (CSV Files + In-Memory DB)  │
         │  - sales_data.csv            │
         │  - User Database             │
         │  - Alert Preferences         │
         └──────────────────────────────┘
```

---

## Core Components

### 1. **Frontend Layer** (`templates/` & `static/`)

#### Templates
- **landing.html**: Public landing page with feature overview
- **login.html**: User authentication interface
- **signup.html**: New user registration
- **dashboard.html**: Real-time inventory dashboard
- **forecast.html**: Forecasting configuration interface
- **result.html**: ML forecast results display
- **index.html**: Fallback/home template

#### Static Assets
- **style.css**: Primary styling and responsive design
- **theme.js**: Dark/light mode toggle functionality
- **auth.js**: Authentication and session handling
- **dashboard.js**: Dashboard data fetching and rendering
- **forecast.js**: Forecast request and processing
- **alerts.js**: Alert configuration and management
- **location.js**: Geographic location detection and unit conversion

**Key Features:**
- Responsive Bootstrap-based design
- Real-time chart updates (Chart.js)
- Geolocation API integration
- Local storage for theme preferences
- AJAX/Fetch API for seamless interactions

---

### 2. **Application Layer** (`app.py`)

The Flask application handles all business logic and HTTP routing.

#### Authentication & Session Management
- Session-based user authentication
- OAuth2 integration ready (Google, GitHub)
- Guest mode for demo access
- Simple browser session detection
- Location-aware unit standards

#### API Routes (20+ endpoints)
See [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for complete reference.

#### Key Functions
```python
@app.route("/api/forecast", methods=["POST"])
# Triggers ML model ensemble for demand prediction

@app.route("/api/dashboard-stats", methods=["GET"])
# Returns current inventory metrics and sales trends

@app.route("/api/alerts/preferences", methods=["GET", "POST"])
# Manages user notification preferences

@app.route("/api/convert-units", methods=["POST"])
# Converts between unit standards (lbs/kg, fl oz/ml, etc)
```

---

### 3. **Machine Learning Layer** (`model.py`)

Advanced ensemble forecasting with automatic model selection.

#### Supported Models

| Model | Algorithm | Best For | Speed | Accuracy |
|-------|-----------|----------|-------|----------|
| **Prophet** | Additive time series | Seasonal data | Medium | High |
| **ARIMA** | AutoRegressive Integrated Moving Avg | Stationary series | Fast | Medium-High |
| **LSTM** | Deep Neural Network | Complex patterns | Slow | High |
| **Exp Smoothing** | Holt-Winters method | Trend data | Fast | Medium |
| **Moving Average** | Simple averaging | Minimal data | Instant | Low |

#### Workflow

```
Sales Data (CSV)
      │
      ↓
┌─────────────────────────────────────────┐
│   Data Preprocessing & Validation       │
│   - Date parsing  - Outlier handling    │
│   - Missing value imputation            │
└──────────┬────────────────────────────┘
           │
           ↓ (len >= 20)
    ┌──────────────────┐
    │   LSTM Model     │─── Confidence Score
    └──────────────────┘
           │
           ├─────────────┐
           ↓             ↓ (len >= 10)
      ┌────────┐    ┌─────────────┐
      │Prophet │    │ARIMA/ExpSmth│─── Confidence Scores
      └────────┘    └─────────────┘
           │             │
           └─────┬───────┘
                 ↓
    ┌────────────────────────────┐
    │  Ensemble Selection        │
    │  (Pick best confidence)    │
    └──────────┬────────────────┘
               ↓
    ┌────────────────────────────┐
    │  Generate Predictions      │
    │  - Daily forecast          │
    │  - Weekly aggregate        │
    │  - Confidence intervals    │
    │  - Error metrics (RMSE/MAE)│
    └────────────────────────────┘
```

#### Key Functions

**forecast_demand(ingredient, days=7)**
- Ensemble forecasting with automatic model selection
- Returns daily and weekly predictions
- Includes 95% confidence intervals

**optimize_inventory(forecast, lead_time=3, service_level=0.95)**
- Calculates reorder point: `(avg_daily_demand × lead_time) + safety_stock`
- Safety stock: `z_score × std_dev × sqrt(lead_time)`
- Recommended order quantity based on EOQ model

**calculate_error_metrics(actual, predicted)**
- RMSE: Root Mean Square Error
- MAE: Mean Absolute Error
- Returns model performance for display

**calculate_confidence_intervals(predictions, confidence=0.95)**
- Generates upper/lower bounds
- Shows forecast uncertainty
- Helps with decision-making

---

### 4. **Alert System** (`alerts.py`)

Multi-channel notification system for inventory events.

#### Supported Channels
- **Email**: SMTP via Gmail/custom server
- **SMS**: Twilio integration
- **Dashboard**: In-app notifications (future)

#### Architecture

```
User Trigger (Low Stock / Manual Test)
       │
       ↓
┌──────────────────────────────────┐
│   Alert Manager (init_alerts())  │
│   - Email service                │
│   - SMS service (Twilio)         │
└────────────┬─────────────────────┘
             │
    ┌────────┼────────┐
    ↓        ↓        ↓
┌─────┐ ┌───────┐ ┌─────┐
│Email│ │  SMS  │ │ Test│
└─────┘ └───────┘ └─────┘
    │        │        │
    └────────┼────────┘
             ↓
    ┌──────────────────┐
    │ User Preference  │
    │ Filters          │
    └──────────────────┘
             ↓
    ┌──────────────────┐
    │ Send Notification│
    └──────────────────┘
```

#### Key Functions

**send_low_stock_alert(user_data, ingredient, current_stock, reorder_point, preferences)**
- Triggered when inventory drops below reorder point
- Respects user channel preferences
- Tracks alert history

**send_test_alert(user_data, channel)**
- Tests alert configuration
- Validates credentials
- Helps troubleshooting

---

## Data Model

### User Database (In-Memory)
```json
{
  "email@restaurant.com": {
    "password": "hashed_password",
    "name": "John Manager",
    "restaurant": "Tony's Pizza",
    "location": {
      "country": "US",
      "city": "New York",
      "latitude": 40.7128,
      "longitude": -74.0060
    },
    "units": {
      "weight": "lbs",
      "volume": "fl oz",
      "currency": "USD"
    },
    "alert_preferences": {
      "email": true,
      "sms": false,
      "threshold_percentage": 25
    }
  }
}
```

### Sales Data (CSV Format)
```csv
date,ingredient,quantity_sold
2024-01-01,Tomato,50.5
2024-01-01,Mozzarella,30.2
2024-01-02,Tomato,48.3
```

---

## Data Flow - Example: Forecast Request

```
1. User Login
   └─ POST /login
      └─ Save location + units to session

2. Navigate to Dashboard
   └─ GET /dashboard
      └─ Render dashboard.html

3. Request Forecast
   └─ POST /api/forecast
      ├─ Extract sales_data.csv
      ├─ Filter by ingredient
      ├─ Validate data (min 10 records)
      └─ Return to model.py

4. ML Processing
   └─ forecast_demand(ingredient, periods=7)
      ├─ Try LSTM (if len >= 20)
      ├─ Try Prophet (if len >= 10)
      ├─ Try ARIMA (if len >= 10)
      ├─ Try Exponential Smoothing (if len >= 10)
      ├─ Try Moving Average (fallback)
      └─ Select best by confidence score

5. Inventory Optimization
   └─ optimize_inventory(forecast_data)
      ├─ Calculate reorder point
      ├─ Calculate safety stock
      ├─ Calculate optimal order qty
      └─ Generate alerts if needed

6. Return Results
   └─ POST /result (render results.html)
      ├─ Display forecast chart
      ├─ Show error metrics
      ├─ Show confidence intervals
      ├─ Suggest reorder points
      └─ Link to alert configuration
```

---

## Scalability & Future Architecture

### Current Limitations
- In-memory user database (not persistent)
- Single-file CSV data storage
- No distributed processing

### Recommended Production Upgrades

1. **Database Layer**
   - Replace in-memory dict with PostgreSQL/MongoDB
   - Implement proper ORM (SQLAlchemy)
   - Add data migration scripts

2. **Caching Layer**
   - Redis for session management
   - Cache forecast results (TTL: 1 hour)
   - Cache user preferences

3. **Job Queue**
   - Celery for async forecast jobs
   - Scheduled alerts via APScheduler
   - Background data validation

4. **API Gateway**
   - Authentication middleware
   - Rate limiting
   - Request logging

5. **Infrastructure**
   - Docker containerization
   - Kubernetes orchestration
   - Multi-region deployment

---

## Technology Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| **Web Framework** | Flask | 3.0+ |
| **Frontend** | HTML5/CSS3/JavaScript | ES6+ |
| **Data Processing** | Pandas | 1.3+ |
| **ML/Statistics** | scikit-learn, TensorFlow | Latest |
| **Time Series** | Prophet, statsmodels | Latest |
| **Deep Learning** | Keras/TensorFlow | 2.10+ |
| **Notifications** | Flask-Mail, Twilio | Latest |
| **Environment** | Python | 3.10+ |

---

## Security Considerations

### Implemented
- Session-based authentication
- CSRF protection via Flask sessions
- Environment variable configuration (.env)
- Input validation on forms

### Recommendations for Production
- Implement JWT tokens with expiration
- Add HTTPS/SSL enforcement
- Database password hashing (bcrypt/argon2)
- Rate limiting on API endpoints
- CORS policy configuration
- SQL injection prevention (use ORM)
- XSS prevention (template auto-escaping enabled)

---

## Deployment

See [INSTALLATION_GUIDE.md](INSTALLATION_GUIDE.md) for:
- Local development setup
- Production deployment
- Docker containerization
- Environment configuration
