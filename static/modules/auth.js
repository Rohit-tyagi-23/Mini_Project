/**
 * Authentication Module
 * Handles login, signup, and session management
 */

import { apiService, ApiError } from './api.js';
import { uiService } from './ui.js';
import { storageService } from './storage.js';

/**
 * Authentication Manager Class
 */
class AuthManager {
  constructor() {
    this.isAuthenticated = false;
    this.currentUser = null;
    this.initializeEventListeners();
    this.checkAuthStatus();
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Login form
    const loginForm = document.getElementById('login-form');
    if (loginForm) {
      loginForm.addEventListener('submit', (e) => this.handleLogin(e));
    }

    // Signup form
    const signupForm = document.getElementById('signup-form');
    if (signupForm) {
      signupForm.addEventListener('submit', (e) => this.handleSignup(e));
    }

    // Password toggle buttons
    document.querySelectorAll('[data-toggle-password]').forEach(button => {
      button.addEventListener('click', (e) => this.togglePasswordVisibility(e));
    });

    // Remember me checkbox
    const rememberCheckbox = document.getElementById('remember-me');
    if (rememberCheckbox) {
      rememberCheckbox.addEventListener('change', (e) => {
        storageService.setItem('remember_me', e.target.checked);
      });
    }

    // Logout button
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', (e) => this.handleLogout(e));
    }

