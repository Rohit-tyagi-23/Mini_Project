# HTML Template Migration Examples

This document provides before/after examples for updating HTML templates to work with the new ES6 modules.

## Example 1: Dashboard Template

### Before (Old Global Variables)

```html
<!-- dashboard.html - OLD (REMOVE) -->
<script src="{{ url_for('static', filename='dashboard.js') }}"></script>

<div class="dashboard">
  <select class="location-selector">
    <option value="">Select Location</option>
    <option value="1">Main Kitchen</option>
  </select>
  
  <button onclick="loadDashboard()">Refresh</button>
  
  <div class="stats">
    <div>Total Sales: <span id="total-sales">0</span></div>
    <div>Avg Usage: <span id="avg-usage">0</span>%</div>
  </div>
  
  <canvas id="trend-chart"></canvas>
  <canvas id="top-ingredients-chart"></canvas>
  
  <form onsubmit="addSaleRecord()">
    <input type="text" placeholder="Ingredient" />
    <input type="number" placeholder="Quantity" />
    <button>Add Sale</button>
  </form>
</div>

<script>
  let trendChart;
  let topIngredientsChart;
  
  function loadDashboard() { ... }
  function updateStats() { ... }
  function addSaleRecord() { ... }
</script>
```

### After (ES6 Modules)

```html
<!-- dashboard.html - NEW -->
<!-- Script module loaded at bottom -->
<div class="dashboard">
  <select id="location-selector">
    <option value="">Select Location</option>
    <option value="1">Main Kitchen</option>
  </select>
  
  <button id="refresh-dashboard-btn" class="btn btn-primary">
    <span>Refresh</span>
  </button>
  
  <div class="stats-grid">
    <div class="stat-card">
      <h4>Total Sales</h4>
      <p id="total-sales" class="stat-value">$0</p>
    </div>
    <div class="stat-card">
      <h4>Avg Usage</h4>
      <p id="avg-usage" class="stat-value">0%</p>
    </div>
    <div class="stat-card">
      <h4>Predictions Accuracy</h4>
      <p id="predictions-accuracy" class="stat-value">0%</p>
    </div>
    <div class="stat-card">
      <h4>Ingredients Count</h4>
      <p id="ingredients-count" class="stat-value">0</p>
    </div>
  </div>
  
  <div class="charts-section">
    <div class="chart-container">
      <h3>Sales Trend</h3>
      <canvas id="trend-chart"></canvas>
    </div>
    <div class="chart-container">
      <h3>Top Ingredients</h3>
      <canvas id="top-ingredients-chart"></canvas>
    </div>
  </div>
  
  <form id="manual-sale-form" class="sale-form">
    <h3>Record Manual Sale</h3>
    <div class="form-group">
      <label for="ingredient-name">Ingredient Name *</label>
      <input 
        type="text" 
        id="ingredient-name"
        name="ingredient_name" 
        required
        placeholder="e.g., Tomato"
      />
    </div>
    <div class="form-group">
      <label for="quantity">Quantity *</label>
      <input 
        type="number" 
        id="quantity"
        name="quantity" 
        step="0.01"
        required
        placeholder="e.g., 10"
      />
    </div>
    <div class="form-group">
      <label for="unit">Unit</label>
      <select id="unit" name="unit">
        <option value="piece">Piece</option>
        <option value="kg">Kilogram</option>
        <option value="liter">Liter</option>
        <option value="gram">Gram</option>
      </select>
    </div>
    <div class="form-group">
      <label for="date">Date</label>
      <input 
        type="date" 
        id="date"
        name="date"
      />
    </div>
    <button type="submit" class="btn btn-primary">Add Sale</button>
  </form>
</div>

<!-- Load module - place at end of body -->
<script type="module" src="{{ url_for('static', filename='modules/dashboard.js') }}"></script>
```

**Key Changes:**
- ✅ Moved script to end of body with `type="module"`
- ✅ Added proper `id` attributes to all elements
- ✅ Used proper form structure with `name` attributes
- ✅ Removed inline event handlers (`onclick`, `onsubmit`)
- ✅ Added ARIA labels and accessibility
- ✅ Improved semantic HTML structure

