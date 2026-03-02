# Forecast Enhancements Guide

## Overview

The forecasting system has been enhanced with three major features:

1. **Multi-Ingredient Batch Forecasting** - Forecast multiple ingredients simultaneously
2. **Flexible Time Horizons** - Select 7, 14, or 30-day forecast periods
3. **CSV Upload Training** - Upload custom historical data to improve model accuracy

---

## 1. Multi-Ingredient Batch Forecasting

### Feature Description

Generate forecasts for multiple ingredients in a single request, enabling efficient batch analysis and comparison across different items.

### How to Use

#### Via Web Interface

1. Navigate to the **Forecast** page
2. Hold **Ctrl** (Windows/Linux) or **Cmd** (Mac) to select multiple ingredients from the dropdown
3. Configure other parameters (stock levels, lead time, etc.)
4. Click **Generate Forecast**

The system displays:
- **Comparison Chart**: All ingredients plotted on the same graph
- **Individual Result Cards**: Separate cards showing stats, alerts, and reorder decisions for each ingredient

#### Via API

**Endpoint:** `POST /api/forecast-batch`

**Request Body:**
```json
{
  "ingredients": ["Tomatoes", "Lettuce", "Chicken Breast"],
  "days_ahead": 14,
  "current_stocks": {
    "Tomatoes": 50,
    "Lettuce": 30,
    "Chicken Breast": 100
  },
  "lead_time_days": 3,
  "service_level": 0.95
}
```

**Response:**
```json
{
  "success": true,
  "days_ahead": 14,
  "results": [
    {
      "ingredient": "Tomatoes",
      "success": true,
      "forecast": {
        "avg_daily": 12.5,
        "total_forecast": 175.0,
        "predictions": [12.1, 12.8, 13.2, ...],
        "upper_bound": [14.5, 15.2, ...],
        "lower_bound": [9.7, 10.4, ...],
        "model_used": "prophet",
        "confidence": 85
      },
      "decision": {
        "reorder_needed": false,
        "reorder_point": 45.2,
        "safety_stock": 15.8
      },
      "alerts": [
        {
          "message": "Stock levels adequate",
          "severity": "success"
        }
      ]
    },
    // ... results for other ingredients
  ]
}
```

### Benefits

- **Time Efficiency**: Forecast 10+ ingredients in one operation
- **Comparative Analysis**: Identify trends across multiple items
- **Resource Optimization**: Better inventory planning across product lines

---

## 2. Time Horizon Selector

### Feature Description

Choose forecast periods of 7, 14, or 30 days to match your planning cycle and supply chain requirements.

### How to Use

#### Via Web Interface

1. In the forecast form, locate the **Time Horizon** dropdown
2. Select your desired period:
   - **7 Days**: Short-term, high-accuracy forecasts
   - **14 Days**: Medium-term planning (default for most operations)
   - **30 Days**: Long-term strategic planning

#### Via API

**Single Ingredient** - `POST /api/forecast`
```json
{
  "ingredient": "Tomatoes",
  "days_ahead": 30,
  "current_stock": 50,
  "lead_time_days": 3,
  "service_level": 0.95
}
```

**Batch Forecast** - `POST /api/forecast-batch`
```json
{
  "ingredients": ["Tomatoes", "Lettuce"],
  "days_ahead": 14,
  "current_stocks": {"Tomatoes": 50, "Lettuce": 30}
}
```

### Model Behavior by Time Horizon

| Time Horizon | Best Model | Confidence | Use Case |
|--------------|-----------|------------|----------|
| 7 Days | ARIMA, Prophet | Very High (90-95%) | Daily operations, perishable goods |
| 14 Days | Prophet, LSTM | High (85-90%) | Weekly ordering cycles |
| 30 Days | Prophet, Exponential Smoothing | Good (75-85%) | Monthly planning, bulk orders |

### Confidence Intervals

Longer horizons automatically include:
- **Upper Bound**: Maximum expected demand (95th percentile)
- **Lower Bound**: Minimum expected demand (5th percentile)
- **Prediction Array**: Day-by-day forecast values

---

## 3. CSV Upload for Custom Training Data

### Feature Description

Upload historical sales data in CSV format to:
- Train models with your specific data
- Augment existing datasets
- Analyze new ingredients not in the system

### CSV Format Requirements

**Required Columns:**
- `date`: Date in YYYY-MM-DD format (e.g., 2024-01-15)
- `ingredient`: Ingredient name (string)
- `quantity_sold`: Numeric quantity (integer or float)

**Optional Columns:**
- `location`: Store/warehouse location (defaults to "Unknown")

**Example CSV:**
```csv
date,ingredient,quantity_sold,location
2024-01-01,Tomatoes,45,Main Warehouse
2024-01-02,Tomatoes,52,Main Warehouse
2024-01-03,Tomatoes,38,Main Warehouse
2024-01-01,Lettuce,30,Main Warehouse
2024-01-02,Lettuce,28,Main Warehouse
```

