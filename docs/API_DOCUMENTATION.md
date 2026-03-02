# API Documentation

Complete reference for all REST API endpoints provided by Restaurant Inventory AI.

---

## Base URL

```
http://localhost:5000/api
```

All responses are in JSON format.

---

## Authentication

### Session-Based Authentication
All API endpoints except `/auth/*` require an active session:

```javascript
// Session established via POST /login or /signup
// Subsequent requests automatically include session cookie
```

---

## Endpoints Reference

### 1. Ingredients

#### Get All Ingredients
```http
GET /api/ingredients
```

**Auth Required:** Yes

**Response:**
```json
{
  "ingredients": [
    "Tomato",
    "Mozzarella",
    "Basil",
    "Olive Oil"
  ],
  "count": 4
}
```

**Error Responses:**
- `404`: User not found
- `500`: Server error

---

### 2. Dashboard

#### Get Dashboard Statistics
```http
GET /api/dashboard-stats
```

**Auth Required:** Yes

**Response:**
```json
{
  "total_ingredients": 12,
  "total_sales_7days": 1250.5,
  "daily_average": 178.64,
  "top_ingredients": [
    {
      "ingredient": "Tomato",
      "quantity": 450.2,
      "percentage": 36.0
    },
    {
      "ingredient": "Mozzarella",
      "quantity": 320.1,
      "percentage": 25.6
    }
  ],
  "sales_trend": [
    {"date": "2024-01-21", "sales": 150.2},
    {"date": "2024-01-22", "sales": 165.3},
    {"date": "2024-01-23", "sales": 185.1}
  ]
}
```

**Query Parameters:** None

**Error Responses:**
- `404`: User not found
- `500`: Error reading sales data

---

### 3. Forecasting

#### Request Forecast
```http
POST /api/forecast
```

**Auth Required:** Yes

**Request Body:**
```json
{
  "ingredient": "Tomato",
  "days": 7
}
```

**Response:**
```json
{
  "success": true,
  "forecast": {
    "ingredient": "Tomato",
    "model_used": "Prophet",
    "confidence": 0.92,
    "daily_predictions": [
      {"day": 1, "quantity": 48.5},
      {"day": 2, "quantity": 50.2},
      {"day": 3, "quantity": 49.8}
    ],
    "weekly_total": 340.2,
    "error_metrics": {
      "rmse": 2.34,
      "mae": 1.87
    },
    "confidence_intervals": {
      "upper_95": [50.2, 52.1, 51.8],
      "lower_95": [46.8, 48.3, 47.8]
    }
  },
  "inventory_optimization": {
    "current_stock": 0,
    "reorder_point": 145.5,
    "safety_stock": 42.3,
    "recommended_order_qty": 200
  }
}
```

**Request Parameters:**
| Parameter | Type | Required | Default | Notes |
|-----------|------|----------|---------|-------|
| ingredient | string | Yes | - | Ingredient name |
| days | integer | No | 7 | Forecast days (1-30) |

**Error Responses:**
- `400`: Invalid ingredients or missing data
- `404`: User not found
- `500`: ML model error

**Model Selection Logic:**
- LSTM: Best for complex patterns (len >= 20)
- Prophet: Best for seasonal data (len >= 10)
- ARIMA: For AR models (len >= 10)
- Exp Smoothing: Balanced approach (len >= 10)
- Moving Avg: Fallback (any length)

---

### 4. Ingredient History

#### Get Ingredient Sales History
```http
GET /api/ingredient-history/<ingredient>
```

**Auth Required:** Yes

**URL Parameters:**
| Parameter | Type | Required | Notes |
|-----------|------|----------|-------|
| ingredient | string | Yes | Ingredient name (URL encoded) |

**Query Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| days | integer | 30 | Historical days to retrieve |
| group_by | string | daily | Grouping: daily, weekly, monthly |

**Response:**
```json
{
  "ingredient": "Tomato",
  "history": [
    {
      "date": "2024-01-01",
      "quantity": 50.5,
      "price_per_unit": 0.75,
      "total_spent": 37.88
    },
    {
      "date": "2024-01-02",
      "quantity": 48.3,
      "price_per_unit": 0.75,
      "total_spent": 36.23
    }
  ],
  "stats": {
    "total_quantity": 1450.2,
    "average_daily": 48.3,
    "min_daily": 35.2,
    "max_daily": 62.1
  }
}
```

