<template>
  <div class="weather-card">
    <div v-if="isLoading" class="weather-card__loading">
      <div class="spinner"></div>
      <p>Loading weather data...</p>
    </div>
    
    <div v-else class="weather-card__content">
      <!-- City Header -->
      <div class="weather-card__header">
        <h3 class="weather-card__city">{{ city.name }}, {{ city.country }}</h3>
      </div>

      <!-- Main Weather Info -->
      <div class="weather-card__main">
        <div class="weather-card__icon-section">
          <!-- Icon Loading Placeholder -->
          <div v-if="iconLoading" class="weather-card__icon-placeholder">
            <div class="weather-card__icon-spinner"></div>
          </div>
          
          <!-- Weather Icon -->
          <img 
            ref="iconElement"
            v-show="!iconLoading && !iconError"
            :src="weatherIconUrl" 
            :alt="weather.description"
            class="weather-card__icon"
            @load="handleIconLoad"
            @error="handleIconError"
          />
          
          <!-- Fallback Icon/Text -->
          <div v-if="iconError" class="weather-card__icon-fallback">
            <svg 
              class="weather-card__fallback-icon"
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="#9ca3af" 
              stroke-width="2"
              style="width: 64px; height: 64px; display: block;"
            >
              <path d="M12 2L2 7l10 5 10-5-10-5z"></path>
              <path d="M2 17l10 5 10-5"></path>
              <path d="M2 12l10 5 10-5"></path>
            </svg>
          </div>
          
          <p class="weather-card__description">{{ weather.description || 'Weather' }}</p>
        </div>
        
        <div class="weather-card__temperature">
          <span class="weather-card__temp-main">{{ Math.round(weather.temperature) }}°C</span>
          <span class="weather-card__temp-feels">Feels like {{ Math.round(weather.feelsLike) }}°C</span>
        </div>
      </div>

      <!-- Weather Details Grid -->
      <div class="weather-card__details">
        <div class="weather-card__detail-item">
          <span class="weather-card__detail-label">Wind</span>
          <span class="weather-card__detail-value">{{ weather.wind.speed }} m/s {{ weather.wind.direction }}</span>
        </div>
        
        <div class="weather-card__detail-item">
          <span class="weather-card__detail-label">Pressure</span>
          <span class="weather-card__detail-value">{{ weather.pressure }} hPa</span>
        </div>
        
        <div class="weather-card__detail-item">
          <span class="weather-card__detail-label">Humidity</span>
          <span class="weather-card__detail-value">{{ weather.humidity }}%</span>
        </div>
        
        <div class="weather-card__detail-item">
          <span class="weather-card__detail-label">Dew Point</span>
          <span class="weather-card__detail-value">{{ Math.round(weather.dewPoint) }}°C</span>
        </div>
        
        <div class="weather-card__detail-item">
          <span class="weather-card__detail-label">Visibility</span>
          <span class="weather-card__detail-value">{{ weather.visibility }} km</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted, nextTick } from 'vue';
import type { WeatherCardProps } from '../types/props';

const props = defineProps<WeatherCardProps>();

const iconLoading = ref(true);
const iconError = ref(false);
const iconElement = ref<HTMLImageElement | null>(null);

const weatherIconUrl = computed(() => {
  const iconCode = props.weather.icon || '01d';
  return `https://openweathermap.org/img/wn/${iconCode}@4x.png`;
});

/**
 * Handle successful icon load
 */
function handleIconLoad(): void {
  iconLoading.value = false;
  iconError.value = false;
}

/**
 * Handle icon load error
 */
function handleIconError(): void {
  iconLoading.value = false;
  iconError.value = true;
}

/**
 * Check if image is already loaded (cached)
 */
function checkImageLoaded(): void {
  nextTick(() => {
    if (iconElement.value) {
      if (iconElement.value.complete && iconElement.value.naturalHeight !== 0) {
        handleIconLoad();
      } else if (iconElement.value.complete && iconElement.value.naturalHeight === 0) {
        // Image failed to load
        handleIconError();
      }
    }
  });
}

