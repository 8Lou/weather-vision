/**
 * Global Error Handler Utility
 * 
 * Provides centralized error handling, logging, and retry mechanisms
 * for the weather widget application.
 */

export interface RetryOptions {
  maxAttempts?: number;
  delayMs?: number;
  backoffMultiplier?: number;
  onRetry?: (attempt: number, error: Error) => void;
}

export interface ErrorContext {
  component?: string;
  action?: string;
  metadata?: Record<string, unknown>;
}

/**
 * Custom error class for weather widget errors
 */
export class WeatherWidgetError extends Error {
  constructor(
    message: string,
    public code: string,
    public context?: ErrorContext,
    public originalError?: Error
  ) {
    super(message);
    this.name = 'WeatherWidgetError';
  }
}

/**
 * Error codes for different error types
 */
export const ErrorCodes = {
  NETWORK_ERROR: 'NETWORK_ERROR',
  API_ERROR: 'API_ERROR',
  RATE_LIMIT_ERROR: 'RATE_LIMIT_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  GEOLOCATION_ERROR: 'GEOLOCATION_ERROR',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

/**
 * Global error handler instance
 */
class GlobalErrorHandler {
  private errorListeners: Array<(error: Error, context?: ErrorContext) => void> = [];
  private isInitialized = false;

  /**
   * Initialize global error handlers
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }

    // Handle uncaught errors
    window.addEventListener('error', (event) => {
      this.handleError(event.error || new Error(event.message), {
        component: 'window',
        action: 'uncaught_error',
        metadata: {
          filename: event.filename,
          lineno: event.lineno,
          colno: event.colno,
        },
      });
    });

    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      this.handleError(
        event.reason instanceof Error ? event.reason : new Error(String(event.reason)),
        {
          component: 'window',
          action: 'unhandled_rejection',
        }
      );
    });

    this.isInitialized = true;
  }

  /**
   * Register an error listener
   */
  onError(listener: (error: Error, context?: ErrorContext) => void): () => void {
    this.errorListeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      const index = this.errorListeners.indexOf(listener);
      if (index > -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  /**
   * Handle an error
   */
  handleError(error: Error, context?: ErrorContext): void {
    // Log to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('[WeatherWidget Error]', error, context);
    }

    // Notify all listeners
    this.errorListeners.forEach((listener) => {
      try {
        listener(error, context);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }

  /**
   * Create a typed error
   */
  createError(
    message: string,
    code: string,
    context?: ErrorContext,
    originalError?: Error
  ): WeatherWidgetError {
    return new WeatherWidgetError(message, code, context, originalError);
  }
}

// Export singleton instance
export const globalErrorHandler = new GlobalErrorHandler();

/**
 * Retry a function with exponential backoff
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    delayMs = 1000,
    backoffMultiplier = 2,
    onRetry,
  } = options;

  let lastError: Error | undefined;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      // If this was the last attempt, throw the error
      if (attempt === maxAttempts) {
        break;
      }

      // Call retry callback if provided
      if (onRetry) {
        onRetry(attempt, lastError);
      }

      // Calculate delay with exponential backoff
      const delay = delayMs * Math.pow(backoffMultiplier, attempt - 1);

      // Wait before retrying
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  // If we get here, all attempts failed
  throw lastError || new Error('All retry attempts failed');
}

/**
 * Check if an error is a network error
 */
export function isNetworkError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return (
    message.includes('network') ||
    message.includes('fetch') ||
    message.includes('connection') ||
    message.includes('timeout') ||
    error.name === 'NetworkError' ||
    error.name === 'TypeError'
  );
}

/**
 * Check if an error is a rate limit error
 */
export function isRateLimitError(error: Error): boolean {
  const message = error.message.toLowerCase();
  return message.includes('rate limit') || message.includes('429');
}

/**
 * Check if an error is transient (can be retried)
 */
export function isTransientError(error: Error): boolean {
  const message = error.message.toLowerCase();
  
  // Don't retry authentication errors (401), not found (404), or invalid API key
  if (message.includes('invalid api key') || 
      message.includes('unauthorized') || 
      message.includes('401') ||
      message.includes('not found') ||
      message.includes('404')) {
    return false;
  }
  
  return isNetworkError(error) || isRateLimitError(error);
}

/**
 * Get user-friendly error message
 */
export function getUserFriendlyMessage(error: Error): string {
  if (error instanceof WeatherWidgetError) {
    return error.message;
  }

  const message = error.message.toLowerCase();

  if (message.includes('invalid api key') || message.includes('unauthorized') || message.includes('401')) {
    return 'Weather service configuration error. Please contact the website administrator.';
  }

  if (isNetworkError(error)) {
    return 'Unable to connect to the weather service. Please check your internet connection.';
  }

  if (isRateLimitError(error)) {
    return 'Too many requests. Please try again in a few moments.';
  }

  if (message.includes('not found') || message.includes('404')) {
    return 'City not found. Please check the name and try again.';
  }

  if (message.includes('storage') || message.includes('quota')) {
    return 'Unable to save settings. Your browser storage may be full.';
  }

  if (message.includes('geolocation') || message.includes('permission')) {
    return 'Unable to access your location. Please check browser permissions.';
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * Wrap a function with error handling
 */
export function withErrorHandling<T extends (...args: any[]) => any>(
  fn: T,
  context?: ErrorContext
): T {
  return ((...args: Parameters<T>) => {
    try {
      const result = fn(...args);
      
      // Handle async functions
      if (result instanceof Promise) {
        return result.catch((error) => {
          globalErrorHandler.handleError(error, context);
          throw error;
        });
      }
      
      return result;
    } catch (error) {
      globalErrorHandler.handleError(
        error instanceof Error ? error : new Error(String(error)),
        context
      );
      throw error;
    }
  }) as T;
}
