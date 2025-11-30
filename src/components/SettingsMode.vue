<template>
  <div class="settings-mode">
    <!-- Header with Close Button -->
    <div class="settings-mode__header">
      <h2 class="settings-mode__title">Manage Cities</h2>
      <button 
        class="settings-mode__close-btn"
        @click="handleCloseSettings"
        aria-label="Close settings"
        title="Close"
      >
        <svg 
          class="settings-mode__close-icon" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          stroke-width="2"
        >
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
      </button>
    </div>

    <!-- Add City Input -->
    <div class="settings-mode__add-city">
      <input
        v-model="newCityName"
        type="text"
        class="settings-mode__input"
        placeholder="Enter city name..."
        @keyup.enter="handleAddCity"
        aria-label="City name"
      />
      <button 
        class="settings-mode__add-btn"
        @click="handleAddCity"
        :disabled="!newCityName.trim()"
        aria-label="Add city"
      >
        Add City
      </button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="settings-mode__error">
      {{ errorMessage }}
    </div>

    <!-- City List -->
    <div class="settings-mode__city-list">
      <div
        v-for="(city, index) in cities"
        :key="city.id"
        class="settings-mode__city-item"
        :class="{ 'settings-mode__city-item--dragging': draggedIndex === index }"
        draggable="true"
        @dragstart="handleDragStart(index, $event)"
        @dragover="handleDragOver(index, $event)"
        @dragend="handleDragEnd"
        @drop="handleDrop(index)"
      >
        <!-- Drag Handle -->
        <div class="settings-mode__drag-handle" aria-label="Drag to reorder">
          <svg 
            class="settings-mode__drag-icon" 
            viewBox="0 0 24 24" 
            fill="currentColor"
          >
            <circle cx="9" cy="5" r="1.5"></circle>
            <circle cx="9" cy="12" r="1.5"></circle>
            <circle cx="9" cy="19" r="1.5"></circle>
            <circle cx="15" cy="5" r="1.5"></circle>
            <circle cx="15" cy="12" r="1.5"></circle>
            <circle cx="15" cy="19" r="1.5"></circle>
          </svg>
        </div>

        <!-- City Info -->
        <div class="settings-mode__city-info">
          <span class="settings-mode__city-name">{{ city.name }}</span>
          <span class="settings-mode__city-country">{{ city.country }}</span>
        </div>

        <!-- Delete Button -->
        <button
          class="settings-mode__delete-btn"
          @click="handleRemoveCity(city.id)"
          :disabled="cities.length === 1"
          :aria-label="`Delete ${city.name}`"
          :title="cities.length === 1 ? 'Cannot delete the last city' : `Delete ${city.name}`"
        >
          <svg 
            class="settings-mode__delete-icon" 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            stroke-width="2"
          >
            <polyline points="3 6 5 6 21 6"></polyline>
            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            <line x1="10" y1="11" x2="10" y2="17"></line>
            <line x1="14" y1="11" x2="14" y2="17"></line>
          </svg>
        </button>
      </div>

      <!-- Empty State -->
      <div v-if="cities.length === 0" class="settings-mode__empty">
        No cities added yet. Add a city above to get started.
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue';
import type { SettingsModeProps } from '../types/props';
import type { City } from '../types/models';

const props = defineProps<SettingsModeProps>();

const emit = defineEmits<{
  'close-settings': [];
  'add-city': [cityName: string];
  'remove-city': [cityId: string];
  'reorder-cities': [newOrder: City[]];
}>();

// State
const newCityName = ref('');
const errorMessage = ref('');
const draggedIndex = ref<number | null>(null);
const dragOverIndex = ref<number | null>(null);

/**
 * Validate city name
 */
function validateCityName(cityName: string): { valid: boolean; error?: string } {
  const trimmedName = cityName.trim();

  // Check for empty name
  if (!trimmedName) {
    return { valid: false, error: 'City name cannot be empty' };
  }

  // Check for duplicate cities (case-insensitive comparison)
  const isDuplicate = props.cities.some(
    city => city.name.toLowerCase() === trimmedName.toLowerCase()
  );

  if (isDuplicate) {
    return { valid: false, error: 'This city is already in your list' };
  }

  return { valid: true };
}

/**
 * Handle add city button click
 */
function handleAddCity(): void {
  const trimmedName = newCityName.value.trim();
  
  // Clear previous error
  errorMessage.value = '';

  // Validate city name
  const validation = validateCityName(trimmedName);
  
  if (!validation.valid) {
    errorMessage.value = validation.error || 'Invalid city name';
    return;
  }

  // Emit add-city event
  emit('add-city', trimmedName);

  // Clear input field
  newCityName.value = '';
}

/**
 * Handle close settings button click
 */
function handleCloseSettings(): void {
  emit('close-settings');
}

/**
 * Handle remove city button click
 */
function handleRemoveCity(cityId: string): void {
  // Don't allow removing the last city
  if (props.cities.length === 1) {
    return;
  }

  emit('remove-city', cityId);
}

/**
 * Handle drag start
 */
