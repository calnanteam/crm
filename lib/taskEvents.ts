/**
 * Event utility for task changes (BATCH 18)
 * 
 * Provides a simple event-driven mechanism for notifying components
 * when tasks are created, updated, or deleted.
 * 
 * Usage:
 *   // Emit event after task mutation
 *   emitTasksChanged();
 * 
 *   // Listen for changes
 *   const handler = () => { ... };
 *   addTasksChangedListener(handler);
 *   // Clean up when done
 *   removeTasksChangedListener(handler);
 */

const TASKS_CHANGED_EVENT = "aiEmail:tasksChanged";

/**
 * Emit a tasks changed event
 */
export function emitTasksChanged(): void {
  if (typeof window === "undefined") return;
  
  const event = new CustomEvent(TASKS_CHANGED_EVENT);
  window.dispatchEvent(event);
}

/**
 * Add a listener for tasks changed events
 * @param handler - Function to call when tasks change
 */
export function addTasksChangedListener(handler: () => void): void {
  if (typeof window === "undefined") return;
  
  window.addEventListener(TASKS_CHANGED_EVENT, handler as EventListener);
}

/**
 * Remove a listener for tasks changed events
 * @param handler - The handler function to remove
 */
export function removeTasksChangedListener(handler: () => void): void {
  if (typeof window === "undefined") return;
  
  window.removeEventListener(TASKS_CHANGED_EVENT, handler as EventListener);
}
