"use client";

import { useState, useEffect, useMemo } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { Select } from "../components/Select";
import { Button } from "../components/Button";
import { Input } from "../components/Input";

type TaskStatus = "OPEN" | "IN_PROGRESS" | "DONE" | "CANCELLED";
type TaskPriority = "LOW" | "MEDIUM" | "HIGH" | "URGENT";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueAt: string | null;
  completedAt: string | null;
  createdAt: string;
  updatedAt: string;
  contact: {
    id: string;
    displayName: string | null;
    firstName: string | null;
    lastName: string | null;
  };
  assignedTo?: {
    id: string;
    name: string;
  } | null;
}

type StatusTab = "OPEN" | "DONE" | "ALL";
type SortOption = "due_soon" | "newest" | "priority";

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Filters
  const [statusTab, setStatusTab] = useState<StatusTab>("OPEN");
  const [searchQuery, setSearchQuery] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [dueDateFilter, setDueDateFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("due_soon");
  
  // Task-specific loading states
  const [savingTaskIds, setSavingTaskIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/tasks");
      if (!response.ok) throw new Error("Failed to fetch tasks");
      const data = await response.json();
      setTasks(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch tasks");
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteTask = async (taskId: string) => {
    setSavingTaskIds(prev => new Set(prev).add(taskId));
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "DONE" }),
      });
      
      if (!response.ok) throw new Error("Failed to complete task");
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to complete task");
    } finally {
      setSavingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const handleReopenTask = async (taskId: string) => {
    setSavingTaskIds(prev => new Set(prev).add(taskId));
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "OPEN" }),
      });
      
      if (!response.ok) throw new Error("Failed to reopen task");
      
      const updatedTask = await response.json();
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reopen task");
    } finally {
      setSavingTaskIds(prev => {
        const next = new Set(prev);
        next.delete(taskId);
        return next;
      });
    }
  };

  const clearFilters = () => {
    setSearchQuery("");
    setPriorityFilter("");
    setDueDateFilter("");
    setSortBy("due_soon");
  };

  // Filter and sort tasks
  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    // Status tab filter
    if (statusTab === "OPEN") {
      filtered = filtered.filter(t => t.status === "OPEN" || t.status === "IN_PROGRESS");
    } else if (statusTab === "DONE") {
      filtered = filtered.filter(t => t.status === "DONE" || t.status === "CANCELLED");
    }

    // Search filter (title, description, contact name)
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(task => {
        const contactName = getContactName(task.contact).toLowerCase();
        return (
          task.title.toLowerCase().includes(query) ||
          task.description?.toLowerCase().includes(query) ||
          contactName.includes(query)
        );
      });
    }

    // Priority filter
    if (priorityFilter) {
      filtered = filtered.filter(t => t.priority === priorityFilter);
    }

    // Due date filter
    if (dueDateFilter === "has_due") {
      filtered = filtered.filter(t => t.dueAt !== null);
    } else if (dueDateFilter === "no_due") {
      filtered = filtered.filter(t => t.dueAt === null);
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === "due_soon") {
        // For Open tasks: due date ascending (null last), then createdAt desc
        const aDate = a.dueAt ? new Date(a.dueAt).getTime() : Infinity;
        const bDate = b.dueAt ? new Date(b.dueAt).getTime() : Infinity;
        if (aDate !== bDate) return aDate - bDate;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "newest") {
        // For Completed: completedAt desc (if exists) else updatedAt desc
        if (statusTab === "DONE") {
          const aDate = a.completedAt || a.updatedAt;
          const bDate = b.completedAt || b.updatedAt;
          return new Date(bDate).getTime() - new Date(aDate).getTime();
        }
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      } else if (sortBy === "priority") {
        const priorityOrder = { URGENT: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      return 0;
    });

    return filtered;
  }, [tasks, statusTab, searchQuery, priorityFilter, dueDateFilter, sortBy]);

  const getContactName = (contact: Task["contact"]) => {
    return contact.displayName || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown Contact";
  };

  const formatDueDate = (dueAt: string | null) => {
    if (!dueAt) return null;
    const date = new Date(dueAt);
    return date.toLocaleDateString();
  };

  const isOverdue = (task: Task) => {
    if (!task.dueAt) return false;
    if (task.status === "DONE" || task.status === "CANCELLED") return false;
    return new Date(task.dueAt) < new Date();
  };

  const isDueToday = (task: Task) => {
    if (!task.dueAt) return false;
    const today = new Date();
    const dueDate = new Date(task.dueAt);
    return (
      today.getFullYear() === dueDate.getFullYear() &&
      today.getMonth() === dueDate.getMonth() &&
      today.getDate() === dueDate.getDate()
    );
  };

  const priorityColors: Record<TaskPriority, string> = {
    LOW: "text-gray-600 bg-gray-50",
    MEDIUM: "text-blue-600 bg-blue-50",
    HIGH: "text-orange-600 bg-orange-50",
    URGENT: "text-red-600 bg-red-50",
  };

  const priorityOptions = [
    { value: "", label: "All Priorities" },
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  const dueDateOptions = [
    { value: "", label: "All Tasks" },
    { value: "has_due", label: "Has Due Date" },
    { value: "no_due", label: "No Due Date" },
  ];

  const sortOptions = [
    { value: "due_soon", label: "Due Soon" },
    { value: "newest", label: "Newest" },
    { value: "priority", label: "Priority" },
  ];

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Tasks</h1>

        {/* Error Banner */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center justify-between">
              <p className="text-sm text-red-800">{error}</p>
              <button
                onClick={() => setError(null)}
                className="text-red-600 hover:text-red-800"
              >
                ✕
              </button>
            </div>
          </div>
        )}

        {/* Status Tabs */}
        <div className="mb-6">
          <div className="flex space-x-1 border-b border-gray-200">
            <button
              onClick={() => setStatusTab("OPEN")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusTab === "OPEN"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStatusTab("DONE")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusTab === "DONE"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              Completed
            </button>
            <button
              onClick={() => setStatusTab("ALL")}
              className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                statusTab === "ALL"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              All
            </button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <div className="space-y-4">
            {/* Search */}
            <Input
              type="text"
              placeholder="Search by title, description, or contact name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            
            {/* Filter Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Select
                options={priorityOptions}
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
              />
              <Select
                options={dueDateOptions}
                value={dueDateFilter}
                onChange={(e) => setDueDateFilter(e.target.value)}
              />
              <Select
                options={sortOptions}
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as SortOption)}
              />
              <Button
                variant="secondary"
                onClick={clearFilters}
                disabled={!searchQuery && !priorityFilter && !dueDateFilter && sortBy === "due_soon"}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>

        {/* Tasks List */}
        <Card>
          {loading ? (
            <p className="text-center py-8 text-gray-500">Loading tasks...</p>
          ) : filteredAndSortedTasks.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No tasks found</p>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedTasks.map((task) => {
                const overdue = isOverdue(task);
                const dueToday = isDueToday(task);
                const isSaving = savingTaskIds.has(task.id);

                return (
                  <div
                    key={task.id}
                    className={`py-4 px-4 hover:bg-gray-50 transition-colors ${
                      overdue ? "bg-red-50 border-l-4 border-red-500" : ""
                    } ${dueToday && !overdue ? "bg-yellow-50 border-l-4 border-yellow-500" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        {/* Title */}
                        <h3 className="text-base font-semibold text-gray-900 mb-1">
                          {task.title}
                        </h3>

                        {/* Meta Info */}
                        <div className="flex flex-wrap items-center gap-2 text-sm text-gray-600 mb-2">
                          <span>📇 {getContactName(task.contact)}</span>
                          
                          {task.dueAt && (
                            <>
                              <span>•</span>
                              <span className={overdue ? "text-red-600 font-medium" : dueToday ? "text-yellow-700 font-medium" : ""}>
                                📅 {overdue ? "OVERDUE: " : dueToday ? "DUE TODAY: " : "Due "}{formatDueDate(task.dueAt)}
                              </span>
                            </>
                          )}
                          
                          <span>•</span>
                          <span className={`px-2 py-0.5 rounded text-xs font-medium ${priorityColors[task.priority]}`}>
                            {task.priority}
                          </span>
                          
                          <span>•</span>
                          <span className="text-xs px-2 py-0.5 bg-gray-100 rounded">
                            {task.status.replace("_", " ")}
                          </span>
                        </div>

                        {/* Description */}
                        {task.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mt-2">
                            {task.description}
                          </p>
                        )}
                      </div>

                      {/* Actions */}
                      <div className="flex items-center gap-2">
                        {task.status === "OPEN" || task.status === "IN_PROGRESS" ? (
                          <Button
                            variant="primary"
                            onClick={() => handleCompleteTask(task.id)}
                            disabled={isSaving}
                            className="text-sm"
                          >
                            {isSaving ? "..." : "✓ Complete"}
                          </Button>
                        ) : (
                          <Button
                            variant="secondary"
                            onClick={() => handleReopenTask(task.id)}
                            disabled={isSaving}
                            className="text-sm"
                          >
                            {isSaving ? "..." : "↺ Reopen"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </Card>
      </div>
    </>
  );
}
