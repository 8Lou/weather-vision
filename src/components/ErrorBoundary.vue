<template>
  <div v-if="hasError" class="error-boundary">
    <div class="error-boundary__content">
      <svg class="error-boundary__icon" viewBox="0 0 24 24" fill="none" stroke="#e74c3c" stroke-width="2" style="width: 64px; height: 64px; display: block;">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      
      <h3 class="error-boundary__title">Something went wrong</h3>
      
      <p class="error-boundary__message">
        {{ userFriendlyMessage }}
      </p>
      
      <div class="error-boundary__actions">
        <button 
          class="error-boundary__btn error-boundary__btn--primary"
          @click="handleRetry"
        >
          Try Again
        </button>
        
        <button 
          class="error-boundary__btn error-boundary__btn--secondary"
          @click="handleReset"
        >
          Reset Widget
        </button>
      </div>
      
      <details v-if="errorDetails" class="error-boundary__details">
        <summary class="error-boundary__details-summary">Technical Details</summary>
        <pre class="error-boundary__details-content">{{ errorDetails }}</pre>
      </details>
    </div>
  </div>
  
  <slot v-else></slot>
</template>

<script setup lang="ts">
import { ref, onErrorCaptured } from 'vue';

const emit = defineEmits<{
  'error': [error: Error];
  'retry': [];
  'reset': [];
}>();

// State
const hasError = ref(false);
const errorMessage = ref('');
const errorDetails = ref('');
const userFriendlyMessage = ref('');

/**
 * Capture errors from child components
 */
onErrorCaptured((error: Error, instance, info) => {
  console.error('Error boundary caught error:', error, info);
  
  hasError.value = true;
  errorMessage.value = error.message;
  errorDetails.value = `${error.name}: ${error.message}\n\nStack:\n${error.stack || 'No stack trace available'}\n\nComponent Info: ${info}`;
  
  // Generate user-friendly message based on error type
  userFriendlyMessage.value = getUserFriendlyMessage(error);
  
  // Emit error event
  emit('error', error);
  
  // Prevent error from propagating further
  return false;
});

/**
 * Generate user-friendly error message
 */
function getUserFriendlyMessage(error: Error): string {
  const message = error.message.toLowerCase();
  
  if (message.includes('network') || message.includes('fetch')) {
    return 'Unable to connect to the weather service. Please check your internet connection and try again.';
  }
  
  if (message.includes('api') || message.includes('rate limit')) {
    return 'The weather service is temporarily unavailable. Please try again in a few moments.';
  }
  
  if (message.includes('storage') || message.includes('quota')) {
    return 'Unable to save your settings. Your browser storage may be full.';
  }
  
  if (message.includes('geolocation') || message.includes('permission')) {
    return 'Unable to access your location. Please check your browser permissions.';
  }
  
  return 'An unexpected error occurred. Please try refreshing the page.';
}

/**
 * Handle retry button click
 */
function handleRetry(): void {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  userFriendlyMessage.value = '';
  
  emit('retry');
}

/**
 * Handle reset button click
 */
function handleReset(): void {
  hasError.value = false;
  errorMessage.value = '';
  errorDetails.value = '';
  userFriendlyMessage.value = '';
  
  emit('reset');
}

/**
 * Expose methods for parent components
 */
defineExpose({
  reset: handleReset,
  hasError: () => hasError.value,
});
</script>

<style scoped>
.error-boundary {
  @apply w-full min-h-[400px] flex items-center justify-center p-8 bg-gray-50;
}

.error-boundary__content {
  @apply max-w-[500px] w-full bg-white rounded-xl p-8 shadow-lg text-center;
}

.error-boundary__icon {
  @apply w-16 h-16 mx-auto mb-4;
  color: #e74c3c !important;
  stroke: #e74c3c !important;
  fill: none !important;
  display: block;
  flex-shrink: 0;
}

.error-boundary__title {
  @apply text-2xl font-semibold text-secondary m-0 mb-4;
}

.error-boundary__message {
  @apply text-base text-gray-600 leading-relaxed m-0 mb-8;
}

.error-boundary__actions {
  @apply flex gap-3 justify-center mb-6;
}

.error-boundary__btn {
  @apply px-6 py-3 border-none rounded-lg text-base font-medium cursor-pointer transition-all duration-300;
}

.error-boundary__btn--primary {
  @apply bg-primary text-white hover:bg-primary-dark hover:-translate-y-0.5 hover:shadow-[0_4px_12px_rgba(52,152,219,0.3)];
}

.error-boundary__btn--secondary {
  @apply bg-gray-200 text-secondary hover:bg-gray-400;
}

.error-boundary__details {
  @apply text-left mt-4 p-4 bg-gray-100 rounded-lg border border-gray-300;
}

.error-boundary__details-summary {
  @apply cursor-pointer font-medium text-gray-600 select-none hover:text-primary;
}

.error-boundary__details-content {
  @apply mt-2 p-2 bg-white rounded text-xs text-gray-700 overflow-x-auto whitespace-pre-wrap break-words;
}

@media (max-width: 480px) {
  .error-boundary {
    @apply p-4;
  }

  .error-boundary__content {
    @apply p-6;
  }

  .error-boundary__title {
    @apply text-xl;
  }

  .error-boundary__message {
    @apply text-sm;
  }

  .error-boundary__actions {
    @apply flex-col;
  }

  .error-boundary__btn {
    @apply w-full;
  }
}
</style>
