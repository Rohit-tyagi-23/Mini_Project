# Quick Reference: ES6 JavaScript Modules

A quick-lookup guide for the Restaurant AI module system.

## 🚀 Module Imports

```javascript
// API communication
import { apiService, ApiError } from './modules/api.js';

// UI management
import { uiService } from './modules/ui.js';

// Client storage
import { storageService } from './modules/storage.js';

// Chart management
import { chartManager } from './modules/charts.js';

// Feature managers (auto-initialize)
// import { DashboardManager } from './modules/dashboard.js';
// import { ForecastManager } from './modules/forecast.js';
// import { AuthManager } from './modules/auth.js';
// import { AlertsManager } from './modules/alerts.js';
```

## 📡 API Calls

### Get Data
```javascript
const data = await apiService.get('/api/endpoint');
const data = await apiService.get('/api/endpoint?param=value');
```

### Post Data
```javascript
const response = await apiService.post('/api/endpoint', {
  field: 'value',
  number: 123
});
```

### Put/Update
```javascript
const response = await apiService.put('/api/endpoint', {
  field: 'new value'
});
```

### Delete
```javascript
const response = await apiService.delete('/api/endpoint');
```

### Error Handling
```javascript
try {
  const data = await apiService.get('/api/data');
} catch (error) {
  if (error instanceof ApiError) {
    if (error.code === 'TIMEOUT') { /* ... */ }
    if (error.code === 'NETWORK_ERROR') { /* ... */ }
    const message = error.getUserMessage(); // User-friendly
  }
}
```

## 🎨 UI Updates

### Notifications
```javascript
uiService.showError('Error message');
uiService.showSuccess('Success message');
uiService.showWarning('Warning message');
uiService.showInfo('Info message');
```

### Loading States
```javascript
uiService.showLoading(true);        // Global spinner
uiService.showLoading(false);       // Hide spinner

uiService.showLoading(true, button);  // On element
uiService.showLoading(false, button); // Hide on element
```

### DOM Updates
```javascript
uiService.updateElement('#id', 'New content');
uiService.updateElement('#id', { textContent: 'Text' });

uiService.setVisible('#element', true);   // Show
uiService.setVisible('#element', false);  // Hide

uiService.setDisabled('#button', true);   // Disable
uiService.setDisabled('#button', false);  // Enable

uiService.addClass('#element', 'class-name');
uiService.removeClass('#element', 'class-name');
uiService.toggleClass('#element', 'class-name');

uiService.scrollToElement('#section');    // Scroll into view
uiService.focusElement('#input');         // Focus input
```

## 💾 Storage

```javascript
// Save
storageService.setItem('key', 'value');
storageService.setItem('key', { obj: 'data' });

// Retrieve
const value = storageService.getItem('key');
const obj = storageService.getItem('key');  // Auto-parses JSON

// Retrieve as string (no parsing)
const str = storageService.getItem('key', false);

// Delete
storageService.removeItem('key');

// Get all items
const all = storageService.getAll();

// Clear all
storageService.clear();
```

## 📊 Charts

```javascript
// Create chart
chartManager.createChart('chart-id', {
  type: 'line',
  data: { labels: [...], datasets: [...] },
  options: { responsive: true }
});

// Get chart
const chart = chartManager.getChart('chart-id');

// Update chart
chartManager.updateChart('chart-id', {
  labels: newLabels,
  datasets: newDatasets,
  options: { ... }
});

// Destroy
chartManager.destroyChart('chart-id');
chartManager.destroyAll();

// Check if exists
if (chartManager.exists('chart-id')) { ... }

// Get all IDs
const ids = chartManager.getIds();
```

## 🔐 Authentication

HTML IDs required:
- `#login-form` - Login form
- `#signup-form` - Signup form
- `#email` - Email input
- `#password` - Password input
- `#remember-me` - Remember checkbox

The `AuthManager` handles:
- Form submission
- Email validation
- Password strength checking
- Remember-me functionality
- Session management
- Password visibility toggle

## 📊 Dashboard

HTML IDs required:
- `#location-selector` - Location dropdown
- `#refresh-dashboard-btn` - Refresh button
- `#manual-sale-form` - Sale form
- `#trend-chart` - Trend chart canvas
- `#top-ingredients-chart` - Ingredients chart canvas
- `#total-sales`, `#avg-usage`, etc. - Stat cards

The `DashboardManager` handles:
- Loading statistics
- Rendering charts
- Recording sales
- Location switching

## 🔮 Forecasting

HTML IDs required:
- `#forecast-form` - Forecast form
- `#forecast-location` - Location selector
- `#forecast-ingredient` - Ingredient selector
- `#forecast-days` - Days input
- `#reset-forecast-btn` - Reset button
- `#forecast-chart` - Chart canvas
- `#forecast-results` - Results container

The `ForecastManager` handles:
- Form submission
- API calls
- Chart rendering
- Result display

## 🔔 Alerts

HTML IDs required:
- `#alert-settings-btn` - Settings button
- `#alert-settings-modal` - Modal
- `#alert-preferences-form` - Preferences form
- `#email-alerts`, `#sms-alerts` - Checkboxes
- `#email`, `#phone` - Contact inputs

The `AlertsManager` handles:
- Modal management
- Preference saving
- Test alerts
- Email/SMS configuration

## 🛠️ Common Patterns

### Load Data Pattern
```javascript
async loadData() {
  try {
    uiService.showLoading(true);
    const data = await apiService.get('/api/data');
    this.render(data);
    uiService.showSuccess('Loaded');
  } catch (error) {
    uiService.showError('Failed to load');
  } finally {
    uiService.showLoading(false);
  }
}
```

