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
          <img 
            :src="weatherIconUrl" 
            :alt="weather.description"
            class="weather-card__icon"
          />
          <p class="weather-card__description">{{ weather.description }}</p>
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
import { computed } from 'vue';
import type { WeatherCardProps } from '../types/props';

const props = defineProps<WeatherCardProps>();

const weatherIconUrl = computed(() => {
  return `https://openweathermap.org/img/wn/${props.weather.icon}@2x.png`;
});
</script>

<style scoped lang="scss">
.weather-card {
  background: #ffffff;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;

  &:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 40px 20px;
    color: #666;

    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin-bottom: 12px;
    }

    p {
      margin: 0;
      font-size: 14px;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__header {
    border-bottom: 1px solid #e0e0e0;
    padding-bottom: 12px;
  }

  &__city {
    margin: 0;
    font-size: 24px;
    font-weight: 600;
    color: #2c3e50;
  }

  &__main {
    display: flex;
    justify-content: space-between;
    align-items: center;
    gap: 20px;
  }

  &__icon-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }

  &__icon {
    width: 80px;
    height: 80px;
  }

  &__description {
    margin: 0;
    font-size: 16px;
    color: #555;
    text-transform: capitalize;
    text-align: center;
  }

  &__temperature {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 4px;
  }

  &__temp-main {
    font-size: 48px;
    font-weight: 700;
    color: #2c3e50;
    line-height: 1;
  }

  &__temp-feels {
    font-size: 14px;
    color: #777;
  }

  &__details {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 12px;
    padding-top: 12px;
    border-top: 1px solid #e0e0e0;
  }

  &__detail-item {
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__detail-label {
    font-size: 12px;
    color: #999;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  &__detail-value {
    font-size: 16px;
    color: #2c3e50;
    font-weight: 500;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// Responsive adjustments
@media (max-width: 480px) {
  .weather-card {
    padding: 16px;

    &__city {
      font-size: 20px;
    }

    &__main {
      flex-direction: column;
      align-items: center;
    }

    &__temperature {
      align-items: center;
    }

    &__temp-main {
      font-size: 40px;
    }

    &__details {
      grid-template-columns: 1fr;
    }
  }
}
</style>
