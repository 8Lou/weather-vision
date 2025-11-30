<template>
  <div class="display-mode">
    <!-- Settings Button -->
    <button 
      class="display-mode__settings-btn"
      @click="handleOpenSettings"
      aria-label="Open settings"
      title="Settings"
    >
      <svg 
        class="display-mode__settings-icon" 
        viewBox="0 0 24 24" 
        fill="none" 
        stroke="#374151" 
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        xmlns="http://www.w3.org/2000/svg"
      >
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m9-9h-6m-6 0H3m15.364-6.364l-4.243 4.243m-2.828 2.828l-4.243 4.243M21.364 12.364l-4.243-4.243m-2.828-2.828l-4.243-4.243"></path>
      </svg>
    </button>

    <!-- City List -->
    <div class="display-mode__city-list">
      <WeatherCard
        v-for="city in cities"
        :key="city.id"
        :city="city"
        :weather="weatherDataMap.get(city.id) || createEmptyWeatherData(city.id)"
        :is-loading="loadingStates.get(city.id) || false"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue';
import WeatherCard from './WeatherCard.vue';
import { createWeatherService } from '../services/WeatherService';
import type { DisplayModeProps } from '../types/props';
import type { WeatherData } from '../types/models';

const props = defineProps<DisplayModeProps>();

const emit = defineEmits<{
  'open-settings': [];
}>();

// State
const weatherDataMap = ref<Map<string, WeatherData>>(new Map());
const loadingStates = ref<Map<string, boolean>>(new Map());
const refreshIntervalId = ref<number | null>(null);

// Initialize weather service with API key
const weatherService = createWeatherService(process.env.OPENWEATHER_API_KEY || '5ec582eefe33e199bc0245ff5a6aaa8e');

/**
 * Create empty weather data for loading state
 */
function createEmptyWeatherData(cityId: string): WeatherData {
  return {
    cityId,
    temperature: 0,
    feelsLike: 0,
    description: '',
    icon: '01d',
    wind: {
      speed: 0,
      direction: 'N',
      degrees: 0
    },
    pressure: 0,
    humidity: 0,
    dewPoint: 0,
    visibility: 0,
    fetchedAt: 0
  };
}

/**
 * Fetch weather data for all cities
 */
async function fetchWeatherForAllCities(): Promise<void> {
  for (const city of props.cities) {
    // Set loading state
    loadingStates.value.set(city.id, true);

    try {
      const weatherData = await weatherService.getWeatherByCity(city.name);
      weatherDataMap.value.set(city.id, weatherData);
    } catch (error) {
      console.error(`Failed to fetch weather for ${city.name}:`, error);
      // Keep loading state or show error - for now we'll just log
    } finally {
      loadingStates.value.set(city.id, false);
    }
  }
}

/**
 * Handle settings button click
 */
function handleOpenSettings(): void {
  emit('open-settings');
}

/**
 * Set up periodic refresh (every 10 minutes)
 */
function setupPeriodicRefresh(): void {
  // Refresh every 10 minutes (600,000 milliseconds)
  refreshIntervalId.value = window.setInterval(() => {
    fetchWeatherForAllCities();
  }, 10 * 60 * 1000);
}

/**
 * Clean up interval on unmount
 */
function cleanupPeriodicRefresh(): void {
  if (refreshIntervalId.value !== null) {
    clearInterval(refreshIntervalId.value);
    refreshIntervalId.value = null;
  }
}

// Lifecycle hooks
onMounted(() => {
  fetchWeatherForAllCities();
  setupPeriodicRefresh();
});

onUnmounted(() => {
  cleanupPeriodicRefresh();
});
</script>

<style scoped>
.display-mode {
  position: relative;
  width: 100%;
  min-height: 400px;
  padding: 1.25rem;
  background: #f9fafb;
}

.display-mode__settings-btn {
  position: absolute;
  top: 1.25rem;
  right: 1.25rem;
  width: 2.25rem;
  height: 2.25rem;
  border: none;
  background: #ffffff;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
}

.display-mode__settings-btn:hover {
  background: #f3f4f6;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: rotate(90deg);
}

.display-mode__settings-btn:active {
  transform: scale(0.95) rotate(90deg);
}

.display-mode__settings-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.5);
}

.display-mode__settings-icon {
  width: 18px;
  height: 18px;
  color: #4b5563;
  stroke: #4b5563;
  fill: none;
  display: block;
  flex-shrink: 0;
  pointer-events: none;
}

.display-mode__city-list {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  max-width: 600px;
  margin: 0 auto;
  padding-top: 1.25rem;
}

@media (max-width: 768px) {
  .display-mode {
    padding: 1rem;
  }

  .display-mode__settings-btn {
    top: 1rem;
    right: 1rem;
    width: 2rem;
    height: 2rem;
  }

  .display-mode__settings-icon {
    width: 16px;
    height: 16px;
  }

  .display-mode__city-list {
    padding-top: 1rem;
    gap: 0.875rem;
  }
}

@media (max-width: 480px) {
  .display-mode {
    padding: 0.75rem;
  }

  .display-mode__settings-btn {
    top: 0.75rem;
    right: 0.75rem;
    width: 2rem;
    height: 2rem;
  }

  .display-mode__city-list {
    padding-top: 0.75rem;
    gap: 0.75rem;
  }
}
</style>
