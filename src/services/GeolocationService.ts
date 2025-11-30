/**
 * GeolocationService - Handles browser geolocation and reverse geocoding
 */

import type { Coordinates } from '../types/services';

const GEOCODING_API_BASE = 'https://api.openweathermap.org/geo/1.0/reverse';
const GEOLOCATION_TIMEOUT_MS = 10000; // 10 seconds

export class GeolocationServiceImpl {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Get the user's current position using the browser's Geolocation API
   * @throws Error with specific message for permission denied, position unavailable, or timeout
   */
  async getCurrentPosition(): Promise<Coordinates> {
    // Check if geolocation is supported
    if (!navigator.geolocation) {
      throw new Error('Geolocation is not supported by your browser');
    }

    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          resolve({
            lat: position.coords.latitude,
            lon: position.coords.longitude
          });
        },
        (error) => {
          // Handle different geolocation error types
          switch (error.code) {
            case error.PERMISSION_DENIED:
              reject(new Error('Geolocation permission denied. Please enable location access to use this feature.'));
              break;
            case error.POSITION_UNAVAILABLE:
              reject(new Error('Position unavailable. Unable to determine your location.'));
              break;
            case error.TIMEOUT:
              reject(new Error('Geolocation request timed out. Please try again.'));
              break;
            default:
              reject(new Error('An unknown error occurred while getting your location.'));
              break;
          }
        },
        {
          timeout: GEOLOCATION_TIMEOUT_MS,
          enableHighAccuracy: false,
          maximumAge: 300000 // Accept cached position up to 5 minutes old
        }
      );
    });
  }

  /**
   * Get city name from coordinates using OpenWeather reverse geocoding API
   * @param lat Latitude
   * @param lon Longitude
   * @returns City name in format "CityName, CountryCode"
   */
  async getCityFromCoordinates(lat: number, lon: number): Promise<string> {
    const url = `${GEOCODING_API_BASE}?lat=${lat}&lon=${lon}&limit=1&appid=${this.apiKey}`;

    try {
      const response = await fetch(url);

      // Handle unauthorized (invalid API key)
      if (response.status === 401) {
        throw new Error('Invalid API key for geocoding service');
      }

      // Handle other non-OK responses
      if (!response.ok) {
        throw new Error(`Geocoding request failed with status ${response.status}`);
      }

      const data = await response.json();

      // Validate response
      if (!Array.isArray(data) || data.length === 0) {
        throw new Error('No location found for the given coordinates');
      }

      const location = data[0];
      
      // Validate location data structure
      if (!location.name || !location.country) {
        throw new Error('Invalid geocoding response format');
      }

      // Return city name with country code
      return `${location.name}, ${location.country}`;
    } catch (error) {
      // Handle network failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error during reverse geocoding. Please check your internet connection.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }
}

/**
 * Factory function for creating GeolocationService instances
 */
export function createGeolocationService(apiKey: string): GeolocationServiceImpl {
  return new GeolocationServiceImpl(apiKey);
}
