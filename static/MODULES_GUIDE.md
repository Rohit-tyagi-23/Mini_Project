# JavaScript Modules: Modern ES6 Refactoring Guide

## Overview

This document explains the refactored JavaScript module architecture, which replaces global variables and event handlers with a clean, modular ES6 design. The refactoring improves maintainability, testability, and reduces namespace pollution.

## Architecture

### Module Structure

```
static/modules/
├── api.js              # API communication with error handling
├── ui.js               # UI updates and notifications
├── storage.js          # localStorage management
├── charts.js           # Chart.js lifecycle management
├── auth.js             # Authentication (login/signup)
├── dashboard.js        # Dashboard display and stats
├── forecast.js         # Forecasting features
└── alerts.js           # Alert settings and notifications
```

### Core Modules

#### 1. **api.js** - API Service
Centralized HTTP communication with automatic error handling.

**Key Classes:**
- `ApiService` - Main API client
- `ApiError` - Custom error class with user-friendly messages

**Usage:**
```javascript
import { apiService, ApiError } from './modules/api.js';

// GET request
const data = await apiService.get('/api/dashboard-stats?location=1');

// POST request
const response = await apiService.post('/api/sales', {
  ingredient_name: 'Tomato',
  quantity: 10,
  unit: 'kg'
});

// Error handling
try {
  const result = await apiService.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    console.log(error.code);        // 'TIMEOUT', 'NETWORK_ERROR', etc.
    console.log(error.getUserMessage()); // User-friendly message
  }
}
```

**Features:**
- Automatic timeout handling (30 seconds default)
- Request/response parsing
- Status code validation
- Network error detection
- Timeout recovery

#### 2. **ui.js** - UI Service
Unified UI updates, notifications, and visual feedback.

**Key Methods:**
```javascript
import { uiService } from './modules/ui.js';

// Loading states
uiService.showLoading(true);        // Show global spinner
uiService.showLoading(true, button); // Show loading on element

// Notifications
uiService.showError('Error message');
uiService.showSuccess('Success message');
uiService.showWarning('Warning message');
uiService.showInfo('Info message');

// DOM manipulation
uiService.updateElement('#stat-value', '1,234');
uiService.setVisible('#section', true);
uiService.setDisabled('#button', false);
uiService.addClass('#element', 'highlight');
uiService.toggleClass('#element', 'active');

// User interactions
uiService.scrollToElement('#section');
uiService.focusElement('#input');
uiService.clearNotifications();
```

**Features:**
- Toast notifications with auto-dismiss
- Loading spinners with cursor feedback
- Safe HTML escaping (XSS prevention)
- Element visibility/state management
- Auto-stacking notifications

#### 3. **storage.js** - Storage Service
Persistent client-side storage with JSON serialization.

**Usage:**
```javascript
import { storageService } from './modules/storage.js';

// Save data
storageService.setItem('user_email', 'user@example.com');
storageService.setItem('preferences', { theme: 'dark' });

// Retrieve data
const email = storageService.getItem('user_email');
const prefs = storageService.getItem('preferences');

// Delete data
storageService.removeItem('user_email');

// Get all
const all = storageService.getAll();

// Clear all
storageService.clear();
```

**Features:**
- Auto JSON serialization/deserialization
- Error handling with fallbacks
- Key prefixing for namespacing
- Null safety

#### 4. **charts.js** - Chart Manager
Manages Chart.js instances with proper lifecycle.

**Usage:**
```javascript
import { chartManager } from './modules/charts.js';

// Create chart
const config = {
  type: 'line',
  data: { labels: [...], datasets: [...] },
  options: { responsive: true, ... }
};
chartManager.createChart('trend-chart', config);

// Update chart
chartManager.updateChart('trend-chart', {
  labels: newLabels,
  datasets: newDatasets
});

// Destroy
chartManager.destroyChart('trend-chart');
chartManager.destroyAll();

// Check existence
if (chartManager.exists('trend-chart')) {
  const chart = chartManager.getChart('trend-chart');
}
```