function handleDragStart(index: number, event: DragEvent): void {
  draggedIndex.value = index;
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    event.dataTransfer.setData('text/plain', index.toString());
  }
}

/**
 * Handle drag over
 */
function handleDragOver(index: number, event: DragEvent): void {
  event.preventDefault();
  
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  dragOverIndex.value = index;
}

/**
 * Handle drop
 */
function handleDrop(dropIndex: number): void {
  if (draggedIndex.value === null || draggedIndex.value === dropIndex) {
    return;
  }

  // Create a new array with reordered cities
  const newOrder = [...props.cities];
  const draggedCity = newOrder[draggedIndex.value];
  
  // Remove from old position
  newOrder.splice(draggedIndex.value, 1);
  
  // Insert at new position
  newOrder.splice(dropIndex, 0, draggedCity);

  // Emit reorder event
  emit('reorder-cities', newOrder);
}

/**
 * Handle drag end
 */
function handleDragEnd(): void {
  draggedIndex.value = null;
  dragOverIndex.value = null;
}
</script>

<style scoped lang="scss">
.settings-mode {
  width: 100%;
  padding: 20px;
  background: #f5f7fa;
  min-height: 400px;

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 24px;
  }

  &__title {
    font-size: 24px;
    font-weight: 600;
    color: #2c3e50;
    margin: 0;
  }

  &__close-btn {
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

    &:hover {
      background: #fee;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &:active {
      transform: scale(0.95);
    }

    &:focus {
      outline: 2px solid #e74c3c;
      outline-offset: 2px;
    }
  }

  &__close-icon {
    width: 24px;
    height: 24px;
    color: #e74c3c;
  }

  &__add-city {
    display: flex;
    gap: 12px;
    margin-bottom: 16px;
    max-width: 600px;
    margin-left: auto;
    margin-right: auto;
  }

  &__input {
    flex: 1;
    padding: 12px 16px;
    border: 2px solid #ddd;
    border-radius: 8px;
    font-size: 16px;
    transition: border-color 0.3s ease;

    &:focus {
      outline: none;
      border-color: #3498db;
    }

    &::placeholder {
      color: #999;
    }
  }

  &__add-btn {
    padding: 12px 24px;
    background: #3498db;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.3s ease;
    white-space: nowrap;

    &:hover:not(:disabled) {
      background: #2980b9;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(52, 152, 219, 0.3);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      background: #bdc3c7;
      cursor: not-allowed;
      opacity: 0.6;
    }

    &:focus {
      outline: 2px solid #3498db;
      outline-offset: 2px;
    }
  }

  &__error {
    max-width: 600px;
    margin: 0 auto 16px;
    padding: 12px 16px;
    background: #fee;
    border: 1px solid #fcc;
    border-radius: 8px;
    color: #c33;
    font-size: 14px;
  }

  &__city-list {
    max-width: 600px;
    margin: 0 auto;
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__city-item {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: white;
    border-radius: 12px;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
    cursor: move;

    &:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    &--dragging {
      opacity: 0.5;
      transform: scale(0.98);
    }
  }

  &__drag-handle {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    color: #95a5a6;
    cursor: grab;
    flex-shrink: 0;

    &:active {
      cursor: grabbing;
    }
  }

  &__drag-icon {
    width: 20px;
    height: 20px;
  }

  &__city-info {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 4px;
  }

  &__city-name {
    font-size: 18px;
    font-weight: 500;
    color: #2c3e50;
  }

  &__city-country {
    font-size: 14px;
    color: #7f8c8d;
  }

  &__delete-btn {
    width: 40px;
    height: 40px;
    border: none;
    background: transparent;
    border-radius: 8px;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.3s ease;
    flex-shrink: 0;

    &:hover:not(:disabled) {
      background: #fee;
    }

    &:active:not(:disabled) {
      transform: scale(0.95);
    }

    &:disabled {
      opacity: 0.3;
      cursor: not-allowed;
    }

    &:focus {
      outline: 2px solid #e74c3c;
      outline-offset: 2px;
    }
  }

  &__delete-icon {
    width: 20px;
    height: 20px;
    color: #e74c3c;
  }

  &__empty {
    padding: 40px 20px;
    text-align: center;
    color: #95a5a6;
    font-size: 16px;
  }
}

// Responsive adjustments
@media (max-width: 768px) {
  .settings-mode {
    padding: 16px;

    &__title {
      font-size: 20px;
    }

    &__close-btn {
      width: 40px;
      height: 40px;
    }

    &__close-icon {
      width: 20px;
      height: 20px;
    }

    &__add-city {
      flex-direction: column;
    }

    &__add-btn {
      width: 100%;
    }

    &__city-item {
      padding: 12px;
    }

    &__city-name {
      font-size: 16px;
    }
  }
}

@media (max-width: 480px) {
  .settings-mode {
    padding: 12px;

    &__title {
      font-size: 18px;
    }

    &__header {
      margin-bottom: 16px;
    }

    &__city-item {
      gap: 8px;
    }
  }
}
</style>
