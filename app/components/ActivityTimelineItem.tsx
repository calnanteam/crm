type ActivityType = 
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

interface Activity {
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

interface ActivityTimelineItemProps {
  activity: Activity;
}

export function ActivityTimelineItem({ activity }: ActivityTimelineItemProps) {
  const typeIcons: Record<ActivityType, string> = {
    NOTE: "📝",
    CALL: "📞",
    MEETING: "🤝",
    EMAIL_LOGGED: "📧",
    TEXT_LOGGED: "💬",
    DOCUMENT_SENT: "📤",
    DOCUMENT_RECEIVED: "📥",
    STATUS_CHANGE: "🔄",
    TASK_CREATED: "✅",
    TASK_COMPLETED: "✔️",
  };

  const typeLabels: Record<ActivityType, string> = {
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

  const occurredDate = typeof activity.occurredAt === 'string' 
    ? new Date(activity.occurredAt) 
    : activity.occurredAt;

  return (
    <div className="flex space-x-3 py-3">
      <div className="flex-shrink-0">
        <span className="text-2xl">{typeIcons[activity.type]}</span>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-medium text-gray-900">{typeLabels[activity.type]}</p>
          <span className="text-xs text-gray-500">
            {occurredDate.toLocaleDateString()} at{" "}
            {occurredDate.toLocaleTimeString()}
          </span>
        </div>
        {activity.subject && (
          <p className="text-sm font-medium text-gray-700 mt-1">{activity.subject}</p>
        )}
        {activity.body && (
          <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{activity.body}</p>
        )}
        {activity.actor && (
          <p className="text-xs text-gray-500 mt-1">
            by {activity.actor.displayName || activity.actor.email}
          </p>
        )}
      </div>
    </div>
  );
}
