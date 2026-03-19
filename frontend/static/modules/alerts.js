/**
 * Alerts Module
 * Handles alert preferences, testing, and notifications
 */

import { apiService, ApiError } from './api.js';
import { uiService } from './ui.js';
import { storageService } from './storage.js';

/**
 * Alerts Manager Class
 */
class AlertsManager {
  constructor() {
    this.preferences = null;
    this.modal = null;
    this.form = null;
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Open settings modal button
    const settingsBtn = document.getElementById('alert-settings-btn');
    if (settingsBtn) {
      settingsBtn.addEventListener('click', () => this.openSettingsModal());
    }

    // Close modal button/backdrop
    document.addEventListener('click', (e) => {
      if (e.target.hasAttribute('data-close-modal')) {
        this.closeSettingsModal();
      }
      if (e.target.classList.contains('modal-backdrop')) {
        this.closeSettingsModal();
      }
    });

    // Preference form submission
    const prefsForm = document.getElementById('alert-preferences-form');
    if (prefsForm) {
      prefsForm.addEventListener('submit', (e) => this.handlePreferencesSubmit(e));
    }

    // Test buttons
    document.querySelectorAll('[data-test-alert]').forEach(button => {
      button.addEventListener('click', (e) => this.handleTestAlert(e));
    });

    // Alert method toggles
    document.querySelectorAll('input[name="alert-method"]').forEach(input => {
      input.addEventListener('change', (e) => this.onAlertMethodChange(e));
    });
  }

  /**
   * Open alert settings modal
   */
  async openSettingsModal() {
    try {
      uiService.showLoading(true);

      // Load current preferences
      await this.loadAlertPreferences();

      // Show modal
      const modal = document.getElementById('alert-settings-modal');
      if (modal) {
        modal.classList.add('visible');
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
      }

      uiService.showSuccess('Preferences loaded');
    } catch (error) {
      this.handleError(error, 'Failed to load alert settings');
    } finally {
      uiService.showLoading(false);
    }
  }

  /**
   * Close alert settings modal
   */
  closeSettingsModal() {
    const modal = document.getElementById('alert-settings-modal');
    if (modal) {
      modal.classList.remove('visible');
      modal.style.display = 'none';
      document.body.style.overflow = '';
    }
  }

  /**
   * Load alert preferences from server
   */
  async loadAlertPreferences() {
    try {
      const response = await apiService.get('/api/alerts/preferences');

      if (response && response.preferences) {
        this.preferences = response.preferences;
        this.populatePreferencesForm(response.preferences);
      }
    } catch (error) {
      console.error('Failed to load preferences:', error);
      throw error;
    }
  }

  /**
   * Populate form with saved preferences
   */
  populatePreferencesForm(preferences) {
    if (preferences.email_enabled) {
      document.getElementById('email-alerts')?.click();
    }
    if (preferences.sms_enabled) {
      document.getElementById('sms-alerts')?.click();
    }

    if (preferences.email) {
      const emailInput = document.querySelector('input[name="email"]');
      if (emailInput) emailInput.value = preferences.email;
    }

    if (preferences.phone) {
      const phoneInput = document.querySelector('input[name="phone"]');
      if (phoneInput) phoneInput.value = preferences.phone;
    }

    if (preferences.threshold) {
      const thresholdInput = document.querySelector('input[name="threshold"]');
      if (thresholdInput) thresholdInput.value = preferences.threshold;
    }

    if (preferences.frequency) {
      const freqSelect = document.querySelector('select[name="frequency"]');
      if (freqSelect) freqSelect.value = preferences.frequency;
    }
  }

