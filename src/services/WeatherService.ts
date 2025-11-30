/**
 * WeatherService - Handles fetching weather data from OpenWeather API
 */

import type { WeatherData, OpenWeatherResponse, City } from '../types/models';

interface CacheEntry {
  data: WeatherData;
  timestamp: number;
}

const API_BASE_URL = 'https://api.openweathermap.org/data/2.5/weather';
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

export class WeatherServiceImpl {
  private apiKey: string;
  private cache: Map<string, CacheEntry> = new Map();

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  /**
   * Fetch weather data for a city by name
   */
  async getWeatherByCity(cityName: string): Promise<WeatherData> {
    const cacheKey = `city:${cityName.toLowerCase()}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${API_BASE_URL}?q=${encodeURIComponent(cityName)}&appid=${this.apiKey}&units=metric`;
    
    const response = await this.fetchWithErrorHandling(url);
    const weatherData = this.transformResponse(response);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    return weatherData;
  }

  /**
   * Fetch weather data for coordinates
   */
  async getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData> {
    const cacheKey = `coords:${lat},${lon}`;
    
    // Check cache first
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const url = `${API_BASE_URL}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric`;
    
    const response = await this.fetchWithErrorHandling(url);
    const weatherData = this.transformResponse(response);
    
    // Cache the result
    this.cache.set(cacheKey, {
      data: weatherData,
      timestamp: Date.now()
    });
    
    return weatherData;
  }

  /**
   * Validate if a city exists by attempting to fetch its weather
   */
  async validateCity(cityName: string): Promise<boolean> {
    try {
      await this.getWeatherByCity(cityName);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Fetch data from API with comprehensive error handling
   */
  private async fetchWithErrorHandling(url: string): Promise<OpenWeatherResponse> {
    try {
      const response = await fetch(url);

      // Handle rate limiting
      if (response.status === 429) {
        throw new Error('API rate limit exceeded. Please try again later.');
      }

      // Handle city not found
      if (response.status === 404) {
        throw new Error('City not found. Please check the city name and try again.');
      }

      // Handle unauthorized (invalid API key)
      if (response.status === 401) {
        throw new Error('Invalid API key. Please check your configuration.');
      }

      // Handle other non-OK responses
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }

      const data = await response.json();
      
      // Validate response structure
      if (!this.isValidResponse(data)) {
        throw new Error('Invalid response format from API');
      }

      return data as OpenWeatherResponse;
    } catch (error) {
      // Handle network failures
      if (error instanceof TypeError && error.message.includes('fetch')) {
        throw new Error('Network error. Please check your internet connection.');
      }
      
      // Re-throw other errors
      throw error;
    }
  }

  /**
   * Validate the structure of the API response
   */
  private isValidResponse(data: any): boolean {
    return (
      data &&
      typeof data === 'object' &&
      data.coord &&
      typeof data.coord.lat === 'number' &&
      typeof data.coord.lon === 'number' &&
      Array.isArray(data.weather) &&
      data.weather.length > 0 &&
      data.main &&
      typeof data.main.temp === 'number' &&
      typeof data.main.feels_like === 'number' &&
      typeof data.main.pressure === 'number' &&
      typeof data.main.humidity === 'number' &&
      data.wind &&
      typeof data.wind.speed === 'number' &&
      typeof data.wind.deg === 'number' &&
      typeof data.visibility === 'number' &&
      data.sys &&
      typeof data.sys.country === 'string' &&
      typeof data.name === 'string'
    );
  }

  /**
   * Transform OpenWeatherResponse to WeatherData format
   */
  private transformResponse(response: OpenWeatherResponse): WeatherData {
    const windDirection = this.degreesToDirection(response.wind.deg);
    const dewPoint = this.calculateDewPoint(response.main.temp, response.main.humidity);

    return {
      cityId: `${response.name}-${response.sys.country}`,
      temperature: Math.round(response.main.temp * 10) / 10,
      feelsLike: Math.round(response.main.feels_like * 10) / 10,
      description: response.weather[0].description,
      icon: response.weather[0].icon,
      wind: {
        speed: Math.round(response.wind.speed * 10) / 10,
        direction: windDirection,
        degrees: response.wind.deg
      },
      pressure: response.main.pressure,
      humidity: response.main.humidity,
      dewPoint: Math.round(dewPoint * 10) / 10,
      visibility: Math.round((response.visibility / 1000) * 10) / 10, // Convert meters to kilometers
      fetchedAt: Date.now()
    };
  }

  /**
   * Convert wind degrees to cardinal direction
   */
  private degreesToDirection(degrees: number): string {
    const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
    const index = Math.round(degrees / 22.5) % 16;
    return directions[index];
  }

  /**
   * Calculate dew point using Magnus formula
   */
  private calculateDewPoint(temperature: number, humidity: number): number {
    const a = 17.27;
    const b = 237.7;
    const alpha = ((a * temperature) / (b + temperature)) + Math.log(humidity / 100);
    return (b * alpha) / (a - alpha);
  }

  /**
   * Get data from cache if it exists and is not expired
   */
  private getFromCache(key: string): WeatherData | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    const age = Date.now() - entry.timestamp;
    
    // Check if cache is expired (older than 10 minutes)
    if (age > CACHE_DURATION_MS) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  /**
   * Clear all cached data
   */
  clearCache(): void {
    this.cache.clear();
  }
}

// Export a factory function for creating instances
export function createWeatherService(apiKey: string): WeatherServiceImpl {
  return new WeatherServiceImpl(apiKey);
}