---

## Example 2: Authentication Template

### Before (Old Inline Handlers)

```html
<!-- login.html - OLD -->
<script src="{{ url_for('static', filename='auth.js') }}"></script>

<div class="auth-container">
  <form onsubmit="handleLogin(event)">
    <input type="email" placeholder="Email" id="email" />
    <div>
      <input type="password" placeholder="Password" id="password" />
      <button onclick="togglePassword('#password')">Show</button>
    </div>
    <label>
      <input type="checkbox" id="remember-me" onchange="saveRemembrance()" />
      Remember me
    </label>
    <button type="submit" onclick="showLoading(true)">Login</button>
  </form>
  
  <p><a href="#" onclick="switchTab('signup')">Create account</a></p>
</div>

<script>
  function handleLogin(event) { ... }
  function showLoading(show) { ... }
  function togglePassword(selector) { ... }
  function switchTab(tab) { ... }
</script>
```

### After (ES6 Modules with Proper Structure)

```html
<!-- login.html - NEW -->
<div class="auth-container">
  <!-- Tab buttons -->
  <div class="auth-tabs">
    <button class="tab-button active" data-tab="login">Login</button>
    <button class="tab-button" data-tab="signup">Sign Up</button>
  </div>

  <!-- Login Tab -->
  <div id="login-tab" class="auth-tab" style="display: block;">
    <form id="login-form" class="auth-form">
      <h2>Welcome Back</h2>
      
      <div class="form-group">
        <label for="login-email">Email Address *</label>
        <input 
          type="email" 
          id="login-email"
          name="email" 
          required
          placeholder="user@example.com"
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label for="login-password">Password *</label>
        <div class="password-input-group">
          <input 
            type="password" 
            id="login-password"
            name="password" 
            required
            placeholder="••••••••"
            autocomplete="current-password"
          />
          <button 
            type="button" 
            class="password-toggle"
            data-toggle-password="#login-password"
            aria-label="Toggle password visibility"
          >
            Show
          </button>
        </div>
      </div>

      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="remember-me"
          name="remember-me"
        />
        <label for="remember-me">Remember me</label>
      </div>

      <button type="submit" class="btn btn-primary btn-lg">
        Login
      </button>

      <p class="auth-footer">
        Don't have an account? 
        <button type="button" class="link-button" data-tab="signup">
          Sign up here
        </button>
      </p>
    </form>
  </div>

  <!-- Signup Tab -->
  <div id="signup-tab" class="auth-tab" style="display: none;">
    <form id="signup-form" class="auth-form">
      <h2>Create Account</h2>
      
      <div class="form-group">
        <label for="signup-business">Business Name</label>
        <input 
          type="text" 
          id="signup-business"
          name="business-name"
          placeholder="Your Restaurant Name"
        />
      </div>

      <div class="form-group">
        <label for="signup-email">Email Address *</label>
        <input 
          type="email" 
          id="signup-email"
          name="email" 
          required
          placeholder="user@example.com"
          autocomplete="email"
        />
      </div>

      <div class="form-group">
        <label for="signup-password">Password *</label>
        <div class="password-input-group">
          <input 
            type="password" 
            id="signup-password"
            name="password" 
            required
            placeholder="••••••••"
            autocomplete="new-password"
          />
          <button 
            type="button" 
            class="password-toggle"
            data-toggle-password="#signup-password"
            aria-label="Toggle password visibility"
          >
            Show
          </button>
        </div>
        <small class="password-hint">
          At least 8 characters, 1 uppercase, 1 number
        </small>
      </div>

      <div class="form-group">
        <label for="signup-confirm">Confirm Password *</label>
        <div class="password-input-group">
          <input 
            type="password" 
            id="signup-confirm"
            name="confirm-password" 
            required
            placeholder="••••••••"
            autocomplete="new-password"
          />
          <button 
            type="button" 
            class="password-toggle"
            data-toggle-password="#signup-confirm"
            aria-label="Toggle password visibility"
          >
            Show
          </button>
        </div>
      </div>

      <button type="submit" class="btn btn-primary btn-lg">
        Create Account
      </button>

      <p class="auth-footer">
        Already have an account? 
        <button type="button" class="link-button" data-tab="login">
          Login here
        </button>
      </p>
    </form>
  </div>
</div>

<!-- Load module -->
<script type="module" src="{{ url_for('static', filename='modules/auth.js') }}"></script>
```