  /**
   * Handle preferences form submission
   */
  async handlePreferencesSubmit(event) {
    event.preventDefault();

    try {
      const form = event.target;
      const formData = new FormData(form);

      // Validate inputs
      const emailEnabled = formData.get('email-alerts') === 'on';
      const smsEnabled = formData.get('sms-alerts') === 'on';

      if (!emailEnabled && !smsEnabled) {
        uiService.showWarning('Please enable at least one alert method');
        return;
      }

      if (emailEnabled && !this.validateEmail(formData.get('email') || '')) {
        uiService.showWarning('Please enter a valid email address');
        return;
      }

      if (smsEnabled && !this.validatePhone(formData.get('phone') || '')) {
        uiService.showWarning('Please enter a valid phone number');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      uiService.showLoading(true, button);

      const preferences = {
        email_enabled: emailEnabled,
        sms_enabled: smsEnabled,
        email: formData.get('email') || null,
        phone: formData.get('phone') || null,
        threshold: parseFloat(formData.get('threshold')) || 70,
        frequency: formData.get('frequency') || 'daily'
      };

      // Save preferences
      const response = await apiService.put('/api/alerts/preferences', preferences);

      if (response && response.success) {
        this.preferences = preferences;
        uiService.showSuccess('Alert preferences saved');

        // Close modal after delay
        setTimeout(() => this.closeSettingsModal(), 500);
      } else {
        throw new Error(response.error || 'Failed to save preferences');
      }
    } catch (error) {
      this.handleError(error, 'Failed to save alert preferences');
    } finally {
      const button = event.target.querySelector('button[type="submit"]');
      uiService.showLoading(false, button);
    }
  }

  /**
   * Handle alert method change
   */
  onAlertMethodChange(event) {
    const method = event.target.value;
    const emailFields = document.getElementById('email-fields');
    const smsFields = document.getElementById('sms-fields');

    if (method === 'email' && emailFields) {
      emailFields.style.display = event.target.checked ? 'block' : 'none';
    } else if (method === 'sms' && smsFields) {
      smsFields.style.display = event.target.checked ? 'block' : 'none';
    }
  }

  /**
   * Handle test alert submission
   */
  async handleTestAlert(event) {
    event.preventDefault();

    const method = event.currentTarget.getAttribute('data-test-alert');
    if (!method) return;

    try {
      const button = event.currentTarget;
      uiService.showLoading(true, button);

      const testData = {
        method,
        email: this.preferences?.email,
        phone: this.preferences?.phone
      };

      const response = await apiService.post('/api/alerts/test', testData);

      if (response && response.success) {
        uiService.showSuccess(`Test ${method} alert sent successfully`);
      } else {
        throw new Error(response.error || `Failed to send test ${method} alert`);
      }
    } catch (error) {
      this.handleError(error, `Failed to send test ${method} alert`);
    } finally {
      const button = event.currentTarget;
      uiService.showLoading(false, button);
    }
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate phone number
   */
  validatePhone(phone) {
    const phoneRegex = /^\+?1?\d{9,15}$/;
    return phoneRegex.test(phone.replace(/[\s()-]/g, ''));
  }

  /**
   * Handle errors
   */
  handleError(error, defaultMessage = 'An error occurred') {
    console.error('[Alerts Error]', error);
    let message = defaultMessage;

    if (error instanceof ApiError) {
      console.error(`[API Error] ${error.code}: ${error.message}`);
    } else if (error instanceof Error) {
      message = error.message;
    }

    uiService.showError(message);
  }

  /**
   * Create alert notification (triggered by server events)
   */
  createAlert(type, title, message, actions = []) {
    const alertElement = document.createElement('div');
    alertElement.className = `alert alert-${type}`;
    alertElement.setAttribute('role', 'alert');

    let html = `
      <div class="alert-header">
        <h4>${title}</h4>
        <button class="alert-close" aria-label="Close">&times;</button>
      </div>
      <div class="alert-body">
        <p>${message}</p>
    `;

    if (actions.length > 0) {
      html += '<div class="alert-actions">';
      actions.forEach(action => {
        html += `<button class="btn btn-sm" data-action="${action.id}">${action.label}</button>`;
      });
      html += '</div>';
    }

    html += '</div>';

    alertElement.innerHTML = html;

    // Add close handler
    alertElement.querySelector('.alert-close').addEventListener('click', () => {
      alertElement.remove();
    });

    // Add action handlers
    if (actions.length > 0) {
      alertElement.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          const action = actions.find(a => a.id === e.target.getAttribute('data-action'));
          if (action && action.callback) {
            action.callback();
          }
          alertElement.remove();
        });
      });
    }

    document.body.insertBefore(alertElement, document.body.firstChild);

    // Auto remove after 10 seconds
    setTimeout(() => {
      if (alertElement.parentElement) {
        alertElement.remove();
      }
    }, 10000);

    return alertElement;
  }

  /**
   * Cleanup
   */
  destroy() {
    this.closeSettingsModal();
  }
}

// Initialize on DOM ready
let alertsManager = null;

document.addEventListener('DOMContentLoaded', () => {
  alertsManager = new AlertsManager();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (alertsManager) {
    alertsManager.destroy();
  }
});

export { AlertsManager };
