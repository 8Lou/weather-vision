/**
 * Service interfaces for the Weather Widget
 */

import type { City, WeatherData } from './models';

export interface WeatherService {
  getWeatherByCity(cityName: string): Promise<WeatherData>;
  getWeatherByCoordinates(lat: number, lon: number): Promise<WeatherData>;
  validateCity(cityName: string): Promise<boolean>;
}

export interface StorageService {
  getCities(): City[];
  saveCities(cities: City[]): void;
  clearCities(): void;
}

export interface GeolocationService {
  getCurrentPosition(): Promise<Coordinates>;
  getCityFromCoordinates(lat: number, lon: number): Promise<string>;
}

export interface Coordinates {
  lat: number;
  lon: number;
}
