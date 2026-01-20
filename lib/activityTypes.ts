/**
 * Shared Activity type definitions and utilities
 */

export type ActivityType =
  | "NOTE"
  | "CALL"
  | "MEETING"
  | "EMAIL_LOGGED"
  | "TEXT_LOGGED"
  | "DOCUMENT_SENT"
  | "DOCUMENT_RECEIVED"
  | "STATUS_CHANGE"
  | "TASK_CREATED"
  | "TASK_COMPLETED";

export interface Activity {
  id: string;
  type: ActivityType;
  occurredAt: string | Date;
  subject: string | null;
  body: string | null;
  actor: {
    displayName: string | null;
    email: string;
  } | null;
}

/**
 * Get human-readable label for an activity type
 */
export function getActivityLabel(type: ActivityType): string {
  const labels: Record<ActivityType, string> = {
    NOTE: "Note",
    CALL: "Call",
    MEETING: "Meeting",
    EMAIL_LOGGED: "Email",
    TEXT_LOGGED: "Text",
    DOCUMENT_SENT: "Document Sent",
    DOCUMENT_RECEIVED: "Document Received",
    STATUS_CHANGE: "Status Change",
    TASK_CREATED: "Task Created",
    TASK_COMPLETED: "Task Completed",
  };
  return labels[type] || type;
}
