"use client";

import { useState, useEffect } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { ContactStageBadge } from "../components/ContactStageBadge";
import { Select } from "../components/Select";
import { AddTaskModal } from "../components/AddTaskModal";
import { useRouter } from "next/navigation";

// Types matching the Prisma schema
type RelationshipStage =
  | "NEW_LEAD"
  | "FIRST_OUTREACH_SENT"
  | "CONNECTED_CONVERSATION"
  | "QUESTIONNAIRE_SENT"
  | "QUESTIONNAIRE_RECEIVED"
  | "QUALIFIED_ACTIVE"
  | "PROPOSAL_TO_BE_DEVELOPED"
  | "PROPOSAL_IN_PROGRESS"
  | "PROPOSAL_READY_FOR_FORMATTING"
  | "PROPOSAL_SENT"
  | "ACTIVE_NEGOTIATION"
  | "SOFT_COMMITTED"
  | "CLOSED_CONVERTED"
  | "DORMANT"
  | "LOST";

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
}

interface User {
  id: string;
  email: string;
  displayName?: string;
}

interface Task {
  id: string;
  title: string;
  status: string;
  dueAt?: string | Date | null;
}

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  stage: RelationshipStage;
  ownerUserId?: string | null;
  owner?: User;
  vehicle: "CORE" | "CAST3";
  types: string[];
  lastActivity?: Activity | null;
}

interface TaskSignals {
  openCount: number;
  overdueCount: number;
  dueTodayCount: number;
}