**Key Changes:**
- ✅ Removed all inline event handlers
- ✅ Used `data-*` attributes for event delegation
- ✅ Proper form structure with `id` and `name` attributes
- ✅ Added autocomplete attributes for better UX
- ✅ Added password strength hints
- ✅ Tab system using data attributes
- ✅ Semantic HTML with proper labels

---

## Example 3: Forecast Template

### Before

```html
<!-- forecast.html - OLD -->
<script src="{{ url_for('static', filename='forecast.js') }}"></script>

<div>
  <form onsubmit="generateForecast(event)">
    <select id="forecast-ingredient"></select>
    <input type="number" id="days" min="1" max="365" />
    <input type="checkbox" id="confidence" />
    <button>Forecast</button>
    <button onclick="resetForm()">Reset</button>
  </form>
  
  <div id="forecast-results" style="display:none">
    <canvas id="preview-chart"></canvas>
  </div>
</div>

<script>
  let previewChart;
  function generateForecast(event) { ... }
  function resetForm() { ... }
</script>
```

### After

```html
<!-- forecast.html - NEW -->
<div class="forecast-container">
  <h2>Ingredient Forecasting</h2>
  
  <form id="forecast-form" class="forecast-form">
    <div class="form-column">
      <div class="form-group">
        <label for="forecast-location">Location *</label>
        <select id="forecast-location" name="location" required>
          <option value="">Select Location</option>
          <option value="1">Main Kitchen</option>
        </select>
      </div>

      <div class="form-group">
        <label for="forecast-ingredient">Ingredient *</label>
        <select id="forecast-ingredient" name="ingredient" required>
          <option value="">Select Ingredient</option>
          <option>Tomato</option>
          <option>Onion</option>
          <option>Garlic</option>
        </select>
      </div>

      <div class="form-group">
        <label for="forecast-days">Days Ahead *</label>
        <input 
          type="number" 
          id="forecast-days"
          name="days" 
          min="1" 
          max="365" 
          value="30"
          required
        />
      </div>

      <div class="form-group checkbox">
        <input 
          type="checkbox" 
          id="forecast-confidence"
          name="include-confidence"
        />
        <label for="forecast-confidence">Include confidence intervals</label>
      </div>

      <div class="form-actions">
        <button type="submit" class="btn btn-primary">
          Generate Forecast
        </button>
        <button type="button" id="reset-forecast-btn" class="btn btn-secondary">
          Reset
        </button>
      </div>
    </div>
  </form>

  <!-- Results Section -->
  <div id="forecast-results" class="forecast-results" style="display: none;">
    <h3>Forecast Results</h3>

    <!-- Stats -->
    <div id="forecast-stats" class="stats-grid">
      <!-- Populated by JavaScript -->
    </div>

    <!-- Chart -->
    <div class="chart-container">
      <h4>Forecast Visualization</h4>
      <canvas id="forecast-chart"></canvas>
    </div>

    <!-- Table -->
    <div class="table-container">
      <h4>Detailed Predictions</h4>
      <div id="forecast-table">
        <!-- Populated by JavaScript -->
      </div>
    </div>

    <!-- Export button -->
    <button class="btn btn-secondary" onclick="exportForecast()">
      Export as CSV
    </button>
  </div>
</div>

<!-- Load module -->
<script type="module" src="{{ url_for('static', filename='modules/forecast.js') }}"></script>
```

**Key Changes:**
- ✅ Proper form structure
- ✅ Semantic HTML sections
- ✅ Results section hidden by default
- ✅ Replaced `<input type="checkbox">` with proper label association
- ✅ Modular layout with clear sections