### How to Upload

#### Via Web Interface

1. Navigate to the **Forecast** page
2. Scroll to the **Upload Training Data** section
3. Click **Select CSV File** and choose your file
4. Click **Upload CSV**

**Success Response:**
- "CSV uploaded: 150 rows for 5 ingredients"
- Ingredients are automatically available in the forecast dropdown

#### Via API

**Endpoint:** `POST /api/upload-csv`

**Request:** Multipart form data with file

**Python Example:**
```python
import requests

with open('sales_data.csv', 'rb') as f:
    files = {'file': f}
    response = requests.post(
        'http://localhost:5000/api/upload-csv',
        files=files
    )
    print(response.json())
```

**cURL Example:**
```bash
curl -X POST http://localhost:5000/api/upload-csv \
  -F "file=@sales_data.csv"
```

**Response:**
```json
{
  "success": true,
  "message": "CSV uploaded and merged successfully",
  "rows_added": 150,
  "total_rows": 1250,
  "ingredients": ["Tomatoes", "Lettuce", "Chicken Breast", "Onions", "Peppers"]
}
```

### Data Merging Behavior

- **Duplicate Detection**: Rows with same `date`, `ingredient`, and `location` are identified
- **Conflict Resolution**: Newer uploads overwrite existing data
- **Sorting**: Data is automatically sorted by date
- **Persistence**: Merged data is saved to `data/sales_data.csv`

### Validation Rules

The system validates:
1. ✅ File is CSV format
2. ✅ Required columns present
3. ✅ `date` parseable to datetime
4. ✅ `quantity_sold` is numeric
5. ❌ Rejects files with missing columns
6. ❌ Rejects invalid date formats
7. ❌ Rejects non-numeric quantities

---

## API Reference

### Endpoints Summary

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/forecast` | POST | Single ingredient forecast |
| `/api/forecast-batch` | POST | Multiple ingredient forecasting |
| `/api/upload-csv` | POST | Upload training data |

### Common Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `ingredient(s)` | string/array | required | Item(s) to forecast |
| `days_ahead` | integer | 7 | Time horizon (7, 14, or 30) |
| `current_stock` | float | 0 | Current inventory level |
| `lead_time_days` | integer | 3 | Supplier delivery time |
| `service_level` | float | 0.95 | Stockout prevention level (0-1) |

---

## Model Updates

### Core Forecasting Functions

All forecasting functions now support variable time periods:

```python
# model.py

def forecast_arima(sales_data, periods=7):
    """ARIMA forecasting with configurable periods"""
    # Returns predictions array

def forecast_prophet(df, periods=7):
    """Prophet forecasting with confidence intervals"""
    # Returns predictions, upper_bound, lower_bound

def forecast_lstm(sales_data, periods=7):
    """LSTM neural network forecasting"""
    # Returns predictions array

def forecast_exponential_smoothing(sales_data, periods=7):
    """Holt-Winters exponential smoothing"""
    # Returns predictions array

def forecast_demand(ingredient_df, window=7, periods=7):
    """Main orchestrator - automatically selects best model"""
    # Returns complete forecast dict with all metrics
```

### Return Value Structure

```python
{
    "avg_daily": float,           # Average daily demand
    "total_forecast": float,      # Sum of all predictions
    "predictions": [float, ...],  # Day-by-day predictions
    "upper_bound": [float, ...],  # Upper confidence interval
    "lower_bound": [float, ...],  # Lower confidence interval
    "model_used": str,            # "prophet", "arima", "lstm", etc.
    "confidence": int             # 0-100 confidence score
}
```

---

## Frontend Updates

### JavaScript Modules

The forecast module (`static/modules/forecast.js`) now includes:

#### New Methods

- `handleForecastSubmit()`: Supports single and batch forecasting
- `handleCsvUpload()`: Manages file uploads with validation
- `displayBatchForecast()`: Renders multiple ingredient results
- `renderBatchForecastChart()`: Comparison chart for batch results
- `displayBatchResultCards()`: Individual result cards
- `displayDecision()`: Inventory decision display
- `displayAlerts()`: Alert badge rendering

#### Event Listeners

```javascript
// Multi-select ingredient handler
ingredientSelect.addEventListener('change', (e) => {
  if (ingredientSelect.multiple) {
    this.selectedIngredients = Array.from(e.target.selectedOptions)
      .map(opt => opt.value);
  }
});

