/**
 * API Service Module
 * Centralized API communication with proper error handling
 */

class ApiService {
  constructor(baseUrl = '') {
    this.baseUrl = baseUrl;
    this.timeout = 30000; // 30 seconds
    this.defaultHeaders = {
      'Content-Type': 'application/json'
    };
  }

  /**
   * Make API request with error handling
   */
  async request(endpoint, options = {}) {
    const {
      method = 'GET',
      body = null,
      headers = {},
      timeout = this.timeout
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions = {
        method,
        headers: { ...this.defaultHeaders, ...headers },
        signal: controller.signal
      };

      if (body && method !== 'GET') {
        fetchOptions.body = typeof body === 'string' ? body : JSON.stringify(body);
      }

      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);

      // Handle response
      if (!response.ok) {
        const errorData = await this.parseResponse(response);
        throw new ApiError(
          errorData.error || `HTTP ${response.status}`,
          response.status,
          url
        );
      }

      return await this.parseResponse(response);
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof ApiError) {
        throw error;
      }

      if (error.name === 'AbortError') {
        throw new ApiError('Request timeout', 'TIMEOUT', url);
      }

      if (error instanceof SyntaxError) {
        throw new ApiError('Invalid response format', 'PARSE_ERROR', url);
      }

      throw new ApiError(
        error.message || 'Network error',
        error.name || 'UNKNOWN',
        url
      );
    }
  }

  /**
   * Parse response based on content type
   */
  async parseResponse(response) {
    const contentType = response.headers.get('content-type');

    if (contentType?.includes('application/json')) {
      return await response.json();
    }

    return await response.text();
  }

  /**
   * GET request helper
   */
  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }

  /**
   * POST request helper
   */
  post(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'POST', body });
  }

  /**
   * PUT request helper
   */
  put(endpoint, body, options = {}) {
    return this.request(endpoint, { ...options, method: 'PUT', body });
  }

  /**
   * DELETE request helper
   */
  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }
}

/**
 * Custom API Error class
 */
class ApiError extends Error {
  constructor(message, code = 'UNKNOWN', url = '') {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.url = url;
  }

  /**
   * Get user-friendly error message
   */
  getUserMessage() {
    const messages = {
      'TIMEOUT': 'Request took too long. Please check your connection.',
      'PARSE_ERROR': 'Invalid response from server.',
      'NETWORK_ERROR': 'Network connection error. Please check your internet.',
      'UNAUTHORIZED': 'Please log in to continue.',
      'FORBIDDEN': 'You do not have permission to access this.',
      'NOT_FOUND': 'The requested resource was not found.',
      'CONFLICT': 'This resource already exists.',
      'SERVER_ERROR': 'Server error. Please try again later.',
      'UNKNOWN': 'An unknown error occurred.'
    };

    return messages[this.code] || messages['UNKNOWN'];
  }
}

// Export as singleton
const apiService = new ApiService();

export { ApiService, ApiError, apiService };