**Benefits:**
- Prevents memory leaks
- Proper cleanup on page navigation
- Singleton pattern (only one instance)

### Feature Modules

#### 5. **auth.js** - Authentication Manager
Handles user authentication flows.

**Features:**
- Login/signup form handling
- Password visibility toggle
- Email validation
- Password strength checking
- Remember-me functionality
- Session management
- OAuth support (backend)

**Key Methods:**
```javascript
authManager.handleLogin(event);
authManager.handleSignup(event);
authManager.handleLogout(event);
authManager.checkAuthStatus();
authManager.restoreSavedEmail();
authManager.togglePasswordVisibility(event);
```

#### 6. **dashboard.js** - Dashboard Manager
Displays statistics and charts.

**Features:**
- Real-time stats calculation
- Dual chart rendering (trend + ingredients)
- Manual sales entry
- Location switching
- Auto-refresh
- Error recovery

**Key Methods:**
```javascript
dashboardManager.loadDashboard();
dashboardManager.onLocationChange(locationId);
dashboardManager.updateStats();
dashboardManager.renderCharts();
dashboardManager.handleSaleSubmit(event);
```

#### 7. **forecast.js** - Forecast Manager
Handles ingredient forecasting.

**Features:**
- Forecast generation
- Chart visualization with confidence intervals
- Statistical summary
- Data export support
- Form validation

**Key Methods:**
```javascript
forecastManager.handleForecastSubmit(event);
forecastManager.displayForecast(forecast);
forecastManager.renderForecastChart(forecast);
forecastManager.resetForm();
```

#### 8. **alerts.js** - Alerts Manager
Manages alert preferences and notifications.

**Features:**
- Alert settings modal
- Email/SMS configuration
- Preference persistence
- Test alerts
- In-app notifications

**Key Methods:**
```javascript
alertsManager.openSettingsModal();
alertsManager.handlePreferencesSubmit(event);
alertsManager.handleTestAlert(event);
alertsManager.createAlert(type, title, message);
```

## Migration Checklist

### Step 1: Update HTML Templates

Add module script tags to your HTML templates:

```html
<!-- Dashboard -->
<script type="module" src="{{ url_for('static', filename='modules/dashboard.js') }}"></script>

<!-- Forecast -->
<script type="module" src="{{ url_for('static', filename='modules/forecast.js') }}"></script>

<!-- Authentication -->
<script type="module" src="{{ url_for('static', filename='modules/auth.js') }}"></script>

<!-- Alerts -->
<script type="module" src="{{ url_for('static', filename='modules/alerts.js') }}"></script>
```

⚠️ **Remove old script tags:**
```html
<!-- DELETE THESE -->
<script src="{{ url_for('static', filename='dashboard.js') }}"></script>
<script src="{{ url_for('static', filename='forecast.js') }}"></script>
<script src="{{ url_for('static', filename='auth.js') }}"></script>
<script src="{{ url_for('static', filename='alerts.js') }}"></script>
```

### Step 2: Update HTML Elements (Use data-attributes)

The new modules use `data-*` attributes for stable DOM selection:

```html
<!-- Location selector -->
<select id="location-selector" data-module="dashboard">
  <option value="">Select Location</option>
</select>

<!-- Buttons with loading support -->
<button id="refresh-dashboard-btn" class="btn">
  Refresh
</button>

<!-- Forms with proper IDs -->
<form id="manual-sale-form">
  <input type="text" name="ingredient_name" required>
  <input type="number" name="quantity" required>
  <button type="submit">Add Sale</button>
</form>

<!-- Modal with close handler -->
<div id="alert-settings-modal" class="modal">
  <button data-close-modal>Close</button>
</div>

<!-- Charts containers -->
<canvas id="trend-chart"></canvas>
<canvas id="top-ingredients-chart"></canvas>
<canvas id="forecast-chart"></canvas>
```

### Step 3: Remove Global Variables

**Old code (to remove):**
```javascript
// ❌ GLOBAL VARIABLES - DO NOT USE
let trendChart;
let topIngredientsChart;
let previewChart;
const REMEMBER_ME_KEY = 'remember_me';
```