**Error Responses:**
- `404`: User not found or ingredient not found
- `500`: Data retrieval error

---

### 5. Location & Units

#### Get User Location
```http
GET /api/user/location
```

**Auth Required:** Yes

**Response:**
```json
{
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
  }
}
```

---

#### Set Location Country
```http
POST /api/location/country
```

**Auth Required:** Yes

**Request Body:**
```json
{
  "country": "CA",
  "city": "Toronto",
  "latitude": 43.6532,
  "longitude": -79.3832
}
```

**Response:**
```json
{
  "success": true,
  "country": "CA",
  "units": {
    "weight": "kg",
    "volume": "ml",
    "currency": "CAD"
  },
  "saved": true
}
```

**Supported Countries:**
```
US, GB, CA, AU, IN, DE, FR, JP, CN, MX, BR
```

**Unit Standards by Country:**
| Country | Weight | Volume | Currency |
|---------|--------|--------|----------|
| US, GB | lbs | fl oz | USD/GBP |
| CA, AU, IN, DE, FR, JP, CN, MX, BR | kg | ml | CAD/AUD/INR/EUR/JPY/CNY/MXN/BRL |

---

#### Convert Units
```http
POST /api/convert-units
```

**Auth Required:** Yes

**Request Body:**
```json
{
  "value": 100,
  "from_unit": "lbs",
  "to_unit": "kg"
}
```

**Response:**
```json
{
  "original": {
    "value": 100,
    "unit": "lbs"
  },
  "converted": {
    "value": 45.36,
    "unit": "kg"
  },
  "conversion_factor": 0.453592
}
```

**Supported Unit Conversions:**
| From | To | Factor |
|------|----|---------| 
| lbs | kg | 0.453592 |
| kg | lbs | 2.20462 |
| fl oz | ml | 29.5735 |
| ml | fl oz | 0.033814 |

---

### 6. Alerts Management

#### Get Alert Preferences
```http
GET /api/alerts/preferences
```

**Auth Required:** Yes

**Response:**
```json
{
  "preferences": {
    "email": {
      "enabled": true,
      "email_address": "manager@restaurant.com"
    },
    "sms": {
      "enabled": false,
      "phone_number": "+1-555-0123"
    },
    "threshold_percentage": 25,
    "reorder_point_auto_calculate": true
  }
}
```

---

#### Update Alert Preferences
```http
POST /api/alerts/preferences
```

**Auth Required:** Yes

**Request Body:**
```json
{
  "email_enabled": true,
  "sms_enabled": true,
  "phone_number": "+1-555-0123",
  "threshold_percentage": 20,
  "reorder_point_auto": true
}
```

**Response:**
```json
{
  "success": true,
  "preferences": {
    "email": true,
    "sms": true,
    "threshold_percentage": 20,
    "message": "Preferences updated successfully"
  }
}
```

**Parameters:**
| Parameter | Type | Default | Notes |
|-----------|------|---------|-------|
| email_enabled | boolean | true | Enable email alerts |
| sms_enabled | boolean | false | Enable SMS alerts (requires Twilio setup) |
| phone_number | string | null | Phone for SMS (E.164 format) |
| threshold_percentage | integer | 25 | Low stock threshold (1-100) |
| reorder_point_auto | boolean | true | Auto-calculate reorder points |

**Error Responses:**
- `400`: Invalid phone number format
- `404`: User not found
- `500`: Save preferences error

---

#### Send Test Alert
```http
POST /api/alerts/test
```

**Auth Required:** Yes

**Request Body:**
```json
{
  "channel": "email"
}
```

**Response - Success:**
```json
{
  "success": true,
  "channel": "email",
  "message": "Test alert sent successfully to manager@restaurant.com"
}
```

**Response - Configuration Error:**
```json
{
  "success": false,
  "error": "Failed to send test email alert. Check configuration."
}
```

**Supported Channels:**
- `email`: SMTP email alert
- `sms`: Twilio SMS message

**Typical Errors:**
- Email not configured (MAIL_USERNAME/MAIL_PASSWORD missing)
- Twilio credentials invalid (TWILIO_ACCOUNT_SID/AUTH_TOKEN missing)
- Invalid phone number format
- Rate limited (if testing too frequently)

---

#### Check Stock and Alert
```http
POST /api/alerts/check-stock
```

**Auth Required:** Yes

**Request Body:**
```json
{
  "ingredient": "Tomato",
  "current_stock": 50.5,
  "reorder_point": 145.5
}
```

