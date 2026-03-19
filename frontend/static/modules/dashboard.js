/**
 * Dashboard Module
 * Handles dashboard data loading, statistics display, and chart rendering
 */

import { apiService, ApiError } from './api.js';
import { uiService } from './ui.js';
import { chartManager } from './charts.js';

/**
 * Dashboard Manager Class
 */
class DashboardManager {
  constructor() {
    this.currentLocation = null;
    this.dashboardData = null;
    this.initializeEventListeners();
  }

  /**
   * Initialize event listeners
   */
  initializeEventListeners() {
    // Location selector
    const locationSelect = document.getElementById('location-selector');
    if (locationSelect) {
      locationSelect.addEventListener('change', (e) => {
        this.onLocationChange(e.target.value);
      });
    }

    // Refresh button
    const refreshBtn = document.getElementById('refresh-dashboard-btn');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', () => this.loadDashboard());
    }

    // Manual sales entry form
    const saleForm = document.getElementById('manual-sale-form');
    if (saleForm) {
      saleForm.addEventListener('submit', (e) => this.handleSaleSubmit(e));
    }

    // Real-time data updates
    document.addEventListener('dataUpdated', () => {
      this.loadDashboard();
    });
  }

  /**
   * Load dashboard data
   */
  async loadDashboard() {
    try {
      uiService.showLoading(true);

      if (!this.currentLocation) {
        uiService.showWarning('Please select a location');
        return;
      }

      const response = await apiService.get(`/api/dashboard-stats?location=${this.currentLocation}`);

      if (!response || typeof response !== 'object') {
        throw new Error('Invalid response format');
      }

      this.dashboardData = response;
      this.updateStats();
      this.renderCharts();

      uiService.showSuccess('Dashboard updated');
    } catch (error) {
      this.handleError(error, 'Failed to load dashboard');
    } finally {
      uiService.showLoading(false);
    }
  }

  /**
   * Handle location change
   */
  async onLocationChange(locationId) {
    if (!locationId) {
      uiService.showWarning('Please select a valid location');
      return;
    }

    this.currentLocation = locationId;
    await this.loadDashboard();
  }

  /**
   * Update dashboard statistics
   */
  updateStats() {
    if (!this.dashboardData) return;

    const stats = this.dashboardData;

    // Update stat cards
    this.updateStatCard('total-sales', stats.total_sales || 0, '$');
    this.updateStatCard('avg-usage', stats.avg_daily_usage || 0, '%');
    this.updateStatCard('predictions-accuracy', stats.accuracy || 0, '%');
    this.updateStatCard('ingredients-count', stats.ingredient_count || 0);

    // Update trend info
    if (stats.trend) {
      const trendElement = document.getElementById('trend-info');
      if (trendElement) {
        const trendIcon = stats.trend > 0 ? '↑' : '↓';
        const trendText = `${trendIcon} ${Math.abs(stats.trend)}% vs last period`;
        trendElement.textContent = trendText;
        trendElement.className = `trend-${stats.trend > 0 ? 'up' : 'down'}`;
      }
    }
  }

  /**
   * Update individual stat card
   */
  updateStatCard(elementId, value, suffix = '') {
    const element = document.getElementById(elementId);
    if (element) {
      const formattedValue = this.formatValue(value, suffix);
      element.textContent = formattedValue;
    }
  }

  /**
   * Format value with suffix and locale
   */
  formatValue(value, suffix = '') {
    let formatted = value;

    if (suffix === '$') {
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD'
      }).format(value);
    } else if (suffix === '%') {
      formatted = `${parseFloat(value).toFixed(1)}%`;
    } else {
      formatted = new Intl.NumberFormat('en-US').format(value);
    }

    return formatted;
  }

  /**
   * Render charts
   */
  renderCharts() {
    if (!this.dashboardData) return;

    this.renderTrendChart();
    this.renderTopIngredientsChart();
  }

  /**
   * Render trend chart
   */
  renderTrendChart() {
    const chartElement = document.getElementById('trend-chart');
    if (!chartElement || !this.dashboardData.trend_data) {
      return;
    }

    const data = this.dashboardData.trend_data;

    const config = {
      type: 'line',
      data: {
        labels: data.dates || [],
        datasets: [{
          label: 'Sales Trend',
          data: data.values || [],
          borderColor: '#3498db',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0.4,
          pointRadius: 4,
          pointHoverRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            display: true,
            position: 'top'
          }
        },
        scales: {
          y: {
            beginAtZero: true,
            title: { display: true, text: 'Amount' }
          }
        }
      }
    };

    chartManager.createChart('trend-chart', config);
  }

  /**
   * Render top ingredients chart
   */
  renderTopIngredientsChart() {
    const chartElement = document.getElementById('top-ingredients-chart');
    if (!chartElement || !this.dashboardData.top_ingredients) {
      return;
    }

    const data = this.dashboardData.top_ingredients;

    const config = {
      type: 'doughnut',
      data: {
        labels: data.names || [],
        datasets: [{
          data: data.values || [],
          backgroundColor: [
            '#ff6b6b',
            '#4ecdc4',
            '#45b7d1',
            '#ffa07a',
            '#98d8c8'
          ]
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: true,
        plugins: {
          legend: {
            position: 'bottom'
          }
        }
      }
    };

    chartManager.createChart('top-ingredients-chart', config);
  }

  /**
   * Handle manual sale submission
   */
  async handleSaleSubmit(event) {
    event.preventDefault();

    try {
      const form = event.target;
      const formData = new FormData(form);

      // Validate form
      if (!formData.get('ingredient_name') || !formData.get('quantity')) {
        uiService.showWarning('Please fill in all required fields');
        return;
      }

      const button = form.querySelector('button[type="submit"]');
      uiService.showLoading(true, button);

      const saleData = {
        location_id: this.currentLocation,
        ingredient_name: formData.get('ingredient_name'),
        quantity: parseFloat(formData.get('quantity')),
        unit: formData.get('unit') || 'piece',
        date: formData.get('date') || new Date().toISOString().split('T')[0]
      };

      const response = await apiService.post('/api/sales', saleData);

      if (response.success) {
        uiService.showSuccess('Sale recorded successfully');
        form.reset();

        // Reload dashboard
        setTimeout(() => this.loadDashboard(), 500);
      } else {
        throw new Error(response.error || 'Failed to record sale');
      }
    } catch (error) {
      this.handleError(error, 'Failed to record sale');
    } finally {
      const button = event.target.querySelector('button[type="submit"]');
      uiService.showLoading(false, button);
    }
  }

  /**
   * Handle API errors
   */
  handleError(error, defaultMessage = 'An error occurred') {
    let message = defaultMessage;

    if (error instanceof ApiError) {
      console.error(`[API Error] ${error.code}: ${error.message}`);
      message = defaultMessage;
    } else if (error instanceof Error) {
      console.error(`[Error] ${error.message}`);
      message = error.message;
    }

    uiService.showError(message);
  }

  /**
   * Cleanup
   */
  destroy() {
    chartManager.destroyAll();
  }
}

// Initialize on DOM ready
let dashboardManager = null;

document.addEventListener('DOMContentLoaded', () => {
  dashboardManager = new DashboardManager();

  // Auto-load if location is set
  const locationSelect = document.getElementById('location-selector');
  if (locationSelect && locationSelect.value) {
    dashboardManager.onLocationChange(locationSelect.value);
  }
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
  if (dashboardManager) {
    dashboardManager.destroy();
  }
});

// Export for testing
export { DashboardManager };