### Form Submission Pattern
```javascript
async handleSubmit(event) {
  event.preventDefault();
  
  const form = event.target;
  const formData = new FormData(form);
  
  // Validate
  if (!formData.get('required_field')) {
    uiService.showWarning('Fill all fields');
    return;
  }

  try {
    const button = form.querySelector('button[type="submit"]');
    uiService.showLoading(true, button);

    const response = await apiService.post('/api/endpoint', {
      field: formData.get('field')
    });

    if (response.success) {
      uiService.showSuccess('Saved successfully');
      form.reset();
    } else {
      throw new Error(response.error || 'Failed');
    }
  } catch (error) {
    uiService.showError(error.message);
  } finally {
    const button = form.querySelector('button[type="submit"]');
    uiService.showLoading(false, button);
  }
}
```

### Modal Pattern
```javascript
async openModal() {
  try {
    const data = await apiService.get('/api/modal-data');
    this.populateModal(data);
    
    const modal = document.getElementById('modal-id');
    modal.classList.add('visible');
    document.body.style.overflow = 'hidden';
  } catch (error) {
    uiService.showError('Failed to open modal');
  }
}

closeModal() {
  const modal = document.getElementById('modal-id');
  modal.classList.remove('visible');
  document.body.style.overflow = '';
}
```

## 🎯 Event Handling

### Form Events
```html
<form id="my-form">
  <!-- Auto-wired by manager -->
</form>
```

### Button Events
```html
<button id="my-button">Click me</button>
```

### Data Attributes
```html
<!-- Close modal -->
<button data-close-modal>Close</button>

<!-- Test alert -->
<button data-test-alert="email">Test Email</button>

<!-- Toggle password -->
<button data-toggle-password="#password-input">Show</button>

<!-- Switch tab -->
<button data-tab="login">Login</button>
```

## 🎨 HTML Structure

### Form Group
```html
<div class="form-group">
  <label for="input-id">Label *</label>
  <input type="text" id="input-id" name="field_name" required />
</div>
```

### Checkbox
```html
<div class="form-group checkbox">
  <input type="checkbox" id="check-id" name="check_name" />
  <label for="check-id">Check this</label>
</div>
```

### Button
```html
<button type="submit" class="btn btn-primary">
  Submit
</button>
```

### Modal
```html
<div id="modal-id" class="modal modal-backdrop">
  <div class="modal-content">
    <div class="modal-header">
      <h2>Title</h2>
      <button type="button" data-close-modal>✕</button>
    </div>
    <div class="modal-body">Content</div>
  </div>
</div>
```

## 🔍 Debugging

### Check Status
```javascript
typeof apiService // object
typeof uiService // object
typeof chartManager // object
```

### Test API
```javascript
apiService.get('/api/dashboard-stats?location=1').then(console.log)
```

### View Notifications
```javascript
document.querySelectorAll('.notification')
```

### Check Charts
```javascript
chartManager.getIds()
chartManager.getChart('chart-id')
```

## 📱 HTML Template Skeleton

```html
<!DOCTYPE html>
<html>
<head>
  <!-- Include module styles -->
  <link rel="stylesheet" href="{{ url_for('static', filename='MODULE_STYLES.css') }}">
</head>
<body>
  <!-- Your HTML content here -->
  <!-- Use proper element IDs -->
  
  <!-- Load modules -->
  <script type="module" src="{{ url_for('static', filename='modules/dashboard.js') }}"></script>
  <script type="module" src="{{ url_for('static', filename='modules/forecast.js') }}"></script>
  <script type="module" src="{{ url_for('static', filename='modules/auth.js') }}"></script>
  <script type="module" src="{{ url_for('static', filename='modules/alerts.js') }}"></script>
</body>
</html>
```

## CSS Classes

```css
/* Buttons */
.btn, .btn-primary, .btn-secondary, .btn-danger, .btn-success
.btn-sm, .btn-lg, .btn-icon, .link-button

/* Forms */
.form-group, .form-group.checkbox, .form-error
.password-input-group, .password-toggle

/* Notifications */
.notifications-container, .notification
.notification-error, .notification-success, .notification-warning, .notification-info

/* Modals */
.modal, .modal.visible, .modal-backdrop
.modal-content, .modal-header, .modal-body, .modal-footer, .modal-close

/* Loading */
.loading, .spinner-overlay, .spinner-border

/* Cards */
.stat-card, .stat-value, .stats-grid

/* Charts */
.chart-container

/* Tables */
.forecast-table

/* Responsive */
@media (max-width: 768px) { ... }
@media (max-width: 480px) { ... }

/* Accessibility */
.visually-hidden
@media (prefers-reduced-motion: reduce) { ... }
@media (prefers-color-scheme: dark) { ... }
```

## 🐛 Common Issues

| Issue | Solution |
|-------|----------|
| Module not found | Check `type="module"` and file paths |
| Notifications missing | Ensure `MODULE_STYLES.css` is loaded |
| Form not submitting | Check form `id`, input `name` attributes |
| Charts not rendering | Verify canvas `id`, check console errors |
| API calls failing | Check endpoint in Network tab, view response |
| Timeout errors | Check network connectivity, API response time |
| Storage not working | Check browser localStorage limit, clear cache |
| Modal stuck open | Ensure `data-close-modal` button exists |

## 📚 Full Documentation

- **API Reference**: `MODULES_GUIDE.md` (65 KB)
- **HTML Examples**: `TEMPLATE_MIGRATION.md` (45 KB)
- **CSS Styling**: `MODULE_STYLES.css` (22 KB)
- **Project Overview**: `REFACTORING_SUMMARY.md` (35 KB)
- **File Index**: `INDEX.md` (15 KB)

---

**Version:** 2.0.0 ES6 Modules  
**Last Updated:** 2024  
**Print Required:** ✅ (Bookmark in browser!)