// CSV upload handler
csvUploadBtn.addEventListener('click', () => this.handleCsvUpload());
```

---

## UI Components

### Batch Forecast Cards

Each ingredient result displays in a card with:
- **Ingredient Name** (header)
- **Statistics**: Average daily, total forecast
- **Reorder Status**: Visual indicator (green/yellow)
- **Alerts**: Colored badges for warnings/info

### Comparison Chart

Multi-ingredient chart features:
- **Color-coded lines** for each ingredient
- **Interactive legend** (click to show/hide)
- **Shared timeline** for direct comparison
- **Hover tooltips** with exact values

### CSV Upload Section

- **Drag-and-drop zone** (dashed border)
- **File format validation** (client + server)
- **Upload progress** indicator
- **Success summary** with row counts

---

## Examples

### Example 1: Weekly Meal Prep Planning

```javascript
// Forecast all main ingredients for next 7 days
const response = await fetch('/api/forecast-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingredients: ['Chicken Breast', 'Rice', 'Broccoli', 'Olive Oil'],
    days_ahead: 7,
    current_stocks: {
      'Chicken Breast': 20,
      'Rice': 50,
      'Broccoli': 15,
      'Olive Oil': 5
    },
    service_level: 0.98  // High confidence for main ingredients
  })
});
```

### Example 2: Monthly Inventory Review

```javascript
// Long-term forecast for bulk ordering
const response = await fetch('/api/forecast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingredient: 'Tomatoes',
    days_ahead: 30,
    current_stock: 100,
    lead_time_days: 7,  // Week-long supplier delivery
    service_level: 0.90
  })
});
```

### Example 3: Upload Historical Data

```python
import pandas as pd
import requests

# Generate sample data
data = {
    'date': pd.date_range('2024-01-01', periods=90, freq='D'),
    'ingredient': ['Tomatoes'] * 90,
    'quantity_sold': [30 + (i % 20) for i in range(90)],
    'location': ['Downtown'] * 90
}
df = pd.DataFrame(data)
df.to_csv('tomato_sales.csv', index=False)

# Upload
with open('tomato_sales.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:5000/api/upload-csv',
        files={'file': f}
    )
    print(response.json())
```

---

## Best Practices

### Time Horizon Selection

- **Perishables**: Use 7-day forecasts
- **Dry Goods**: 14-30 day forecasts acceptable
- **Seasonal Items**: 30-day for trend detection

### Batch Forecasting

- Limit to 10-15 ingredients per request for optimal performance
- Group related items (e.g., all vegetables, all proteins)
- Use consistent stock levels for comparable results

### CSV Uploads

- **Minimum Data**: At least 30 days of history recommended
- **Update Frequency**: Weekly uploads for dynamic markets
- **Data Quality**: Ensure consistent units and formats
- **Backup**: Keep original CSVs before merging

### Service Level Settings

| Stock Criticality | Service Level | Stockout Risk |
|-------------------|---------------|---------------|
| Essential (must-have) | 0.98-0.99 | 1-2% |
| Important | 0.95 | 5% |
| Normal | 0.90 | 10% |
| Surplus-prone | 0.85 | 15% |

---

## Troubleshooting

### Common Issues

**Issue**: "No data found for ingredient"
- **Solution**: Upload CSV with historical data for that ingredient

**Issue**: "days_ahead must be 7, 14, or 30"
- **Solution**: Use only supported time horizons

**Issue**: CSV upload fails with "Missing required columns"
- **Solution**: Ensure CSV has `date`, `ingredient`, and `quantity_sold` columns

**Issue**: Batch forecast returns some errors
- **Solution**: Check individual result objects; some ingredients may lack data

**Issue**: Confidence intervals too wide
- **Solution**: Upload more historical data or reduce time horizon

### Error Codes

| Code | Message | Solution |
|------|---------|----------|
| 400 | "Ingredient is required" | Provide at least one ingredient |
| 400 | "File must be a CSV" | Upload .csv files only |
| 404 | "No data found" | Check ingredient spelling or upload data |
| 500 | Server error | Check server logs, validate data format |

---

## Performance Considerations

### Batch Forecast Limits

- **Maximum Ingredients**: 50 per request (configurable)
- **Timeout**: 60 seconds default
- **Memory**: ~50MB for 30-day forecast of 20 ingredients

### Model Selection Priority

1. **Prophet**: Best for longer horizons (14-30 days)
2. **ARIMA**: Best for short-term (7 days)
3. **LSTM**: Data-intensive, requires 60+ days history
4. **Exponential Smoothing**: Fallback for limited data
5. **Moving Average**: Baseline when others fail

---

## Future Enhancements

Planned features:
- [ ] Custom time horizons (any number of days)
- [ ] Excel file upload support
- [ ] Automated CSV scheduling (daily data imports)
- [ ] Multi-location batch forecasting
- [ ] Forecast comparison (actual vs predicted)
- [ ] Model performance analytics
- [ ] Export forecast results to CSV/PDF

---

## Support

For issues or questions:
- Check API error responses for detailed messages
- Review browser console for frontend errors
- Examine Flask server logs for backend issues
- Refer to [API_DOCUMENTATION.md](API_DOCUMENTATION.md) for endpoint details
- See [FEATURES_GUIDE.md](FEATURES_GUIDE.md) for general usage

---

**Last Updated**: January 2024  
**Version**: 2.0.0  
**Author**: Development Team