    // Tab switching
    document.querySelectorAll('[data-tab]').forEach(tab => {
      tab.addEventListener('click', (e) => this.switchTab(e));
    });
  }

  /**
   * Check current authentication status
   */
  async checkAuthStatus() {
    try {
      const response = await apiService.get('/api/auth-status');

      if (response && response.authenticated) {
        this.isAuthenticated = true;
        this.currentUser = response.user;
        this.updateAuthUI();
      }
    } catch (error) {
      // User not authenticated
      this.isAuthenticated = false;
      this.currentUser = null;
    }
  }

  /**
   * Handle login submission
   */
  async handleLogin(event) {
    event.preventDefault();

    try {
      const form = event.target;
      const formData = new FormData(form);

      // Validate inputs
      if (!formData.get('email') || !formData.get('password')) {
        uiService.showWarning('Please fill in all required fields');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      uiService.showLoading(true, button);

      const loginData = {
        email: formData.get('email'),
        password: formData.get('password'),
        remember_me: formData.get('remember-me') === 'on'
      };

      // Attempt login
      const response = await apiService.post('/api/login', loginData);

      if (response && response.success) {
        this.isAuthenticated = true;
        this.currentUser = response.user;

        if (loginData.remember_me) {
          storageService.setItem('last_email', loginData.email);
        }

        uiService.showSuccess('Login successful');

        // Redirect after short delay
        setTimeout(() => {
          window.location.href = '/dashboard';
        }, 500);
      } else {
        throw new Error(response.error || 'Login failed');
      }
    } catch (error) {
      this.handleError(error, 'Login failed. Please check your credentials.');
    } finally {
      const button = event.target.querySelector('button[type="submit"]');
      uiService.showLoading(false, button);
    }
  }

  /**
   * Handle signup submission
   */
  async handleSignup(event) {
    event.preventDefault();

    try {
      const form = event.target;
      const formData = new FormData(form);

      // Validate inputs
      if (!formData.get('email') || !formData.get('password') || !formData.get('confirm-password')) {
        uiService.showWarning('Please fill in all required fields');
        return;
      }

      // Validate email format
      if (!this.validateEmail(formData.get('email'))) {
        uiService.showWarning('Please enter a valid email address');
        return;
      }

      // Check password strength
      const passwordStrength = this.checkPasswordStrength(formData.get('password'));
      if (!passwordStrength.strong) {
        uiService.showWarning(
          `Password too weak. Please include: ${passwordStrength.missing.join(', ')}`
        );
        return;
      }

      // Check passwords match
      if (formData.get('password') !== formData.get('confirm-password')) {
        uiService.showWarning('Passwords do not match');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      uiService.showLoading(true, button);

      const signupData = {
        email: formData.get('email'),
        password: formData.get('password'),
        business_name: formData.get('business-name') || null
      };

      const response = await apiService.post('/api/signup', signupData);

      if (response && response.success) {
        uiService.showSuccess('Account created successfully. Please log in.');

        // Clear form and switch to login tab
        form.reset();
        setTimeout(() => {
          this.switchTab({ target: { getAttribute: () => 'login' } });
        }, 500);
      } else {
        throw new Error(response.error || 'Signup failed');
      }
    } catch (error) {
      this.handleError(error, 'Signup failed. Please try again.');
    } finally {
      const button = event.target.querySelector('button[type="submit"]');
      uiService.showLoading(false, button);
    }
  }

  /**
   * Handle logout
   */
  async handleLogout(event) {
    if (event) {
      event.preventDefault();
    }

    try {
      await apiService.post('/api/logout', {});
      this.isAuthenticated = false;
      this.currentUser = null;
      storageService.removeItem('last_email');

      uiService.showSuccess('Logged out successfully');

      setTimeout(() => {
        window.location.href = '/';
      }, 500);
    } catch (error) {
      console.error('Logout error:', error);
      // Force logout anyway
      window.location.href = '/';
    }
  }

  /**
   * Toggle password visibility
   */
  togglePasswordVisibility(event) {
    event.preventDefault();

    const button = event.target;
    const targetSelector = button.getAttribute('data-toggle-password');
    const input = document.querySelector(targetSelector);

    if (!input) return;

    const isPassword = input.type === 'password';
    input.type = isPassword ? 'text' : 'password';

    // Update button text/icon
    button.textContent = isPassword ? 'Hide' : 'Show';
    button.classList.toggle('hidden', !isPassword);
  }

  /**
   * Switch between login/signup tabs
   */
  switchTab(event) {
    const tabName = event.target.getAttribute('data-tab');
    if (!tabName) return;

    // Hide all tabs
    document.querySelectorAll('.auth-tab').forEach(tab => {
      tab.style.display = 'none';
    });

    // Remove active class from all buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
      btn.classList.remove('active');
    });

    // Show selected tab
    const selectedTab = document.getElementById(`${tabName}-tab`);
    if (selectedTab) {
      selectedTab.style.display = 'block';
    }

    // Mark button as active
    event.target.classList.add('active');
  }

  /**
   * Validate email format
   */
  validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password) {
    const requirements = {
      length: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumber: /\d/.test(password)
    };

    const missing = [];
    if (!requirements.length) missing.push('at least 8 characters');
    if (!requirements.hasUppercase) missing.push('uppercase letter');
    if (!requirements.hasLowercase) missing.push('lowercase letter');
    if (!requirements.hasNumber) missing.push('number');

    return {
      strong: missing.length === 0,
      requirements,
      missing
    };
  }

  /**
   * Update UI based on auth status
   */
  updateAuthUI() {
    const authElements = document.querySelectorAll('[data-auth-state]');

    authElements.forEach(element => {
      const state = element.getAttribute('data-auth-state');

      if (state === 'authenticated' && this.isAuthenticated) {
        element.style.display = '';
      } else if (state === 'unauthenticated' && !this.isAuthenticated) {
        element.style.display = '';
      } else {
        element.style.display = 'none';
      }
    });

    // Update user name if available
    const userNameElements = document.querySelectorAll('[data-user-name]');
    if (this.currentUser && this.currentUser.email) {
      userNameElements.forEach(el => {
        el.textContent = this.currentUser.email.split('@')[0];
      });
    }
  }

  /**
   * Handle errors
   */
  handleError(error, defaultMessage = 'An error occurred') {
    console.error('[Auth Error]', error);
    let message = defaultMessage;

    if (error instanceof ApiError) {
      if (error.code === 'UNAUTHORIZED' || error.code === '401') {
        message = 'Invalid email or password';
      }
    } else if (error instanceof Error) {
      message = error.message;
    }

    uiService.showError(message);
  }

  /**
   * Restore saved email if remember me was checked
   */
  restoreSavedEmail() {
    const lastEmail = storageService.getItem('last_email');
    const emailInput = document.querySelector('input[name="email"]');

    if (lastEmail && emailInput) {
      emailInput.value = lastEmail;
    }

    const rememberCheckbox = document.getElementById('remember-me');
    if (rememberCheckbox && lastEmail) {
      rememberCheckbox.checked = true;
    }
  }
}

// Initialize on DOM ready
let authManager = null;

document.addEventListener('DOMContentLoaded', () => {
  authManager = new AuthManager();
  authManager.restoreSavedEmail();
});

export { AuthManager };