export default function PipelinePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [addTaskModalOpen, setAddTaskModalOpen] = useState(false);
  const [selectedContactForTask, setSelectedContactForTask] = useState<Contact | null>(null);
  const [taskSignals, setTaskSignals] = useState<Record<string, TaskSignals>>({});
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  // Helper: Format relative time (e.g., "3 hours ago")
  const formatRelativeTime = (date: string | Date): string => {
    const now = new Date();
    const then = typeof date === "string" ? new Date(date) : date;
    const diffInSeconds = Math.floor((now.getTime() - then.getTime()) / 1000);

    if (diffInSeconds < 60) return "just now";
    
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes === 1 ? "" : "s"} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours === 1 ? "" : "s"} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 30) return `${diffInDays} day${diffInDays === 1 ? "" : "s"} ago`;
    
    const diffInMonths = Math.floor(diffInDays / 30);
    if (diffInMonths < 12) return `${diffInMonths} month${diffInMonths === 1 ? "" : "s"} ago`;
    
    const diffInYears = Math.floor(diffInMonths / 12);
    return `${diffInYears} year${diffInYears === 1 ? "" : "s"} ago`;
  };

  // Helper: Check if a date is today in local timezone
  const isToday = (date: Date): boolean => {
    const today = new Date();
    const checkDate = new Date(date);
    return checkDate.getDate() === today.getDate() &&
           checkDate.getMonth() === today.getMonth() &&
           checkDate.getFullYear() === today.getFullYear();
  };

  // Helper: Get activity type label
  const getActivityLabel = (type: ActivityType): string => {
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
  };

  useEffect(() => {
    fetchUsers();
    fetchContacts();
  }, [ownerFilter, vehicleFilter, typeFilter]);

  // Helper: Filter contacts by search query
  const getVisibleContacts = () => {
    if (!searchQuery.trim()) return contacts;
    
    const query = searchQuery.toLowerCase();
    return contacts.filter((contact) => {
      const name = (contact.displayName ||
        `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
        "").toLowerCase();
      const email = (contact.email || "").toLowerCase();
      return name.includes(query) || email.includes(query);
    });
  };

  // Effect: Fetch task signals for visible contacts with performance guardrails
  useEffect(() => {
    if (loading || contacts.length === 0) return;

    const visibleContacts = getVisibleContacts();
    const contactsToFetch = visibleContacts.slice(0, 60);
    
    // Only fetch for contacts we don't have signals for yet
    const contactIdsToFetch = contactsToFetch
      .map(c => c.id)
      .filter(id => !taskSignals[id]);
    
    if (contactIdsToFetch.length > 0) {
      fetchTaskSignalsForAllContacts(contactIdsToFetch);
    }
  }, [contacts, searchQuery, loading]);

  // Effect: Auto-select first visible contact on load
  useEffect(() => {
    if (!loading && !selectedContactId) {
      const visibleContacts = getVisibleContacts();
      if (visibleContacts.length > 0) {
        setSelectedContactId(visibleContacts[0].id);
      }
    }
  }, [loading, contacts, searchQuery, selectedContactId]);

  // Effect: Keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if focus is inside form elements
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT'
      ) {
        return;
      }

      const visibleContacts = getVisibleContacts();
      if (visibleContacts.length === 0) return;

      const currentIndex = selectedContactId
        ? visibleContacts.findIndex(c => c.id === selectedContactId)
        : -1;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        const nextIndex = currentIndex < visibleContacts.length - 1 ? currentIndex + 1 : 0;
        setSelectedContactId(visibleContacts[nextIndex].id);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        const prevIndex = currentIndex > 0 ? currentIndex - 1 : visibleContacts.length - 1;
        setSelectedContactId(visibleContacts[prevIndex].id);
      } else if (e.key === 'Enter' && selectedContactId) {
        e.preventDefault();
        router.push(`/contacts/${selectedContactId}`);
      } else if (e.key === 'Escape') {
        if (addTaskModalOpen) {
          handleCloseTaskModal();
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedContactId, contacts, searchQuery, addTaskModalOpen, router]);

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const fetchTaskSignalsForContact = async (contactId: string): Promise<TaskSignals> => {
    try {
      const response = await fetch(`/api/tasks?contactId=${contactId}&status=OPEN`);
      const tasks: Task[] = await response.json();
      
      const now = new Date();
      const openCount = tasks.length;
      const overdueCount = tasks.filter((task) => 
        task.dueAt && new Date(task.dueAt) < now
      ).length;
      const dueTodayCount = tasks.filter((task) =>
        task.dueAt && isToday(new Date(task.dueAt))
      ).length;
      
      return { openCount, overdueCount, dueTodayCount };
    } catch (err) {
      console.error(`Failed to fetch task signals for contact ${contactId}:`, err);
      return { openCount: 0, overdueCount: 0, dueTodayCount: 0 };
    }
  };

  const fetchTaskSignalsForAllContacts = async (contactIds: string[]) => {
    const signals = await Promise.all(
      contactIds.map(async (id) => {
        const taskSignal = await fetchTaskSignalsForContact(id);
        return { id, signals: taskSignal };
      })
    );
    
    const signalsMap: Record<string, TaskSignals> = {};
    signals.forEach(({ id, signals }) => {
      signalsMap[id] = signals;
    });
    
    setTaskSignals(signalsMap);
  };

  const fetchContacts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ownerFilter) params.append("ownerUserId", ownerFilter);
    if (vehicleFilter) params.append("vehicle", vehicleFilter);
    if (typeFilter) params.append("contactType", typeFilter);

    const response = await fetch(`/api/contacts?${params}`);
    const data = await response.json();
    
    // Fetch last activity for each contact using existing endpoint
    const contactsWithActivities = await Promise.all(
      data.map(async (contact: Contact) => {
        try {
          const activityResponse = await fetch(`/api/activities?contactId=${contact.id}`);
          const activities = await activityResponse.json();
          return {
            ...contact,
            lastActivity: activities.length > 0 ? activities[0] : null,
          };
        } catch (err) {
          console.error(`Failed to fetch activities for contact ${contact.id}:`, err);
          return { ...contact, lastActivity: null };
        }
      })
    );
    
    setContacts(contactsWithActivities);
    setLoading(false);
  };

  const handleStageChange = async (
    contactId: string,
    newStage: RelationshipStage,
    oldStage: RelationshipStage
  ) => {
    if (newStage === oldStage) return;

    setUpdatingContactId(contactId);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          stage: newStage,
          oldStage,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update stage");
      }

      const updatedContact = await response.json();

      // Update the contact in state
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactId
            ? { ...contact, stage: updatedContact.stage }
            : contact
        )
      );
    } catch (err) {
      setError("Failed to update stage. Please try again.");
      // Revert the change in local state
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactId
            ? { ...contact, stage: oldStage }
            : contact
        )
      );
    } finally {
      setUpdatingContactId(null);
    }
  };

  const handleOwnerChange = async (
    contactId: string,
    newOwnerId: string,
    oldOwnerId: string | null | undefined,
    oldOwner: User | undefined
  ) => {
    if (newOwnerId === (oldOwnerId || "")) return;

    setUpdatingContactId(contactId);
    setError(null);

    try {
      const response = await fetch(`/api/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ownerUserId: newOwnerId || null,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update owner");
      }

      const updatedContact = await response.json();

      // Update the contact in state
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactId
            ? { ...contact, ownerUserId: updatedContact.ownerUserId, owner: updatedContact.owner }
            : contact
        )
      );
    } catch (err) {
      setError("Failed to update owner. Please try again.");
      // Revert the change in local state
      setContacts((prevContacts) =>
        prevContacts.map((contact) =>
          contact.id === contactId
            ? { ...contact, ownerUserId: oldOwnerId || null, owner: oldOwner }
            : contact
        )
      );
    } finally {
      setUpdatingContactId(null);
    }
  };

  const handleAddTask = (contact: Contact) => {
    setSelectedContactForTask(contact);
    setAddTaskModalOpen(true);
  };

  const handleCloseTaskModal = () => {
    setAddTaskModalOpen(false);
    setSelectedContactForTask(null);
  };

  const handleTaskCreated = async () => {
    // Refresh task signals for the contact that had a task created
    if (selectedContactForTask) {
      const signals = await fetchTaskSignalsForContact(selectedContactForTask.id);
      setTaskSignals(prev => ({
        ...prev,
        [selectedContactForTask.id]: signals,
      }));
    }
  };

  const handleClearFilters = () => {
    setOwnerFilter("");
    setVehicleFilter("");
    setTypeFilter("");
    setSearchQuery("");
  };

  // Group stages into logical columns for the Kanban view
  const stageGroups = [
    {
      title: "New Leads",
      stages: ["NEW_LEAD", "FIRST_OUTREACH_SENT", "CONNECTED_CONVERSATION"] as RelationshipStage[],
      color: "bg-gray-50 border-gray-200",
    },
    {
      title: "Qualification",
      stages: ["QUESTIONNAIRE_SENT", "QUESTIONNAIRE_RECEIVED", "QUALIFIED_ACTIVE"] as RelationshipStage[],
      color: "bg-blue-50 border-blue-200",
    },
    {
      title: "Proposal Development",
      stages: [
        "PROPOSAL_TO_BE_DEVELOPED",
        "PROPOSAL_IN_PROGRESS",
        "PROPOSAL_READY_FOR_FORMATTING",
        "PROPOSAL_SENT",
      ] as RelationshipStage[],
      color: "bg-yellow-50 border-yellow-200",
    },
    {
      title: "Closing",
      stages: ["ACTIVE_NEGOTIATION", "SOFT_COMMITTED", "CLOSED_CONVERTED"] as RelationshipStage[],
      color: "bg-green-50 border-green-200",
    },
    {
      title: "Inactive",
      stages: ["DORMANT", "LOST"] as RelationshipStage[],
      color: "bg-red-50 border-red-200",
    },
  ];

  const getContactsByStageGroup = (stages: RelationshipStage[]) => {
    const visibleContacts = getVisibleContacts();
    return visibleContacts.filter((contact) => stages.includes(contact.stage));
  };

  const allStageOptions = [
    { value: "NEW_LEAD", label: "New Lead" },
    { value: "FIRST_OUTREACH_SENT", label: "First Outreach" },
    { value: "CONNECTED_CONVERSATION", label: "Connected" },
    { value: "QUESTIONNAIRE_SENT", label: "Questionnaire Sent" },
    { value: "QUESTIONNAIRE_RECEIVED", label: "Questionnaire Received" },
    { value: "QUALIFIED_ACTIVE", label: "Qualified Active" },
    { value: "PROPOSAL_TO_BE_DEVELOPED", label: "Proposal: To Be Developed" },
    { value: "PROPOSAL_IN_PROGRESS", label: "Proposal: In Progress" },
    { value: "PROPOSAL_READY_FOR_FORMATTING", label: "Proposal: Ready for Formatting" },
    { value: "PROPOSAL_SENT", label: "Proposal Sent" },
    { value: "ACTIVE_NEGOTIATION", label: "Active Negotiation" },
    { value: "SOFT_COMMITTED", label: "Soft Committed" },
    { value: "CLOSED_CONVERTED", label: "Closed Converted" },
    { value: "DORMANT", label: "Dormant" },
    { value: "LOST", label: "Lost" },
  ];

  const vehicleOptions = [
    { value: "", label: "All Vehicles" },
    { value: "CORE", label: "CORE" },
    { value: "CAST3", label: "Cast3" },
  ];

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "INVESTOR_CASH", label: "Investor (Cash)" },
    { value: "ROLL_IN_OWNER", label: "Roll-In Owner" },
    { value: "REALTOR", label: "Realtor" },
    { value: "PROFESSIONAL", label: "Professional" },
    { value: "PARTNER", label: "Partner" },
  ];

  const userOptions = [
    { value: "", label: "All Owners" },
    ...users.map((u) => ({ value: u.id, label: u.displayName || u.email })),
  ];

  return (
    <>
      <Navigation />
      <div className="max-w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-900">Pipeline View</h1>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {/* Filters - Sticky */}
        <div className="sticky top-0 z-10 bg-white pb-4 mb-2">
          <Card className="shadow-md">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <input
                type="text"
                placeholder="Search by name or email..."
                className="px-4 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Select
                options={userOptions}
                value={ownerFilter}
                onChange={(e) => setOwnerFilter(e.target.value)}
              />
              <Select
                options={vehicleOptions}
                value={vehicleFilter}
                onChange={(e) => setVehicleFilter(e.target.value)}
              />
              <Select
                options={typeOptions}
                value={typeFilter}
                onChange={(e) => setTypeFilter(e.target.value)}
              />
              <button
                onClick={handleClearFilters}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Clear Filters
              </button>
            </div>
          </Card>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading pipeline...</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {(() => {
              // Compute visible contacts once for performance
              const visibleContacts = getVisibleContacts();
              const first60ContactIds = new Set(visibleContacts.slice(0, 60).map(c => c.id));
              
              return stageGroups.map((group) => {
                const groupContacts = getContactsByStageGroup(group.stages);
                return (
                  <div
                    key={group.title}
                    className="flex-shrink-0 w-80"
                    style={{ minWidth: "20rem" }}
                  >
                    <div className={`rounded-lg border-2 ${group.color} p-4 h-full`}>
                      <div className="mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">{group.title}</h3>
                        <p className="text-sm text-gray-600 mt-1">
                          {groupContacts.length} contact{groupContacts.length !== 1 ? "s" : ""}
                        </p>
                      </div>

                      <div className="space-y-3 overflow-y-auto" style={{ maxHeight: "calc(100vh - 280px)" }}>
                        {groupContacts.length === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-8">No contacts</p>
                        ) : (
                          groupContacts.map((contact) => {
                            const isSelected = contact.id === selectedContactId;
                            const isInFirst60 = first60ContactIds.has(contact.id);
                            const signals = taskSignals[contact.id];
                            const showSignals = isInFirst60 && signals;
                          
                          return (
                            <div
                              key={contact.id}
                              className={`bg-white rounded-lg shadow-sm border ${
                                isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'
                              } p-3 transition-all duration-200 hover:shadow-lg hover:border-blue-300 group relative cursor-pointer`}
                              onClick={() => setSelectedContactId(contact.id)}
                            >
                              {/* Open affordance - appears on hover */}
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  router.push(`/contacts/${contact.id}`);
                                }}
                                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 px-2 py-1 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded border border-blue-200"
                                title="Open contact details"
                              >
                                Open
                              </button>

                              <div className="flex justify-between items-start mb-2">
                                <div className="flex-1 pr-12">
                                  <p className="font-medium text-sm text-gray-900 truncate">
                                    {contact.displayName ||
                                      `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                                      "Unknown"}
                                  </p>
                                  {contact.email && (
                                    <p className="text-xs text-gray-500 truncate mt-1">{contact.email}</p>
                                  )}
                                </div>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleAddTask(contact);
                                  }}
                                  className="ml-2 px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                  title="Add Task"
                                >
                                  + Task
                                </button>
                              </div>

                              <div className="mb-2">
                                <select
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  value={contact.stage}
                                  disabled={updatingContactId === contact.id}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleStageChange(
                                      contact.id,
                                      e.target.value as RelationshipStage,
                                      contact.stage
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {allStageOptions.map((option) => (
                                    <option key={option.value} value={option.value}>
                                      {option.label}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <select
                                  className="w-full px-2 py-1 text-xs border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                  value={contact.ownerUserId || ""}
                                  disabled={updatingContactId === contact.id}
                                  onChange={(e) => {
                                    e.stopPropagation();
                                    handleOwnerChange(
                                      contact.id,
                                      e.target.value,
                                      contact.ownerUserId,
                                      contact.owner
                                    );
                                  }}
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <option value="">Unassigned</option>
                                  {users.map((user) => (
                                    <option key={user.id} value={user.id}>
                                      {user.displayName || user.email}
                                    </option>
                                  ))}
                                </select>
                              </div>

                              {contact.vehicle && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                                    {contact.vehicle}
                                  </span>
                                </div>
                              )}

                              {/* Task Signals */}
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <div className="text-xs text-gray-600">
                                  <span className="font-medium">Signals:</span>{" "}
                                  {showSignals ? (
                                    <>
                                      <span className="text-gray-900">
                                        Open: {signals.openCount}
                                      </span>
                                      {" / "}
                                      <span className={signals.dueTodayCount ? "text-orange-600 font-medium" : "text-gray-900"}>
                                        Due today: {signals.dueTodayCount}
                                      </span>
                                      {" / "}
                                      <span className={signals.overdueCount ? "text-red-600 font-medium" : "text-gray-900"}>
                                        Overdue: {signals.overdueCount}
                                      </span>
                                    </>
                                  ) : (
                                    <span className="text-gray-400">—</span>
                                  )}
                                </div>
                              </div>

                              {/* Last Activity - Polished with truncation */}
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                {contact.lastActivity ? (
                                  <div className="text-xs text-gray-500">
                                    <span className="font-medium text-gray-700 truncate block max-w-[80%]">
                                      {getActivityLabel(contact.lastActivity.type)}
                                    </span>
                                    <span className="text-gray-500">
                                      {formatRelativeTime(contact.lastActivity.occurredAt)}
                                    </span>
                                  </div>
                                ) : (
                                  <div className="text-xs text-gray-400 italic">
                                    No activity yet
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                </div>
              );
            });
          })()}
          </div>
        )}
      </div>

      {selectedContactForTask && (
        <AddTaskModal
          isOpen={addTaskModalOpen}
          onClose={handleCloseTaskModal}
          contactId={selectedContactForTask.id}
          contactName={
            selectedContactForTask.displayName ||
            `${selectedContactForTask.firstName || ""} ${selectedContactForTask.lastName || ""}`.trim() ||
            "Unknown"
          }
          onTaskCreated={handleTaskCreated}
        />
      )}
    </>
  );
}
