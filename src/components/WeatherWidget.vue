<template>
  <div class="weather-widget">
    <ErrorBoundary @retry="handleErrorRetry" @reset="handleErrorReset">
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
    </ErrorBoundary>

    <!-- Global Error Display (outside ErrorBoundary) -->
    <div v-if="globalError" class="weather-widget__error">
      {{ globalError }}
      <button 
        v-if="canRetry"
        class="weather-widget__error-retry"
        @click="retryLastAction"
      >
        Retry
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import ErrorBoundary from './ErrorBoundary.vue';
import DisplayMode from './DisplayMode.vue';
import SettingsMode from './SettingsMode.vue';
import { storageService } from '../services/StorageService';
import { createGeolocationService } from '../services/GeolocationService';
import { createWeatherService } from '../services/WeatherService';
import { retryWithBackoff, isTransientError, getUserFriendlyMessage } from '../utils/errorHandler';
import type { City } from '../types/models';

// Get API key from environment variable
// Falls back to provided API key if env var is not set
const API_KEY = process.env.OPENWEATHER_API_KEY || '5ec582eefe33e199bc0245ff5a6aaa8e';

// Log API key for debugging (only first few characters for security)
console.log('[Weather Widget] API Key loaded:', API_KEY ? `${API_KEY.substring(0, 8)}...` : 'NOT SET');

// Initialize services
const geolocationService = createGeolocationService(API_KEY);
const weatherService = createWeatherService(API_KEY);

// State
const cities = ref<City[]>([]);
const mode = ref<'display' | 'settings'>('display');
const globalError = ref<string | null>(null);
const canRetry = ref(false);
const lastFailedAction = ref<(() => Promise<void>) | null>(null);

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
 * Retry the last failed action
 */
async function retryLastAction(): Promise<void> {
  if (lastFailedAction.value) {
    globalError.value = null;
    canRetry.value = false;
    
    try {
      await lastFailedAction.value();
      lastFailedAction.value = null;
    } catch (error) {
      // Error will be handled by the action itself
    }
  }
}

/**
 * Handle error boundary retry
 */
function handleErrorRetry(): void {
  // Reload the widget
  window.location.reload();
}

/**
 * Handle error boundary reset
 */
function handleErrorReset(): void {
  // Clear all data and reset to initial state
  try {
    storageService.clearCities();
    cities.value = [];
    mode.value = 'settings';
    globalError.value = null;
    canRetry.value = false;
    lastFailedAction.value = null;
  } catch (error) {
    console.error('Error resetting widget:', error);
  }
}

/**
 * Initialize with geolocation if no saved cities exist
 */
async function initializeWithGeolocation(): Promise<void> {
  const action = async () => {
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
  };

  try {
    // Use retry mechanism for transient errors
    await retryWithBackoff(action, {
      maxAttempts: 2,
      delayMs: 1000,
      onRetry: (attempt, error) => {
        console.log(`Retrying geolocation (attempt ${attempt}):`, error.message);
      },
    });
  } catch (error) {
    console.error('Geolocation initialization failed:', error);
    
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Store action for retry if it's a transient error
    if (isTransientError(err)) {
      lastFailedAction.value = action;
      canRetry.value = true;
    }
    
    // Get user-friendly message
    globalError.value = getUserFriendlyMessage(err);
    
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
  const action = async () => {
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
  };

  try {
    // Clear previous errors
    globalError.value = null;
    canRetry.value = false;
    
    // Use retry mechanism for transient errors
    await retryWithBackoff(action, {
      maxAttempts: 3,
      delayMs: 1000,
      backoffMultiplier: 2,
      onRetry: (attempt, error) => {
        console.log(`Retrying add city (attempt ${attempt}):`, error.message);
      },
    });
  } catch (error) {
    console.error('Error adding city:', error);
    
    const err = error instanceof Error ? error : new Error(String(error));
    
    // Store action for retry if it's a transient error
    if (isTransientError(err)) {
      lastFailedAction.value = () => addCity(cityName);
      canRetry.value = true;
    }
    
    // Get user-friendly message
    const friendlyMessage = getUserFriendlyMessage(err);
    console.log('[Weather Widget] Setting error message:', friendlyMessage);
    globalError.value = friendlyMessage;
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

<style scoped>
.weather-widget {
  position: relative;
  width: 100%;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}

.weather-widget__error {
  @apply fixed bottom-5 left-1/2 -translate-x-1/2 max-w-[90%] px-6 py-4 bg-danger-light border border-danger-border rounded-lg text-danger-text text-sm shadow-lg z-[1000] flex items-center gap-3;
  animation: slideUp 0.3s ease;
}

.weather-widget__error-retry {
  @apply px-3 py-1.5 bg-danger text-white border-none rounded font-medium text-[13px] cursor-pointer transition-all duration-200 whitespace-nowrap hover:bg-[#c0392b] active:scale-95;
}

@media (max-width: 768px) {
  .weather-widget__error {
    @apply bottom-4 px-5 py-3 text-[13px];
  }
}

@media (max-width: 480px) {
  .weather-widget__error {
    @apply bottom-3 px-4 py-2.5 text-xs max-w-[95%];
  }
}
</style>
