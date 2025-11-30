<template>
  <div class="weather-widget">
    <!-- Display Mode -->
    <DisplayMode
      v-if="mode === 'display'"
      :cities="cities"
      @open-settings="toggleMode"
    />

    <!-- Settings Mode -->
    <SettingsMode
      v-else
      :cities="cities"
      @close-settings="toggleMode"
      @add-city="addCity"
      @remove-city="removeCity"
      @reorder-cities="reorderCities"
    />

    <!-- Global Error Display -->
    <div v-if="globalError" class="weather-widget__error">
      {{ globalError }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import DisplayMode from './DisplayMode.vue';
import SettingsMode from './SettingsMode.vue';
import { storageService } from '../services/StorageService';
import { createGeolocationService } from '../services/GeolocationService';
import { createWeatherService } from '../services/WeatherService';
import type { City } from '../types/models';

// Get API key from environment variable
// TODO: Replace with actual API key configuration
const API_KEY = process.env.OPENWEATHER_API_KEY || 'demo';

// Initialize services
const geolocationService = createGeolocationService(API_KEY);
const weatherService = createWeatherService(API_KEY);

// State
const cities = ref<City[]>([]);
const mode = ref<'display' | 'settings'>('display');
const globalError = ref<string | null>(null);

/**
 * Load cities from LocalStorage
 */
function loadCitiesFromStorage(): void {
  try {
    const savedCities = storageService.getCities();
    cities.value = savedCities;
  } catch (error) {
    console.error('Error loading cities from storage:', error);
    globalError.value = 'Failed to load saved cities';
  }
}

/**
 * Save cities to LocalStorage
 */
function saveCitiesToStorage(): void {
  try {
    storageService.saveCities(cities.value);
  } catch (error) {
    console.error('Error saving cities to storage:', error);
    globalError.value = 'Failed to save cities. Your changes may not persist.';
  }
}

/**
 * Initialize with geolocation if no saved cities exist
 */
async function initializeWithGeolocation(): Promise<void> {
  try {
    // Get user's current position
    const coordinates = await geolocationService.getCurrentPosition();
    
    // Get city name from coordinates
    const cityName = await geolocationService.getCityFromCoordinates(
      coordinates.lat,
      coordinates.lon
    );
    
    // Fetch weather data to get full city information
    const weatherData = await weatherService.getWeatherByCoordinates(
      coordinates.lat,
      coordinates.lon
    );
    
    // Extract city name and country from the city name string
    // Format is typically "CityName, CountryCode"
    const [name, country] = cityName.split(',').map(s => s.trim());
    
    // Create city object
    const city: City = {
      id: `${name}-${country}-${Date.now()}`,
      name: name || cityName,
      country: country || 'Unknown',
      coordinates: {
        lat: coordinates.lat,
        lon: coordinates.lon
      },
      addedAt: Date.now()
    };
    
    // Add city to list
    cities.value = [city];
    
    // Save to storage
    saveCitiesToStorage();
  } catch (error) {
    console.error('Geolocation initialization failed:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('permission denied')) {
        globalError.value = 'Location access denied. Please add cities manually.';
      } else if (error.message.includes('unavailable')) {
        globalError.value = 'Unable to determine your location. Please add cities manually.';
      } else if (error.message.includes('timeout')) {
        globalError.value = 'Location request timed out. Please add cities manually.';
      } else {
        globalError.value = 'Failed to get your location. Please add cities manually.';
      }
    }
    
    // Switch to settings mode so user can add cities manually
    mode.value = 'settings';
  }
}

/**
 * Toggle between display and settings modes
 */
function toggleMode(): void {
  mode.value = mode.value === 'display' ? 'settings' : 'display';
  
  // Clear global error when switching modes
  globalError.value = null;
}

/**
 * Add a new city to the list
 * Validates the city with the API before adding
 */
async function addCity(cityName: string): Promise<void> {
  try {
    // Clear previous errors
    globalError.value = null;
    
    // Validate city by fetching its weather data
    const weatherData = await weatherService.getWeatherByCity(cityName);
    
    // Check for duplicates (case-insensitive)
    const isDuplicate = cities.value.some(
      city => city.name.toLowerCase() === cityName.toLowerCase()
    );
    
    if (isDuplicate) {
      globalError.value = 'This city is already in your list';
      return;
    }
    
    // Fetch full city data to get coordinates
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(cityName)}&appid=${API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    
    // Create city object
    const city: City = {
      id: `${data.name}-${data.sys.country}-${Date.now()}`,
      name: data.name,
      country: data.sys.country,
      coordinates: {
        lat: data.coord.lat,
        lon: data.coord.lon
      },
      addedAt: Date.now()
    };
    
    // Add city to list
    cities.value.push(city);
    
    // Save to storage
    saveCitiesToStorage();
  } catch (error) {
    console.error('Error adding city:', error);
    
    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('not found')) {
        globalError.value = 'City not found. Please check the name and try again.';
      } else if (error.message.includes('rate limit')) {
        globalError.value = 'Too many requests. Please try again later.';
      } else if (error.message.includes('network')) {
        globalError.value = 'Network error. Please check your connection.';
      } else {
        globalError.value = 'Failed to add city. Please try again.';
      }
    }
  }
}

/**
 * Remove a city from the list
 * Prevents removing the last city
 */
function removeCity(cityId: string): void {
  // Protect against removing the last city
  if (cities.value.length === 1) {
    globalError.value = 'Cannot remove the last city';
    return;
  }
  
  // Clear previous errors
  globalError.value = null;
  
  // Remove city from list
  cities.value = cities.value.filter(city => city.id !== cityId);
  
  // Save to storage
  saveCitiesToStorage();
}

/**
 * Reorder cities based on drag-and-drop
 */
function reorderCities(newOrder: City[]): void {
  // Clear previous errors
  globalError.value = null;
  
  // Update cities array
  cities.value = newOrder;
  
  // Save to storage
  saveCitiesToStorage();
}

// Lifecycle hooks
onMounted(async () => {
  // Load cities from storage
  loadCitiesFromStorage();
  
  // If no saved cities, initialize with geolocation
  if (cities.value.length === 0) {
    await initializeWithGeolocation();
  }
});
</script>

<style scoped lang="scss">
.weather-widget {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
  
  &__error {
    position: fixed;
    bottom: 20px;
    left: 50%;
    transform: translateX(-50%);
    max-width: 90%;
    padding: 16px 24px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    color: #c33;
    font-size: 14px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    animation: slideUp 0.3s ease;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateX(-50%) translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateX(-50%) translateY(0);
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .weather-widget {
    &__error {
      bottom: 16px;
      padding: 12px 20px;
      font-size: 13px;
    }
  }
}

@media (max-width: 480px) {
  .weather-widget {
    &__error {
      bottom: 12px;
      padding: 10px 16px;
      font-size: 12px;
      max-width: 95%;
    }
  }
}
</style>
