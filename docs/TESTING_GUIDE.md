# Testing Guide: Forecast Enhancements

## Quick Test Checklist

### ✅ Prerequisites
- [ ] Flask server running (`python app.py`)
- [ ] Browser open to http://localhost:5000
- [ ] Logged in to the application
- [ ] Sample CSV file prepared (optional)

---

## Test 1: Time Horizon Selector (7/14/30 Days)

### Steps
1. Navigate to `/forecast` page
2. Select **one ingredient** from the dropdown
3. Change **Time Horizon** to each option:
   - 7 Days
   - 14 Days
   - 30 Days
4. Click **Generate Forecast** for each

### Expected Results
- ✅ Chart shows correct number of forecast days
- ✅ Table shows matching number of rows
- ✅ Predictions array length matches time horizon
- ✅ Response includes `days_ahead` field

### API Test (cURL)
```bash
# 30-day forecast
curl -X POST http://localhost:5000/api/forecast \
  -H "Content-Type: application/json" \
  -d '{
    "ingredient": "Tomatoes",
    "days_ahead": 30,
    "current_stock": 50,
    "lead_time_days": 3,
    "service_level": 0.95
  }'
```

### Success Criteria
- Response contains `"days_ahead": 30`
- `predictions` array has 30 elements
- Chart displays 30 future data points

---

## Test 2: Multi-Ingredient Batch Forecasting

### Steps
1. Go to `/forecast` page
2. **Hold Ctrl** (Windows/Linux) or **Cmd** (Mac)
3. Click **3-5 different ingredients** to select multiple
4. Set Time Horizon to **14 Days**
5. Click **Generate Forecast**

### Expected Results
- ✅ Comparison chart shows all selected ingredients
- ✅ Individual result cards display for each ingredient
- ✅ Each card shows avg daily, total, reorder status
- ✅ Success message: "Forecast generated for X ingredients"

### API Test (JavaScript Console)
```javascript
fetch('/api/forecast-batch', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingredients: ['Tomatoes', 'Lettuce', 'Chicken Breast'],
    days_ahead: 14,
    current_stocks: {
      'Tomatoes': 50,
      'Lettuce': 30,
      'Chicken Breast': 100
    },
    lead_time_days: 3,
    service_level: 0.95
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

### Success Criteria
- Response has `results` array with 3 objects
- Each result has `ingredient`, `forecast`, `decision`, `alerts`
- All ingredients plotted on same chart

---

## Test 3: CSV Upload

### Sample CSV File
Create `test_sales.csv` with this content:

```csv
date,ingredient,quantity_sold,location
2024-01-01,Avocado,25,Main Kitchen
2024-01-02,Avocado,30,Main Kitchen
2024-01-03,Avocado,28,Main Kitchen
2024-01-04,Avocado,35,Main Kitchen
2024-01-05,Avocado,22,Main Kitchen
2024-01-06,Avocado,40,Main Kitchen
2024-01-07,Avocado,33,Main Kitchen
2024-01-08,Avocado,29,Main Kitchen
2024-01-09,Avocado,31,Main Kitchen
2024-01-10,Avocado,27,Main Kitchen
2024-01-11,Avocado,38,Main Kitchen
2024-01-12,Avocado,32,Main Kitchen
2024-01-13,Avocado,26,Main Kitchen
2024-01-14,Avocado,34,Main Kitchen
2024-01-15,Avocado,30,Main Kitchen
```

### Steps
1. Navigate to `/forecast` page
2. Scroll to **Upload Training Data** section
3. Click **Select CSV File**
4. Choose `test_sales.csv`
5. Click **Upload CSV**

### Expected Results
- ✅ Success message appears
- ✅ Message shows row count and ingredient list
- ✅ "Avocado" now appears in ingredient dropdown
- ✅ Can generate forecast for "Avocado"

### API Test (Python)
```python
import requests

with open('test_sales.csv', 'rb') as f:
    response = requests.post(
        'http://localhost:5000/api/upload-csv',
        files={'file': f}
    )
    print(response.json())
