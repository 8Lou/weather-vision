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
        stroke="#4b5563" 
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
        xmlns="http://www.w3.org/2000/svg"
        width="18"
        height="18"
        style="display: block; width: 18px; height: 18px;"
      >
        <circle cx="12" cy="12" r="3" stroke="#4b5563" fill="none" stroke-width="2"></circle>
        <line x1="12" y1="1" x2="12" y2="6" stroke="#4b5563" stroke-width="2"></line>
        <line x1="12" y1="18" x2="12" y2="23" stroke="#4b5563" stroke-width="2"></line>
        <line x1="4.22" y1="4.22" x2="7.76" y2="7.76" stroke="#4b5563" stroke-width="2"></line>
        <line x1="16.24" y1="16.24" x2="19.78" y2="19.78" stroke="#4b5563" stroke-width="2"></line>
        <line x1="1" y1="12" x2="6" y2="12" stroke="#4b5563" stroke-width="2"></line>
        <line x1="18" y1="12" x2="23" y2="12" stroke="#4b5563" stroke-width="2"></line>
        <line x1="4.22" y1="19.78" x2="7.76" y2="16.24" stroke="#4b5563" stroke-width="2"></line>
        <line x1="16.24" y1="7.76" x2="19.78" y2="4.22" stroke="#4b5563" stroke-width="2"></line>
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
  min-width: 2.25rem;
  min-height: 2.25rem;
  border: none;
  background: #ffffff;
  border-radius: 0.5rem;
  cursor: pointer;
  display: flex !important;
  align-items: center;
  justify-content: center;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  z-index: 10;
  padding: 0;
  margin: 0;
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

.display-mode__settings-btn svg {
  display: block !important;
  visibility: visible !important;
  opacity: 1 !important;
}

.display-mode__settings-icon {
  width: 18px !important;
  height: 18px !important;
  min-width: 18px;
  min-height: 18px;
  color: #4b5563 !important;
  stroke: #4b5563 !important;
  fill: none !important;
  display: block !important;
  flex-shrink: 0;
  pointer-events: none;
  vertical-align: middle;
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
