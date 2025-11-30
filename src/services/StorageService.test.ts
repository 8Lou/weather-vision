/**
 * Unit tests for StorageService
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { storageService } from './StorageService';
import type { City } from '../types/models';

describe('StorageService', () => {
  // Clear localStorage before and after each test
  beforeEach(() => {
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  describe('getCities', () => {
    it('should return empty array when no data exists', () => {
      const cities = storageService.getCities();
      expect(cities).toEqual([]);
    });

    it('should return saved cities', () => {
      const mockCities: City[] = [
        {
          id: '1',
          name: 'London',
          country: 'UK',
          coordinates: { lat: 51.5074, lon: -0.1278 },
          addedAt: Date.now()
        }
      ];

      storageService.saveCities(mockCities);
      const cities = storageService.getCities();

      expect(cities).toEqual(mockCities);
    });

    it('should handle corrupted data gracefully', () => {
      // Set invalid JSON
      localStorage.setItem('weather-widget-cities', 'invalid json{');
      
      const cities = storageService.getCities();
      expect(cities).toEqual([]);
      
      // Verify corrupted data was cleared
      expect(localStorage.getItem('weather-widget-cities')).toBeNull();
    });

    it('should handle invalid schema structure', () => {
      // Set data with invalid schema
      localStorage.setItem('weather-widget-cities', JSON.stringify({
        version: 1,
        // Missing cities array
        lastUpdated: Date.now()
      }));
      
      const cities = storageService.getCities();
      expect(cities).toEqual([]);
    });

    it('should handle version mismatch', () => {
      localStorage.setItem('weather-widget-cities', JSON.stringify({
        version: 999,
        cities: [],
        lastUpdated: Date.now()
      }));
      
      const cities = storageService.getCities();
      expect(cities).toEqual([]);
    });
  });

  describe('saveCities', () => {
    it('should save cities to localStorage', () => {
      const mockCities: City[] = [
        {
          id: '1',
          name: 'Paris',
          country: 'FR',
          coordinates: { lat: 48.8566, lon: 2.3522 },
          addedAt: Date.now()
        }
      ];

      storageService.saveCities(mockCities);
      
      const stored = localStorage.getItem('weather-widget-cities');
      expect(stored).not.toBeNull();
      
      const parsed = JSON.parse(stored!);
      expect(parsed.version).toBe(1);
      expect(parsed.cities).toEqual(mockCities);
      expect(typeof parsed.lastUpdated).toBe('number');
    });

    it('should save multiple cities', () => {
      const mockCities: City[] = [
        {
          id: '1',
          name: 'London',
          country: 'UK',
          coordinates: { lat: 51.5074, lon: -0.1278 },
          addedAt: Date.now()
        },
        {
          id: '2',
          name: 'Paris',
          country: 'FR',
          coordinates: { lat: 48.8566, lon: 2.3522 },
          addedAt: Date.now()
        }
      ];

      storageService.saveCities(mockCities);
      const cities = storageService.getCities();

      expect(cities).toHaveLength(2);
      expect(cities).toEqual(mockCities);
    });

    it('should overwrite existing data', () => {
      const firstCities: City[] = [
        {
          id: '1',
          name: 'London',
          country: 'UK',
          coordinates: { lat: 51.5074, lon: -0.1278 },
          addedAt: Date.now()
        }
      ];

      const secondCities: City[] = [
        {
          id: '2',
          name: 'Paris',
          country: 'FR',
          coordinates: { lat: 48.8566, lon: 2.3522 },
          addedAt: Date.now()
        }
      ];

      storageService.saveCities(firstCities);
      storageService.saveCities(secondCities);
      
      const cities = storageService.getCities();
      expect(cities).toEqual(secondCities);
    });
  });

  describe('clearCities', () => {
    it('should clear all cities from localStorage', () => {
      const mockCities: City[] = [
        {
          id: '1',
          name: 'London',
          country: 'UK',
          coordinates: { lat: 51.5074, lon: -0.1278 },
          addedAt: Date.now()
        }
      ];

      storageService.saveCities(mockCities);
      expect(localStorage.getItem('weather-widget-cities')).not.toBeNull();

      storageService.clearCities();
      expect(localStorage.getItem('weather-widget-cities')).toBeNull();
    });

    it('should not throw when clearing empty storage', () => {
      expect(() => storageService.clearCities()).not.toThrow();
    });
  });

  describe('round-trip', () => {
    it('should preserve city data through save and load cycle', () => {
      const mockCities: City[] = [
        {
          id: 'abc-123',
          name: 'Tokyo',
          country: 'JP',
          coordinates: { lat: 35.6762, lon: 139.6503 },
          addedAt: 1234567890
        },
        {
          id: 'def-456',
          name: 'New York',
          country: 'US',
          coordinates: { lat: 40.7128, lon: -74.0060 },
          addedAt: 9876543210
        }
      ];

      storageService.saveCities(mockCities);
      const loadedCities = storageService.getCities();

      expect(loadedCities).toEqual(mockCities);
      expect(loadedCities).toHaveLength(mockCities.length);
      
      // Verify each field is preserved
      loadedCities.forEach((city, index) => {
        expect(city.id).toBe(mockCities[index].id);
        expect(city.name).toBe(mockCities[index].name);
        expect(city.country).toBe(mockCities[index].country);
        expect(city.coordinates.lat).toBe(mockCities[index].coordinates.lat);
        expect(city.coordinates.lon).toBe(mockCities[index].coordinates.lon);
        expect(city.addedAt).toBe(mockCities[index].addedAt);
      });
    });
  });
});
