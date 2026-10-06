/**
 * Simple logger module for structured logging
 */

/**
 * Log an informational message with optional data
 */
export function logInfo(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] INFO: ${message}`;
  
  if (data !== undefined) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

/**
 * Log an error message with optional error object
 */
export function logError(message: string, error?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ERROR: ${message}`;
  
  if (error !== undefined) {
    console.error(logMessage, error);
  } else {
    console.error(logMessage);
  }
}

/**
 * Log a debug message with optional data
 */
export function logDebug(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] DEBUG: ${message}`;
  
  if (data !== undefined) {
    console.log(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.log(logMessage);
  }
}

/**
 * Log a warning message with optional data
 */
export function logWarn(message: string, data?: any): void {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] WARN: ${message}`;
  
  if (data !== undefined) {
    console.warn(logMessage, JSON.stringify(data, null, 2));
  } else {
    console.warn(logMessage);
  }
}

