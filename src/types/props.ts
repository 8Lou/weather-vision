/**
 * Component prop interfaces for the Weather Widget
 */

import type { City, WeatherData } from './models';

export interface DisplayModeProps {
  cities: City[];
}

export interface SettingsModeProps {
  cities: City[];
}

export interface WeatherCardProps {
  city: City;
  weather: WeatherData;
  isLoading: boolean;
}
