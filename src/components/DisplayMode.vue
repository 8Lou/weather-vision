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
        stroke="currentColor" 
        stroke-width="2"
      >
        <circle cx="12" cy="12" r="3"></circle>
        <path d="M12 1v6m0 6v6m5.2-13.2l-4.2 4.2m-2 2l-4.2 4.2m13.2-5.2l-6 0m-6 0l-6 0m13.2 5.2l-4.2-4.2m-2-2l-4.2-4.2"></path>
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
// TODO: Replace with actual API key from environment variable
const weatherService = createWeatherService(process.env.OPENWEATHER_API_KEY || 'demo');

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

<style scoped lang="scss">
.display-mode {
  position: relative;
  width: 100%;
  padding: 20px;
  background: #f5f7fa;
  min-height: 400px;

  &__settings-btn {
    position: absolute;
    top: 20px;
    right: 20px;
    width: 44px;
    height: 44px;
    border: none;
    background: #ffffff;
    border-radius: 50%;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    z-index: 10;

    &:hover {
      background: #f0f0f0;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      transform: rotate(45deg);
    }

    &:active {
      transform: rotate(45deg) scale(0.95);
    }

    &:focus {
      outline: 2px solid #3498db;
      outline-offset: 2px;
    }
  }

  &__settings-icon {
    width: 24px;
    height: 24px;
    color: #555;
    transition: transform 0.3s ease;
  }

  &__city-list {
    display: flex;
    flex-direction: column;
    gap: 16px;
    max-width: 600px;
    margin: 0 auto;
    padding-top: 20px;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .display-mode {
    padding: 16px;

    &__settings-btn {
      top: 16px;
      right: 16px;
      width: 40px;
      height: 40px;
    }

    &__settings-icon {
      width: 20px;
      height: 20px;
    }

    &__city-list {
      padding-top: 16px;
      gap: 12px;
    }
  }
}

@media (max-width: 480px) {
  .display-mode {
    padding: 12px;

    &__settings-btn {
      top: 12px;
      right: 12px;
    }

    &__city-list {
      padding-top: 12px;
    }
  }
}
</style>
