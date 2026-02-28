/**
 * Chart Manager Module
 * Manages Chart.js instances with proper lifecycle
 */

class ChartManager {
  constructor() {
    this.charts = new Map();
  }

  /**
   * Create or update a chart
   */
  createChart(id, config) {
    // Destroy existing chart if it exists
    if (this.charts.has(id)) {
      this.destroyChart(id);
    }

    try {
      const element = document.getElementById(id);
      if (!element) {
        console.warn(`ChartManager: Element with id "${id}" not found`);
        return null;
      }

      const context = element.getContext('2d');
      const chart = new Chart(context, config);
      this.charts.set(id, chart);

      return chart;
    } catch (error) {
      console.error(`ChartManager: Failed to create chart "${id}"`, error);
      return null;
    }
  }

  /**
   * Get chart instance
   */
  getChart(id) {
    return this.charts.get(id);
  }

  /**
   * Update chart data
   */
  updateChart(id, data) {
    const chart = this.getChart(id);
    if (!chart) {
      console.warn(`ChartManager: Chart "${id}" not found`);
      return false;
    }

    try {
      if (data.labels) {
        chart.data.labels = data.labels;
      }
      if (data.datasets) {
        chart.data.datasets = data.datasets;
      }
      if (data.options) {
        Object.assign(chart.options, data.options);
      }

      chart.update();
      return true;
    } catch (error) {
      console.error(`ChartManager: Failed to update chart "${id}"`, error);
      return false;
    }
  }

  /**
   * Destroy chart
   */
  destroyChart(id) {
    const chart = this.charts.get(id);
    if (chart) {
      chart.destroy();
      this.charts.delete(id);
    }
  }

  /**
   * Destroy all charts
   */
  destroyAll() {
    this.charts.forEach((chart) => {
      chart.destroy();
    });
    this.charts.clear();
  }

  /**
   * Check if chart exists
   */
  exists(id) {
    return this.charts.has(id);
  }

  /**
   * Get all chart IDs
   */
  getIds() {
    return Array.from(this.charts.keys());
  }
}

// Export singleton
const chartManager = new ChartManager();

export { ChartManager, chartManager };