**New approach:**
All state is managed within module classes. No globals!

### Step 4: Update Backend API Routes

Ensure these endpoints are available (already in app.py):

```python
# Authentication
POST   /api/login
POST   /api/signup
POST   /api/logout
GET    /api/auth-status

# Dashboard
GET    /api/dashboard-stats?location=<id>
POST   /api/sales

# Forecasting
POST   /api/forecast

# Alerts
GET    /api/alerts/preferences
PUT    /api/alerts/preferences
POST   /api/alerts/test
```

## Common Patterns

### Pattern 1: Form Submission with Error Handling

```javascript
async handleFormSubmit(event) {
  event.preventDefault();
  
  try {
    const form = event.target;
    const formData = new FormData(form);
    
    // Validate
    if (!formData.get('required_field')) {
      uiService.showWarning('Fill all fields');
      return;
    }

    // Show loading on button
    const button = form.querySelector('button[type="submit"]');
    uiService.showLoading(true, button);

    // Make request
    const response = await apiService.post('/api/endpoint', {
      field: formData.get('field')
    });

    if (response.success) {
      uiService.showSuccess('Operation successful');
      form.reset();
    } else {
      throw new Error(response.error || 'Operation failed');
    }
  } catch (error) {
    this.handleError(error, 'Failed to complete operation');
  } finally {
    const button = event.target.querySelector('button[type="submit"]');
    uiService.showLoading(false, button);
  }
}
```

### Pattern 2: Data Loading with Loading State

```javascript
async loadData() {
  try {
    uiService.showLoading(true);

    const response = await apiService.get('/api/data?param=value');
    
    if (!response || typeof response !== 'object') {
      throw new Error('Invalid response');
    }

    this.data = response;
    this.render();
    
    uiService.showSuccess('Data loaded');
  } catch (error) {
    this.handleError(error, 'Failed to load data');
  } finally {
    uiService.showLoading(false);
  }
}
```

### Pattern 3: Modal Management

```javascript
async openModal() {
  try {
    // Load data
    const data = await apiService.get('/api/modal-data');
    
    // Populate modal
    this.populateModal(data);
    
    // Show modal
    const modal = document.getElementById('my-modal');
    if (modal) {
      modal.classList.add('visible');
      modal.style.display = 'block';
      document.body.style.overflow = 'hidden';
    }
  } catch (error) {
    this.handleError(error, 'Failed to open modal');
  }
}

closeModal() {
  const modal = document.getElementById('my-modal');
  if (modal) {
    modal.classList.remove('visible');
    modal.style.display = 'none';
    document.body.style.overflow = '';
  }
}
```

## Best Practices

### ✅ DO

1. **Use centralized imports**
   ```javascript
   import { apiService } from './api.js';
   import { uiService } from './ui.js';
   ```

2. **Wrap async operations with error handling**
   ```javascript
   try {
     const data = await apiService.get('/api/data');
   } catch (error) {
     uiService.showError('Failed to load');
   }
   ```

3. **Show loading states for user feedback**
   ```javascript
   uiService.showLoading(true);
   // ... do async work
   uiService.showLoading(false);
   ```

4. **Use validation before API calls**
   ```javascript
   if (!email.includes('@')) {
     uiService.showWarning('Invalid email');
     return;
   }
   ```

5. **Cleanup on page unload**
   ```javascript
   window.addEventListener('beforeunload', () => {
     manager.destroy();
   });
   ```

### ❌ DON'T

1. **Don't use global variables**
   ```javascript
   // ❌ BAD
   window.myVariable = value;
   ```

2. **Don't mix concerns**
   ```javascript
   // ❌ BAD - API calls in UI code
   // ✅ GOOD - Separate into manager class
   ```

3. **Don't forget error handling**
   ```javascript
   // ❌ BAD
   const data = await apiService.get('/api/data');
   
   // ✅ GOOD
   try {
     const data = await apiService.get('/api/data');
   } catch (error) { ... }
   ```