---

## Example 4: Alerts Template

### Before

```html
<!-- With alerts settings button -->
<button onclick="showAlertSettingsModal()">Alert Settings</button>

<div id="alert-settings-modal" class="modal" style="display:none">
  <div class="modal-content">
    <span onclick="closeAlertSettingsModal()" class="close">&times;</span>
    
    <form onsubmit="saveAlertPreferences(event)">
      <input type="email" id="email" placeholder="Email" />
      <input type="checkbox" id="email-alerts" onchange="onAlertMethodChange()" />
      <button type="submit">Save</button>
    </form>
  </div>
</div>

<script>
  function showAlertSettingsModal() { ... }
  function saveAlertPreferences(event) { ... }
  function onAlertMethodChange() { ... }
</script>
```

### After

```html
<!-- Header with alerts button -->
<header>
  <nav>
    <button id="alert-settings-btn" class="btn btn-icon" aria-label="Alert Settings">
      <span class="icon">🔔</span>
    </button>
  </nav>
</header>

<!-- Modal -->
<div id="alert-settings-modal" class="modal modal-backdrop">
  <div class="modal-content" role="dialog" aria-labelledby="modal-title">
    <div class="modal-header">
      <h2 id="modal-title">Alert Preferences</h2>
      <button 
        type="button" 
        class="modal-close"
        data-close-modal
        aria-label="Close dialog"
      >
        ✕
      </button>
    </div>

    <div class="modal-body">
      <form id="alert-preferences-form">
        <!-- Email Alert Option -->
        <div class="alert-method-section">
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="email-alerts"
              name="email-alerts"
            />
            <label for="email-alerts">Enable Email Alerts</label>
          </div>

          <div id="email-fields" class="alert-fields" style="display: none;">
            <div class="form-group">
              <label for="email-input">Email Address</label>
              <input 
                type="email" 
                id="email-input"
                name="email"
                placeholder="user@example.com"
              />
            </div>

            <button 
              type="button" 
              class="btn btn-sm btn-secondary"
              data-test-alert="email"
            >
              Test Email Alert
            </button>
          </div>
        </div>

        <!-- SMS Alert Option -->
        <div class="alert-method-section">
          <div class="form-group checkbox">
            <input 
              type="checkbox" 
              id="sms-alerts"
              name="sms-alerts"
            />
            <label for="sms-alerts">Enable SMS Alerts</label>
          </div>

          <div id="sms-fields" class="alert-fields" style="display: none;">
            <div class="form-group">
              <label for="phone-input">Phone Number</label>
              <input 
                type="tel" 
                id="phone-input"
                name="phone"
                placeholder="+1 (555) 123-4567"
              />
            </div>

            <button 
              type="button" 
              class="btn btn-sm btn-secondary"
              data-test-alert="sms"
            >
              Test SMS Alert
            </button>
          </div>
        </div>

        <!-- Alert Preferences -->
        <div class="form-group">
          <label for="threshold">Alert Threshold (%)</label>
          <input 
            type="number" 
            id="threshold"
            name="threshold"
            min="1" 
            max="100" 
            value="70"
          />
        </div>

        <div class="form-group">
          <label for="frequency">Alert Frequency</label>
          <select id="frequency" name="frequency">
            <option value="immediate">Immediate</option>
            <option value="daily">Daily Digest</option>
            <option value="weekly">Weekly Digest</option>
          </select>
        </div>

        <div class="modal-footer">
          <button type="submit" class="btn btn-primary">Save Preferences</button>
          <button 
            type="button" 
            class="btn btn-secondary"
            data-close-modal
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  </div>
</div>

<!-- Load module -->
<script type="module" src="{{ url_for('static', filename='modules/alerts.js') }}"></script>
```

**Key Changes:**
- ✅ Proper modal structure
- ✅ Used `data-test-alert` for test buttons
- ✅ Used `data-close-modal` for close handlers
- ✅ Semantic modal with ARIA attributes
- ✅ Proper form grouping by alert method
- ✅ Modal footer for actions

---

## CSS Classes Reference

