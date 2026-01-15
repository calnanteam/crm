import Link from "next/link";

type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | Date | null;
  contact: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
}

interface TaskListItemProps {
  task: Task;
}

export function TaskListItem({ task }: TaskListItemProps) {
  const priorityColors: Record<TaskPriority, string> = {
    LOW: "text-gray-600",
    MEDIUM: "text-blue-600",
    HIGH: "text-orange-600",
    URGENT: "text-red-600",
  };

  const contactName = task.contact.displayName || `${task.contact.firstName || ""} ${task.contact.lastName || ""}`.trim() || "Unknown Contact";
  
  const formatDueDate = (dueAt: string | Date | null) => {
    if (!dueAt) return null;
    const date = typeof dueAt === 'string' ? new Date(dueAt) : dueAt;
    return date.toLocaleDateString();
  };

  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-200 last:border-0">
      <div className="flex-1 min-w-0">
        <Link href={`/contacts/${task.contact.id}`} className="hover:underline">
          <p className="text-sm font-medium text-gray-900 truncate">{task.title}</p>
        </Link>
        <p className="text-sm text-gray-500">
          {contactName}
          {task.dueAt && ` • Due ${formatDueDate(task.dueAt)}`}
        </p>
      </div>
      <div className="ml-4 flex items-center space-x-2">
        <span className={`text-xs font-medium ${priorityColors[task.priority]}`}>
          {task.priority}
        </span>
        <span className="text-xs text-gray-500">{task.status}</span>
      </div>
    </div>
  );
}