// Reset loading state when weather data changes
watch(() => props.weather.icon, () => {
  iconLoading.value = true;
  iconError.value = false;
  // Use setTimeout to ensure the DOM has updated
  setTimeout(() => {
    checkImageLoaded();
  }, 0);
});

// Check on mount if image is already loaded
onMounted(() => {
  // Delay check to ensure ref is set
  setTimeout(() => {
    checkImageLoaded();
  }, 0);
});
</script>

<style scoped>
.weather-card {
  background: #ffffff;
  border-radius: 0.75rem;
  padding: 1.25rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1), 0 1px 2px rgba(0, 0, 0, 0.06);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  border: none;
}

.weather-card:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1), 0 2px 4px rgba(0, 0, 0, 0.06);
  transform: translateY(-1px);
}

.weather-card__loading {
  @apply flex flex-col items-center justify-center py-10 px-5 text-gray-600;
}

.weather-card__loading .spinner {
  @apply w-10 h-10 border-4 border-gray-200 border-t-primary rounded-full mb-3;
  animation: spin 1s linear infinite;
}

.weather-card__loading p {
  @apply m-0 text-sm;
}

.weather-card__content {
  @apply flex flex-col gap-4;
}

.weather-card__header {
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.875rem;
  margin-bottom: 1rem;
}

.weather-card__city {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.weather-card__main {
  @apply flex justify-between items-center gap-5;
}

.weather-card__icon-section {
  @apply flex flex-col items-center gap-3;
  @apply min-h-[120px] justify-center;
}

.weather-card__icon {
  @apply w-24 h-24 object-contain;
  animation: fadeIn 0.4s ease-in-out forwards;
  display: block;
}

.weather-card__icon-placeholder {
  @apply w-24 h-24 flex items-center justify-center;
  @apply bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.weather-card__icon-spinner {
  @apply w-12 h-12 border-4 border-gray-200 border-t-primary rounded-full;
  animation: spin 1s linear infinite;
}

.weather-card__icon-fallback {
  @apply w-24 h-24 flex items-center justify-center;
  @apply bg-gradient-to-br from-gray-50 to-gray-100 rounded-2xl;
  box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.06);
}

.weather-card__fallback-icon {
  @apply w-16 h-16;
  color: #9ca3af !important;
  stroke: #9ca3af !important;
  fill: none !important;
  display: block;
  flex-shrink: 0;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: scale(0.9);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

.weather-card__description {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 500;
  color: #6b7280;
  text-transform: capitalize;
  text-align: center;
  margin-top: 0.5rem;
}

.weather-card__temperature {
  @apply flex flex-col items-end gap-1;
}

.weather-card__temp-main {
  font-size: 3rem;
  font-weight: 700;
  line-height: 1;
  color: #111827;
  letter-spacing: -0.02em;
}

.weather-card__temp-feels {
  font-size: 0.875rem;
  font-weight: 400;
  color: #6b7280;
  margin-top: 0.25rem;
}

.weather-card__details {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.875rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
  margin-top: 1rem;
}

.weather-card__detail-item {
  @apply flex flex-col gap-1;
}

.weather-card__detail-label {
  font-size: 0.75rem;
  font-weight: 500;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  margin-bottom: 0.25rem;
}

.weather-card__detail-value {
  font-size: 0.9375rem;
  font-weight: 600;
  color: #111827;
}

@media (max-width: 480px) {
  .weather-card {
    padding: 1rem;
  }

  .weather-card__city {
    font-size: 1.25rem;
  }

  .weather-card__main {
    flex-direction: column;
    align-items: center;
  }

  .weather-card__icon-section {
    min-height: 100px;
  }

  .weather-card__icon,
  .weather-card__icon-placeholder,
  .weather-card__icon-fallback {
    width: 5rem;
    height: 5rem;
  }

  .weather-card__fallback-icon {
    width: 3rem;
    height: 3rem;
  }

  .weather-card__temperature {
    align-items: center;
  }

  .weather-card__temp-main {
    font-size: 2.5rem;
  }

  .weather-card__details {
    grid-template-columns: 1fr;
    gap: 0.75rem;
  }
}
</style>
