/**
 * StorageService - Handles LocalStorage operations for city data persistence
 * 
 * Implements JSON serialization/deserialization with error handling for:
 * - Storage quota exceeded
 * - Corrupted data
 * - Storage unavailable (private browsing)
 */

import type { City, StorageSchema } from '../types/models';
import type { StorageService as IStorageService } from '../types/services';

const STORAGE_KEY = 'weather-widget-cities';
const STORAGE_VERSION = 1;

class StorageService implements IStorageService {
  /**
   * Get cities from LocalStorage
   * Returns empty array if no data exists or if data is corrupted
   */
  getCities(): City[] {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable()) {
        console.warn('LocalStorage is not available. Operating in memory-only mode.');
        return [];
      }

      const data = localStorage.getItem(STORAGE_KEY);
      
      if (!data) {
        return [];
      }

      // Deserialize JSON data
      const schema: StorageSchema = JSON.parse(data);

      // Validate schema structure
      if (!this.isValidSchema(schema)) {
        console.error('Corrupted storage data detected. Clearing and starting fresh.');
        this.clearCities();
        return [];
      }

      // Handle version migrations if needed
      if (schema.version !== STORAGE_VERSION) {
        console.warn(`Storage version mismatch. Expected ${STORAGE_VERSION}, got ${schema.version}`);
        // For now, clear and start fresh. In future, implement migrations.
        this.clearCities();
        return [];
      }

      return schema.cities;
    } catch (error) {
      // Handle JSON parse errors or other exceptions
      console.error('Error reading from LocalStorage:', error);
      
      // Clear corrupted data
      try {
        this.clearCities();
      } catch (clearError) {
        console.error('Failed to clear corrupted data:', clearError);
      }
      
      return [];
    }
  }

  /**
   * Save cities to LocalStorage
   * Handles quota exceeded errors gracefully
   */
  saveCities(cities: City[]): void {
    try {
      // Check if localStorage is available
      if (!this.isStorageAvailable()) {
        console.warn('LocalStorage is not available. Changes will not persist.');
        return;
      }

      // Create storage schema
      const schema: StorageSchema = {
        version: STORAGE_VERSION,
        cities,
        lastUpdated: Date.now()
      };

      // Serialize to JSON
      const data = JSON.stringify(schema);

      // Save to localStorage
      localStorage.setItem(STORAGE_KEY, data);
    } catch (error) {
      // Handle quota exceeded error
      if (this.isQuotaExceededError(error)) {
        console.error('LocalStorage quota exceeded. Unable to save cities.');
        // Optionally, try to free up space by clearing old data
        // For now, just warn the user
        throw new Error('Storage quota exceeded. Please clear some browser data.');
      } else {
        console.error('Error saving to LocalStorage:', error);
        throw error;
      }
    }
  }

  /**
   * Clear all cities from LocalStorage
   */
  clearCities(): void {
    try {
      if (!this.isStorageAvailable()) {
        return;
      }

      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Error clearing LocalStorage:', error);
      throw error;
    }
  }

  /**
   * Check if LocalStorage is available
   * Returns false in private browsing mode or if localStorage is disabled
   */
  private isStorageAvailable(): boolean {
    try {
      const testKey = '__storage_test__';
      localStorage.setItem(testKey, 'test');
      localStorage.removeItem(testKey);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Validate that the schema has the expected structure
   */
  private isValidSchema(schema: any): schema is StorageSchema {
    return (
      schema &&
      typeof schema === 'object' &&
      typeof schema.version === 'number' &&
      Array.isArray(schema.cities) &&
      typeof schema.lastUpdated === 'number' &&
      this.areValidCities(schema.cities)
    );
  }

  /**
   * Validate that all cities have the required structure
   */
  private areValidCities(cities: any[]): boolean {
    return cities.every(city => 
      city &&
      typeof city === 'object' &&
      typeof city.id === 'string' &&
      typeof city.name === 'string' &&
      typeof city.country === 'string' &&
      city.coordinates &&
      typeof city.coordinates.lat === 'number' &&
      typeof city.coordinates.lon === 'number' &&
      typeof city.addedAt === 'number'
    );
  }

  /**
   * Check if an error is a quota exceeded error
   */
  private isQuotaExceededError(error: any): boolean {
    return (
      error instanceof DOMException &&
      (
        // Most browsers
        error.code === 22 ||
        // Firefox
        error.code === 1014 ||
        // Test name field too, because code might not be present
        error.name === 'QuotaExceededError' ||
        error.name === 'NS_ERROR_DOM_QUOTA_REACHED'
      )
    );
  }
}

// Export singleton instance
export const storageService = new StorageService();
export default storageService;
