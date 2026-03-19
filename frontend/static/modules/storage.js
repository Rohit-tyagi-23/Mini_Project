/**
 * Storage Service Module
 * Handles localStorage with error handling and JSON serialization
 */

class StorageService {
  constructor(prefix = 'restaurant_ai_') {
    this.prefix = prefix;
  }

  /**
   * Set item in localStorage
   */
  setItem(key, value) {
    try {
      const storageKey = this.getKey(key);
      const serialized = typeof value === 'string' ? value : JSON.stringify(value);
      localStorage.setItem(storageKey, serialized);
      return true;
    } catch (error) {
      console.error('StorageService: Failed to set item', key, error);
      return false;
    }
  }

  /**
   * Get item from localStorage
   */
  getItem(key, parse = true) {
    try {
      const storageKey = this.getKey(key);
      const value = localStorage.getItem(storageKey);

      if (value === null) {
        return null;
      }

      if (!parse) {
        return value;
      }

      // Try to parse JSON
      try {
        return JSON.parse(value);
      } catch {
        // Return as string if not valid JSON
        return value;
      }
    } catch (error) {
      console.error('StorageService: Failed to get item', key, error);
      return null;
    }
  }

  /**
   * Remove item from localStorage
   */
  removeItem(key) {
    try {
      const storageKey = this.getKey(key);
      localStorage.removeItem(storageKey);
      return true;
    } catch (error) {
      console.error('StorageService: Failed to remove item', key, error);
      return false;
    }
  }

  /**
   * Clear all items with prefix
   */
  clear() {
    try {
      const keys = Object.keys(localStorage).filter(key =>
        key.startsWith(this.prefix)
      );
      keys.forEach(key => localStorage.removeItem(key));
      return true;
    } catch (error) {
      console.error('StorageService: Failed to clear storage', error);
      return false;
    }
  }

  /**
   * Get all items
   */
  getAll() {
    const items = {};
    try {
      Object.keys(localStorage).forEach(key => {
        if (key.startsWith(this.prefix)) {
          const itemKey = key.replace(this.prefix, '');
          items[itemKey] = this.getItem(itemKey);
        }
      });
    } catch (error) {
      console.error('StorageService: Failed to get all items', error);
    }
    return items;
  }

  /**
   * Get prefixed key
   */
  getKey(key) {
    return `${this.prefix}${key}`;
  }
}

// Export singleton
const storageService = new StorageService();

export { StorageService, storageService };