The new modules expect these CSS classes:

```css
/* Buttons */
.btn { ... }
.btn-primary { ... }
.btn-secondary { ... }
.btn-icon { ... }
.btn.loading { cursor: wait; opacity: 0.7; }

/* Forms */
.form-group { margin-bottom: 1rem; }
.form-group label { display: block; margin-bottom: 0.5rem; }
.form-group input,
.form-group select { width: 100%; padding: 0.5rem; }
.form-group.checkbox { display: flex; align-items: center; }
.form-group.checkbox input { width: auto; margin-right: 0.5rem; }

/* Modals */
.modal { position: fixed; display: none; z-index: 1000; }
.modal.visible { display: block; }
.modal-backdrop { background: rgba(0,0,0,0.5); }
.modal-content { background: white; padding: 2rem; }
.modal-close { background: none; border: none; font-size: 1.5rem; cursor: pointer; }

/* Notifications */
.notifications-container { position: fixed; top: 20px; right: 20px; z-index: 9999; }
.notification { padding: 1rem; margin-bottom: 0.5rem; border-radius: 4px; }
.notification-error { background: #f8d7da; color: #721c24; border: 1px solid #f5c6cb; }
.notification-success { background: #d4edda; color: #155724; border: 1px solid #c3e6cb; }
.notification-warning { background: #fff3cd; color: #856404; border: 1px solid #ffeaa7; }
.notification-info { background: #d1ecf1; color: #0c5460; border: 1px solid #bee5eb; }

/* Loading */
.spinner-overlay { position: fixed; inset: 0; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,0.7); z-index: 10000; }
.spinner { text-align: center; color: white; }
.spinner-border { border: 4px solid rgba(255,255,255,0.3); border-top-color: white; border-radius: 50%; width: 40px; height: 40px; animation: spin 1s linear infinite; }

/* Charts */
.chart-container { position: relative; height: 300px; margin-bottom: 2rem; }
.stat-card { padding: 1rem; border: 1px solid #ddd; border-radius: 4px; }
.stat-value { font-size: 2rem; font-weight: bold; margin: 0.5rem 0 0; }

@keyframes spin {
  to { transform: rotate(360deg); }
}
```

---

## HTML Element IDs Required by Modules

### Dashboard Module
- `location-selector` - Location dropdown
- `refresh-dashboard-btn` - Refresh button
- `manual-sale-form` - Sale entry form
- `trend-chart` - Trend chart canvas
- `top-ingredients-chart` - Ingredients chart canvas
- `total-sales`, `avg-usage`, `predictions-accuracy`, `ingredients-count` - Stat cards

### Auth Module
- `login-form` - Login form
- `signup-form` - Signup form
- `remember-me` - Remember checkbox
- `login-email`, `login-password` - Login inputs
- `signup-email`, `signup-password`, `signup-confirm` - Signup inputs

### Forecast Module
- `forecast-form` - Forecast form
- `forecast-location` - Location dropdown
- `forecast-ingredient` - Ingredient dropdown
- `forecast-days` - Days input
- `reset-forecast-btn` - Reset button
- `forecast-chart` - Chart canvas
- `forecast-results` - Results container
- `forecast-stats` - Stats container
- `forecast-table` - Table container

### Alerts Module
- `alert-settings-btn` - Settings button
- `alert-settings-modal` - Modal container
- `alert-preferences-form` - Preferences form
- `email-alerts`, `sms-alerts` - Alert method checkboxes
- `email`, `phone` - Contact fields
- `threshold`, `frequency` - Preference inputs

---

## Testing Checklist

After migrating, test:

- [ ] All scripts load without errors (check console)
- [ ] Location selector changes load dashboard
- [ ] Refresh button updates stats
- [ ] Charts render correctly
- [ ] Form submissions work
- [ ] Notifications display
- [ ] Loading states show/hide
- [ ] Modal opens/closes
- [ ] Logout functionality works
- [ ] Remember-me restores email
- [ ] Password visibility toggle works
- [ ] Form validation shows errors
- [ ] Error recovery works (network errors)

