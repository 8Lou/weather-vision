/**
 * Core data models for the Weather Widget
 */

export interface City {
  id: string;              // Unique identifier (UUID)
  name: string;            // City name (e.g., "London")
  country: string;         // Country code (e.g., "UK")
  coordinates: {
    lat: number;
    lon: number;
  };
  addedAt: number;         // Timestamp when city was added
}

export interface WeatherData {
  cityId: string;          // Reference to City.id
  temperature: number;     // Current temperature in Celsius
  feelsLike: number;       // "Feels like" temperature in Celsius
  description: string;     // Weather description (e.g., "Broken clouds")
  icon: string;            // Weather icon code from API
  wind: {
    speed: number;         // Wind speed in m/s
    direction: string;     // Wind direction (e.g., "SSE")
    degrees: number;       // Wind direction in degrees
  };
  pressure: number;        // Atmospheric pressure in hPa
  humidity: number;        // Humidity percentage
  dewPoint: number;        // Dew point in Celsius
  visibility: number;      // Visibility in kilometers
  fetchedAt: number;       // Timestamp when data was fetched
}

export interface OpenWeatherResponse {
  coord: {
    lon: number;
    lat: number;
  };
  weather: Array<{
    id: number;
    main: string;
    description: string;
    icon: string;
  }>;
  main: {
    temp: number;
    feels_like: number;
    pressure: number;
    humidity: number;
  };
  wind: {
    speed: number;
    deg: number;
  };
  visibility: number;
  sys: {
    country: string;
  };
  name: string;
}

export interface StorageSchema {
  version: number;         // Schema version for migrations
  cities: City[];
  lastUpdated: number;
}
