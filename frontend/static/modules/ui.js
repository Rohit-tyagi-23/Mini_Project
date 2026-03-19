/**
 * UI Service Module
 * Handles all UI updates, notifications, and visual feedback
 */

class UIService {
  constructor() {
    this.loadingElements = new Set();
    this.notificationTimeout = 5000; // 5 seconds
  }

  /**
   * Show loading state
   */
  showLoading(show = true, element = null) {
    if (element) {
      if (show) {
        element.classList.add('loading');
        element.disabled = true;
        this.loadingElements.add(element);
      } else {
        element.classList.remove('loading');
        element.disabled = false;
        this.loadingElements.delete(element);
      }
      return;
    }

    // Show global loading
    const spinner = this.getOrCreateSpinner();
    spinner.style.display = show ? 'flex' : 'none';

    if (show) {
      document.body.style.cursor = 'wait';
    } else {
      document.body.style.cursor = 'auto';
    }
  }

  /**
   * Get or create loading spinner
   */
  getOrCreateSpinner() {
    let spinner = document.getElementById('global-spinner');

    if (!spinner) {
      spinner = document.createElement('div');
      spinner.id = 'global-spinner';
      spinner.className = 'spinner-overlay';
      spinner.innerHTML = `
        <div class="spinner">
          <div class="spinner-border"></div>
          <p>Loading...</p>
        </div>
      `;
      document.body.appendChild(spinner);
    }

    return spinner;
  }

  /**
   * Show error notification
   */
  showError(message, duration = this.notificationTimeout) {
    console.error('[ERROR]', message);
    this.showNotification(message, 'error', duration);
  }

  /**
   * Show success notification
   */
  showSuccess(message, duration = this.notificationTimeout) {
    this.showNotification(message, 'success', duration);
  }

  /**
   * Show warning notification
   */
  showWarning(message, duration = this.notificationTimeout) {
    this.showNotification(message, 'warning', duration);
  }

  /**
   * Show info notification
   */
  showInfo(message, duration = this.notificationTimeout) {
    this.showNotification(message, 'info', duration);
  }

  /**
   * Generic notification handler
   */
  showNotification(message, type = 'info', duration = this.notificationTimeout) {
    const container = this.getOrCreateContainer();

    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.setAttribute('role', 'alert');
    notification.innerHTML = `
      <span class="notification-message">${this.escapeHtml(message)}</span>
      <button class="notification-close" aria-label="Close notification">&times;</button>
    `;

    // Add close button handler
    notification.querySelector('.notification-close').addEventListener('click', () => {
      this.removeNotification(notification);
    });

    container.appendChild(notification);

    // Trigger animation
    setTimeout(() => notification.classList.add('show'), 10);

    // Auto remove
    if (duration > 0) {
      setTimeout(() => this.removeNotification(notification), duration);
    }

    return notification;
  }

  /**
   * Remove notification
   */
  removeNotification(element) {
    element.classList.remove('show');
    setTimeout(() => element.remove(), 300);
  }

  /**
   * Get or create notification container
   */
  getOrCreateContainer() {
    let container = document.getElementById('notifications-container');

    if (!container) {
      container = document.createElement('div');
      container.id = 'notifications-container';
      container.className = 'notifications-container';
      document.body.appendChild(container);
    }

    return container;
  }

  /**
   * Update element content safely
   */
  updateElement(selector, content) {
    const element = document.querySelector(selector);
    if (element) {
      if (typeof content === 'string') {
        element.textContent = content;
      } else if (typeof content === 'object') {
        Object.assign(element, content);
      }
    }
    return element;
  }

  /**
   * Show/hide elements
   */
  setVisible(selector, visible = true) {
    const element = document.querySelector(selector);
    if (element) {
      element.style.display = visible ? '' : 'none';
    }
    return element;
  }

  /**
   * Disable/enable elements
   */
  setDisabled(selector, disabled = true) {
    const element = document.querySelector(selector);
    if (element) {
      element.disabled = disabled;
    }
    return element;
  }

  /**
   * Add CSS class
   */
  addClass(selector, className) {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.add(className);
    }
    return element;
  }

  /**
   * Remove CSS class
   */
  removeClass(selector, className) {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.remove(className);
    }
    return element;
  }

  /**
   * Toggle CSS class
   */
  toggleClass(selector, className) {
    const element = document.querySelector(selector);
    if (element) {
      element.classList.toggle(className);
    }
    return element;
  }

  /**
   * Escape HTML to prevent XSS
   */
  escapeHtml(text) {
    const map = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, m => map[m]);
  }

  /**
   * Clear all notifications
   */
  clearNotifications() {
    const container = document.getElementById('notifications-container');
    if (container) {
      container.innerHTML = '';
    }
  }

  /**
   * Scroll to element
   */
  scrollToElement(selector, smooth = true) {
    const element = document.querySelector(selector);
    if (element) {
      element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }
  }

  /**
   * Focus element
   */
  focusElement(selector) {
    const element = document.querySelector(selector);
    if (element) {
      element.focus();
    }
  }
}

// Export singleton
const uiService = new UIService();

export { UIService, uiService };