**Response - Alert Triggered:**
```json
{
  "success": true,
  "alert_triggered": true,
  "alerts_sent": ["email", "sms"],
  "message": "Low stock alert sent via email, sms"
}
```

**Response - Stock Sufficient:**
```json
{
  "success": true,
  "alert_triggered": false,
  "message": "Stock level is sufficient"
}
```

**Error Responses:**
- `404`: User not found
- `500`: Alert sending failed

---

## Error Handling

### Standard Error Response Format
```json
{
  "success": false,
  "error": "Description of what went wrong"
}
```

### HTTP Status Codes

| Code | Meaning | Example |
|------|---------|---------|
| 200 | Success | Forecast retrieved |
| 400 | Bad request | Missing required parameter |
| 401 | Unauthorized | Not logged in |
| 404 | Not found | User/ingredient not found |
| 500 | Server error | ML model crashed |

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| "User not found" | Not logged in or session expired | Redirect to login |
| "Invalid ingredients" | Ingredient has no data | Ensure data in sales_data.csv |
| "Insufficient data" | Less than 10 records | Collect more history |
| "ML model error" | Forecast calculation failed | Retry or use simpler model |
| "SMTP configuration error" | Email config missing | Set MAIL_* environment vars |
| "Invalid phone format" | SMS number invalid | Use E.164: +1-555-0123 |

---

## Request/Response Examples

### Complete Forecast Flow

**1. User Logs In:**
```bash
curl -X POST http://localhost:5000/login \
  -d "email=manager@resto.com&password=pass123&country=US"
```

**2. Get Dashboard Data:**
```bash
curl http://localhost:5000/api/dashboard-stats \
  -b "session=<cookie>"
```

**3. Request Forecast:**
```bash
curl -X POST http://localhost:5000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient": "Tomato",
    "days": 7
  }' \
  -b "session=<cookie>"
```

**4. Configure Alerts:**
```bash
curl -X POST http://localhost:5000/api/alerts/preferences \
  -H "Content-Type: application/json" \
  -d '{
    "email_enabled": true,
    "threshold_percentage": 20
  }' \
  -b "session=<cookie>"
```

**5. Send Test Alert:**
```bash
curl -X POST http://localhost:5000/api/alerts/test \
  -H "Content-Type: application/json" \
  -d '{"channel": "email"}' \
  -b "session=<cookie>"
```

---

## Rate Limiting Guidelines

**Current Implementation:** None (development version)

**Recommended Production Limits:**
- Forecast endpoint: 10 requests/minute per user
- Dashboard stats: 30 requests/minute per user
- Alert checks: 20 requests/minute per user
- General API: 100 requests/minute per user

---

## Pagination

**Current Implementation:** No pagination (all data returned)

**Recommended for Production:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "page_size": 50,
    "total": 250,
    "total_pages": 5
  }
}
```

---

## API Versioning

**Current Version:** v1 (implicit)

**Future:** `/api/v2/forecast`, `/api/v2/ingredients`

---

## Webhooks (Future Feature)

Planned webhook support for:
- Stock level changes
- Forecast updates
- Alert triggers
- Data import completion

```http
POST https://your-webhook-endpoint.com/inventory-alert
X-Signature: sha256=<hmac>

{
  "event": "low_stock",
  "ingredient": "Tomato",
  "current_stock": 50.5,
  "reorder_point": 145.5,
  "timestamp": "2024-01-23T14:30:00Z"
}
```

---

## SDK/Client Libraries

### JavaScript (Browser)
```javascript
// See static/dashboard.js for AJAX examples
fetch('/api/forecast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ ingredient: 'Tomato', days: 7 })
})
.then(r => r.json())
.then(data => console.log(data));
```

### Python
```python
import requests

session = requests.Session()
session.post('http://localhost:5000/login', 
  data={'email': 'user@resto.com', 'password': 'pass'})

response = session.post('http://localhost:5000/api/forecast',
  json={'ingredient': 'Tomato', 'days': 7})
print(response.json())
```

---

## Support & Troubleshooting

See [FEATURES_GUIDE.md](FEATURES_GUIDE.md) for feature-specific help.

For API-specific issues:
1. Check browser console (F12) for JavaScript errors
2. Review server logs in terminal
3. Verify authentication (check cookies)
4. Validate JSON in request body
5. Check environment variables for service credentials
