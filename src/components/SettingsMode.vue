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
          stroke="#e74c3c" 
          stroke-width="2"
          style="width: 24px; height: 24px; display: block;"
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
        :class="{ 'settings-mode__city-item--dragging': draggedIndex === Number(index) }"
        draggable="true"
        @dragstart="handleDragStart(index, $event)"
        @dragover="handleDragOver(index, $event)"
        @dragend="handleDragEnd"
        @drop="handleDrop(index, $event)"
      >
        <!-- Drag Handle -->
        <div class="settings-mode__drag-handle" aria-label="Drag to reorder">
          <svg 
            class="settings-mode__drag-icon" 
            viewBox="0 0 24 24" 
            fill="#6b7280"
            style="width: 20px; height: 20px; display: block;"
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
            stroke="#e74c3c" 
            stroke-width="2"
            style="width: 20px; height: 20px; display: block;"
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
    (city: City) => city.name.toLowerCase() === trimmedName.toLowerCase()
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
function handleDragStart(index: number | string, event: DragEvent): void {
  const idx = typeof index === 'string' ? parseInt(index, 10) : Number(index);
  draggedIndex.value = idx;
  
  if (event.dataTransfer) {
    event.dataTransfer.effectAllowed = 'move';
    // Set a dummy value to enable drag
    event.dataTransfer.setData('text/plain', '');
  }
}

/**
 * Handle drag over
 */
function handleDragOver(index: number | string, event: DragEvent): void {
  event.preventDefault();
  
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = 'move';
  }

  // Convert index to number (Vue may pass it as string from template)
  const idx = typeof index === 'string' ? parseInt(index, 10) : Number(index);
  dragOverIndex.value = idx;
}

/**
 * Handle drop
 */
function handleDrop(dropIndex: number | string, event?: DragEvent): void {
  event?.preventDefault();
  
  // Early return if no dragged item
  if (draggedIndex.value === null) {
    return;
  }
  
  const dropIdx: number = typeof dropIndex === 'string' ? parseInt(dropIndex, 10) : Number(dropIndex);
  const draggedIdx: number = draggedIndex.value as number;
  
  // Don't do anything if dropping in the same position
  // Use Number() to ensure both are numbers for comparison
  if (Number(draggedIdx) === Number(dropIdx)) {
    return;
  }

  // Create a new array with reordered cities
  const newOrder = [...props.cities];
  const draggedCity = newOrder[Number(draggedIdx)];
  
  // Remove from old position
  newOrder.splice(Number(draggedIdx), 1);
  
  // Insert at new position
  newOrder.splice(Number(dropIdx), 0, draggedCity);

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

<style scoped>
.settings-mode {
  width: 100%;
  padding: 1.25rem;
  min-height: 400px;
  background: #f9fafb;
}

.settings-mode__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.settings-mode__title {
  font-size: 1.5rem;
  font-weight: 600;
  color: #111827;
  margin: 0;
  line-height: 1.2;
  letter-spacing: -0.01em;
}

.settings-mode__close-btn {
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
}

.settings-mode__close-btn:hover {
  background: #fee2e2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-mode__close-btn:active {
  transform: scale(0.95);
}

.settings-mode__close-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.5);
}

.settings-mode__close-icon {
  @apply w-6 h-6;
  color: #e74c3c !important;
  stroke: #e74c3c !important;
  fill: none !important;
  display: block;
  flex-shrink: 0;
}

.settings-mode__add-city {
  display: flex;
  gap: 0.75rem;
  margin-bottom: 1rem;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
}

.settings-mode__input {
  flex: 1;
  padding: 0.625rem 0.875rem;
  border: 1px solid #d1d5db;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  background: #ffffff;
  color: #111827;
}

.settings-mode__input::placeholder {
  color: #9ca3af;
}

.settings-mode__input:focus {
  outline: none;
  border-color: #3b82f6;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.settings-mode__add-btn {
  padding: 0.625rem 1.25rem;
  background: #3b82f6;
  color: #ffffff;
  border: none;
  border-radius: 0.5rem;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
}

.settings-mode__add-btn:hover:not(:disabled) {
  background: #2563eb;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.settings-mode__add-btn:active:not(:disabled) {
  transform: scale(0.98);
}

.settings-mode__add-btn:disabled {
  background: #9ca3af;
  cursor: not-allowed;
  opacity: 0.6;
}

.settings-mode__add-btn:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.3);
}

.settings-mode__error {
  @apply max-w-[600px] mx-auto mb-4 px-4 py-3 bg-danger-light border border-danger-border rounded-lg text-danger-text text-sm;
}

.settings-mode__city-list {
  max-width: 600px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.settings-mode__city-item {
  display: flex;
  align-items: center;
  gap: 0.875rem;
  padding: 1rem;
  background: #ffffff;
  border-radius: 0.5rem;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  cursor: move;
}

.settings-mode__city-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  transform: translateY(-1px);
}

.settings-mode__city-item--dragging {
  @apply opacity-50 scale-[0.98];
}

.settings-mode__drag-handle {
  @apply flex items-center justify-center w-6 h-6 text-gray-500 cursor-grab flex-shrink-0;
  @apply active:cursor-grabbing;
}

.settings-mode__drag-icon {
  @apply w-5 h-5;
  color: #6b7280 !important;
  fill: #6b7280 !important;
  display: block;
  flex-shrink: 0;
}

.settings-mode__city-info {
  @apply flex-1 flex flex-col gap-1;
}

.settings-mode__city-name {
  font-size: 1rem;
  font-weight: 500;
  color: #111827;
}

.settings-mode__city-country {
  font-size: 0.875rem;
  font-weight: 400;
  color: #6b7280;
}

.settings-mode__delete-btn {
  width: 2rem;
  height: 2rem;
  border: none;
  background: transparent;
  border-radius: 0.375rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.15s cubic-bezier(0.4, 0, 0.2, 1);
  flex-shrink: 0;
}

.settings-mode__delete-btn:hover:not(:disabled) {
  background: #fee2e2;
}

.settings-mode__delete-btn:active:not(:disabled) {
  transform: scale(0.95);
}

.settings-mode__delete-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.settings-mode__delete-btn:focus {
  outline: none;
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.settings-mode__delete-icon {
  @apply w-5 h-5;
  color: #e74c3c !important;
  stroke: #e74c3c !important;
  fill: none !important;
  display: block;
  flex-shrink: 0;
}

.settings-mode__empty {
  @apply py-10 px-5 text-center text-gray-500 text-base;
}

@media (max-width: 768px) {
  .settings-mode {
    padding: 1rem;
  }

  .settings-mode__title {
    font-size: 1.25rem;
  }

  .settings-mode__close-btn {
    width: 2rem;
    height: 2rem;
  }

  .settings-mode__close-icon {
    width: 1rem;
    height: 1rem;
  }

  .settings-mode__add-city {
    flex-direction: column;
  }

  .settings-mode__add-btn {
    width: 100%;
  }

  .settings-mode__city-item {
    padding: 0.875rem;
  }

  .settings-mode__city-name {
    font-size: 0.9375rem;
  }
}

@media (max-width: 480px) {
  .settings-mode {
    padding: 0.75rem;
  }

  .settings-mode__title {
    font-size: 1.125rem;
  }

  .settings-mode__header {
    margin-bottom: 1rem;
  }

  .settings-mode__city-item {
    gap: 0.625rem;
    padding: 0.75rem;
  }
}
</style>
