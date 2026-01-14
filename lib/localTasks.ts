/**
 * Local-only task management utilities (BATCH 16)
 * 
 * Tasks are stored in localStorage and namespaced per user.
 * This is a minimal v1 implementation - no server sync, no dedicated UI page.
 */

import { emitTasksChanged } from "./taskEvents";

export type TaskStatus = "open" | "done";

export interface Task {
  id: string;
  createdAt: number;
  status: TaskStatus;
  title: string;
  notes?: string;
  sourceEmailId: string;
  sourceConversationId?: string;
  from: string; // sender
  subject: string;
}

/**
 * Get namespaced localStorage key for tasks
 */
function getTasksKey(currentUserEmail?: string): string {
  if (currentUserEmail) {
    return `aiEmail.tasks.v1.${currentUserEmail}`;
  }
  return "aiEmail.tasks.v1";
}

/**
 * Get namespaced localStorage key for flagged emails
 */
function getFlaggedKey(currentUserEmail?: string): string {
  if (currentUserEmail) {
    return `aiEmail.flagged.v1.${currentUserEmail}`;
  }
  return "aiEmail.flagged.v1";
}

/**
 * Load all tasks from localStorage
 */
export function loadTasks(currentUserEmail?: string): Task[] {
  if (typeof window === "undefined") return [];
  
  try {
    const key = getTasksKey(currentUserEmail);
    const stored = localStorage.getItem(key);
    if (!stored) return [];
    
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return parsed as Task[];
    }
    return [];
  } catch (error) {
    console.error("Failed to load tasks:", error);
    return [];
  }
}

/**
 * Save tasks to localStorage
 */
export function saveTasks(tasks: Task[], currentUserEmail?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getTasksKey(currentUserEmail);
    localStorage.setItem(key, JSON.stringify(tasks));
  } catch (error) {
    console.error("Failed to save tasks:", error);
  }
}

/**
 * Create a new task
 */
export function createTask(
  taskData: Omit<Task, "id" | "createdAt" | "status">,
  currentUserEmail?: string
): Task {
  const task: Task = {
    ...taskData,
    id: `task_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
    createdAt: Date.now(),
    status: "open",
  };
  
  const tasks = loadTasks(currentUserEmail);
  tasks.push(task);
  saveTasks(tasks, currentUserEmail);
  
  // Emit event to notify listeners
  emitTasksChanged();
  
  return task;
}

/**
 * Update a task's status
 */
export function updateTaskStatus(
  taskId: string,
  status: TaskStatus,
  currentUserEmail?: string
): void {
  const tasks = loadTasks(currentUserEmail);
  const updatedTasks = tasks.map((task) =>
    task.id === taskId ? { ...task, status } : task
  );
  saveTasks(updatedTasks, currentUserEmail);
  
  // Emit event to notify listeners
  emitTasksChanged();
}

/**
 * Delete a task
 */
export function deleteTask(taskId: string, currentUserEmail?: string): void {
  const tasks = loadTasks(currentUserEmail);
  const filteredTasks = tasks.filter((task) => task.id !== taskId);
  saveTasks(filteredTasks, currentUserEmail);
  
  // Emit event to notify listeners
  emitTasksChanged();
}

/**
 * Load flagged email IDs from localStorage
 */
export function loadFlaggedEmails(currentUserEmail?: string): Set<string> {
  if (typeof window === "undefined") return new Set();
  
  try {
    const key = getFlaggedKey(currentUserEmail);
    const stored = localStorage.getItem(key);
    if (!stored) return new Set();
    
    const parsed = JSON.parse(stored);
    if (Array.isArray(parsed)) {
      return new Set(parsed);
    }
    return new Set();
  } catch (error) {
    console.error("Failed to load flagged emails:", error);
    return new Set();
  }
}

/**
 * Save flagged email IDs to localStorage
 */
export function saveFlaggedEmails(flaggedIds: Set<string>, currentUserEmail?: string): void {
  if (typeof window === "undefined") return;
  
  try {
    const key = getFlaggedKey(currentUserEmail);
    localStorage.setItem(key, JSON.stringify(Array.from(flaggedIds)));
  } catch (error) {
    console.error("Failed to save flagged emails:", error);
  }
}

/**
 * Add an email to flagged list
 */
export function flagEmail(emailId: string, currentUserEmail?: string): void {
  const flagged = loadFlaggedEmails(currentUserEmail);
  flagged.add(emailId);
  saveFlaggedEmails(flagged, currentUserEmail);
}

/**
 * Remove an email from flagged list
 */
export function unflagEmail(emailId: string, currentUserEmail?: string): void {
  const flagged = loadFlaggedEmails(currentUserEmail);
  flagged.delete(emailId);
  saveFlaggedEmails(flagged, currentUserEmail);
}

/**
 * Clear all flagged emails
 */
export function clearAllFlagged(currentUserEmail?: string): void {
  saveFlaggedEmails(new Set(), currentUserEmail);
}