4. **Don't hardcode selectors**
   ```javascript
   // ❌ BAD - Brittle
   document.querySelector('#form > div > input:nth-child(2)');
   
   // ✅ GOOD - Robust
   form.querySelector('input[name="email"]');
   ```

## Debugging

### Browser Console

Access modules in DevTools:

```javascript
// In browser console (on any page)
// Assuming modules are initialized

// Check if auth is initialized
window.authManager // undefined if not on auth page
window.dashboardManager // undefined if not on dashboard

// Manually trigger actions
authManager.handleLogout()
dashboardManager.loadDashboard()
```

### Error Messages

All errors are logged with context:

```
[ERROR] Failed to load dashboard
[API Error] TIMEOUT: Request timeout
[Storage Error] Failed to set item
```

### Network Inspection

Use DevTools Network tab:
- Look for failed API requests
- Check response status and body
- Verify Content-Type headers

## Testing

### Unit Testing Example

```javascript
// test/auth.test.js
import { AuthManager } from '../static/modules/auth.js';
import { apiService } from '../static/modules/api.js';

jest.mock('../static/modules/api.js');

test('handleLogin with valid credentials', async () => {
  apiService.post.mockResolvedValue({ success: true });
  
  const manager = new AuthManager();
  await manager.handleLogin(mockEvent);
  
  expect(apiService.post).toHaveBeenCalledWith('/api/login', expect.any(Object));
});
```

## Performance Tips

1. **Lazy load modules** - Only include on pages that need them
2. **Debounce input handlers** - For search/filter inputs
3. **Cache API responses** - Use storageService for frequently-accessed data
4. **Destroy charts** - When navigating away from pages with charts
5. **Minimize animations** - For battery-conscious users

## Browser Support

- Chrome 61+ (ES6 modules)
- Firefox 67+
- Safari 12+
- Edge 79+

For older browsers, build with Webpack/Rollup and transpile.

## Troubleshooting

### Problem: "Module not found"

**Solution:** Check script tag has `type="module"` and correct path:
```html
<script type="module" src="/static/modules/dashboard.js"></script>
```

### Problem: "Cannot read property of undefined"

**Solution:** Ensure HTML elements exist before manager initializes:
```html
<!-- Manager looks for these on DOMContentLoaded -->
<form id="manual-sale-form">...</form>
<canvas id="trend-chart"></canvas>
```

### Problem: "CORS error"

**Solution:** API calls use relative URLs. Ensure Flask routes exist:
```python
@app.route('/api/dashboard-stats', methods=['GET'])
def get_dashboard_stats():
    return jsonify({...})
```

### Problem: Notifications not showing

**Solution:** Ensure notification container CSS exists in style.css:
```css
.notifications-container {
  position: fixed;
  top: 20px;
  right: 20px;
  z-index: 9999;
}

.notification {
  display: none;
  animation: slideIn 0.3s ease;
}

.notification.show {
  display: block;
}
```

## Migration Timeline

1. **Phase 1:** Update HTML templates with module scripts (1 day)
2. **Phase 2:** Test authentication flows (1 day)
3. **Phase 3:** Test dashboard and forecasting (1 day)
4. **Phase 4:** Test alerts and edge cases (1 day)
5. **Phase 5:** Remove old JS files + optimize (1 day)

## Next Steps

After migration, consider:

- [ ] Add request caching to apiService
- [ ] Implement WebSocket support for real-time updates
- [ ] Add offline support with Service Workers
- [ ] Create module unit tests
- [ ] Add JSDoc comments to all methods
- [ ] Implement feature flags for A/B testing
- [ ] Add analytics tracking to user actions
- [ ] Create performance monitoring module

## Support

For issues:
1. Check browser console for errors
2. Review Network tab for failed requests
3. Verify HTML element IDs match module expectations
4. Check API endpoint responses in server logs
5. Create GitHub issue with reproduction steps

---

**Last Updated:** 2024
**Module Version:** 2.0.0 (ES6)