```

### Success Criteria
- Status code: 200
- Response: `{"success": true, "rows_added": 15, ...}`
- Data merged into `data/sales_data.csv`

---

## Test 4: Combined Workflow

### Steps
1. **Upload CSV** with new ingredient (e.g., "Salmon")
2. **Select multiple ingredients** including new one
3. Set **Time Horizon to 30 days**
4. **Generate batch forecast**

### Expected Results
- ✅ New ingredient included in forecast
- ✅ 30-day predictions for all items
- ✅ Comparison chart with all lines
- ✅ Individual cards with alerts

---

## Test 5: Error Handling

### Test 5.1: Invalid Time Horizon
```javascript
fetch('/api/forecast', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    ingredient: 'Tomatoes',
    days_ahead: 20  // Invalid (not 7, 14, or 30)
  })
})
.then(r => r.json())
.then(data => console.log(data));
```

**Expected:** `{"success": false, "error": "days_ahead must be 7, 14, or 30"}`

### Test 5.2: Missing Required Columns in CSV
Create `bad.csv`:
```csv
date,item,sold
2024-01-01,Tomatoes,50
```

Upload this file.

**Expected:** Error message about missing `ingredient` or `quantity_sold` column

### Test 5.3: No Ingredients Selected
1. Don't select any ingredients
2. Click **Generate Forecast**

**Expected:** Warning: "Please select at least one ingredient"

---

## Test 6: Visual Validation

### Chart Tests
- [ ] Historical data shown in gray
- [ ] Forecast shown in blue
- [ ] Upper/lower bounds shown as dashed lines
- [ ] Legend toggles lines on/off
- [ ] Hover shows exact values
- [ ] X-axis shows dates
- [ ] Y-axis shows quantities

### Card Tests (Batch Forecast)
- [ ] Each ingredient has separate card
- [ ] Cards show avg daily and total
- [ ] Reorder status color-coded (green/yellow)
- [ ] Alert badges display correctly
- [ ] Cards have hover effect

### Table Tests
- [ ] Dates in first column
- [ ] Predictions show 2 decimal places
- [ ] Upper/lower bounds displayed
- [ ] Rows match time horizon count

---

## Test 7: Performance

### Batch Forecast Performance
Test with increasing ingredient counts:

| Ingredients | Time Horizon | Expected Time |
|-------------|--------------|---------------|
| 1 | 7 days | < 1 second |
| 5 | 14 days | < 3 seconds |
| 10 | 30 days | < 5 seconds |

### CSV Upload Performance
| File Size | Rows | Expected Time |
|-----------|------|---------------|
| < 10 KB | 100 | < 1 second |
| < 100 KB | 1000 | < 3 seconds |
| < 1 MB | 10000 | < 10 seconds |

---

## Test 8: Dark Mode Compatibility

1. Toggle dark mode (moon icon in navbar)
2. Check all new elements:
   - [ ] Batch forecast cards readable
   - [ ] CSV upload section visible
   - [ ] Decision cards colored properly
   - [ ] Charts render correctly
   - [ ] Table has good contrast

---

## Troubleshooting Common Test Issues

### Issue: "No ingredient dropdown visible"
**Solution:** Check that `ingredients` list is populated in template:
```python
# In app.py /forecast route
df = pd.read_csv(DATA_PATH)
ingredients = sorted(df["ingredient"].unique().tolist())
```

### Issue: "Module not found" JavaScript error
**Solution:** Ensure ES6 modules loaded:
```html
<script type="module" src="/static/modules/forecast.js"></script>
```

### Issue: Chart not rendering
**Solution:** Check Chart.js loaded before modules:
```html
<script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
<script type="module" src="..."></script>
```

### Issue: API returns 500 error
**Solution:** Check Flask console for stack trace, verify:
- `data/sales_data.csv` exists
- CSV has required columns
- Ingredient name spelling matches exactly

---

## Manual Testing Checklist

### Frontend (Browser)
- [ ] Time horizon dropdown visible and functional
- [ ] Multi-select ingredient works (Ctrl/Cmd + click)
- [ ] CSV file input accepts .csv files
- [ ] Upload button triggers upload
- [ ] Success/error messages display
- [ ] Charts render with correct data
- [ ] Batch forecast cards appear
- [ ] Alerts display with colors
- [ ] Decision card shows reorder info
- [ ] Table displays predictions

### Backend (API)
- [ ] `/api/forecast` accepts `days_ahead` parameter
- [ ] `/api/forecast-batch` handles multiple ingredients
- [ ] `/api/upload-csv` validates file format
- [ ] Errors return proper status codes (400, 404, 500)
- [ ] Success responses include all required fields

### Data Integrity
- [ ] CSV merge doesn't create duplicates
- [ ] Uploaded data persists across sessions
- [ ] Forecasts use latest uploaded data
- [ ] Predictions array length matches `days_ahead`
- [ ] Confidence intervals calculated correctly

---

## Automated Testing (Optional)

### pytest Example
```python
import pytest
import json
from app import app

@pytest.fixture
def client():
    app.config['TESTING'] = True
    with app.test_client() as client:
        yield client

def test_forecast_with_time_horizon(client):
    response = client.post('/api/forecast', 
        json={
            'ingredient': 'Tomatoes',
            'days_ahead': 14,
            'current_stock': 50
        })
    data = json.loads(response.data)
    assert data['success'] == True
    assert data['days_ahead'] == 14
    assert len(data['forecast']['predictions']) == 14

def test_batch_forecast(client):
    response = client.post('/api/forecast-batch',
        json={
            'ingredients': ['Tomatoes', 'Lettuce'],
            'days_ahead': 7
        })
    data = json.loads(response.data)
    assert data['success'] == True
    assert len(data['results']) == 2
```

---

## Success Criteria Summary

All tests pass when:
- ✅ Single ingredient forecasts work for 7/14/30 days
- ✅ Multi-ingredient batch forecasts display correctly
- ✅ CSV uploads merge data successfully
- ✅ Charts render all data points accurately
- ✅ Error handling catches invalid inputs
- ✅ Dark mode displays all elements correctly
- ✅ API responses include all required fields
- ✅ Performance meets expected benchmarks

---

**Testing Completed:** ___________  
**Tested By:** ___________  
**Version:** 2.0.0  
**Date:** ___________
