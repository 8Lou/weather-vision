/**
 * Main entry point for the weather widget web component
 */

import './styles/main.css';
import { defineCustomElement } from 'vue';
import WeatherWidgetComponent from './components/WeatherWidget.vue';
import { globalErrorHandler } from './utils/errorHandler';

// Initialize global error handler
globalErrorHandler.initialize();

// Log errors to console in development
if (process.env.NODE_ENV === 'development') {
  globalErrorHandler.onError((error, context) => {
    console.error('[Weather Widget Error]', {
      error,
      context,
      timestamp: new Date().toISOString(),
    });
  });
}

const WeatherWidgetElement = defineCustomElement(WeatherWidgetComponent);

customElements.define('weather-widget', WeatherWidgetElement);

export default WeatherWidgetElement;
