"use client";

import { useState, useEffect } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { ContactStageBadge } from "../components/ContactStageBadge";
import { Select } from "../components/Select";
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

interface User {
  id: string;
  email: string;
  displayName?: string;
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
}

export default function PipelinePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [updatingContactId, setUpdatingContactId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
    fetchContacts();
  }, [ownerFilter, vehicleFilter, typeFilter]);

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const fetchContacts = async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (ownerFilter) params.append("ownerUserId", ownerFilter);
    if (vehicleFilter) params.append("vehicle", vehicleFilter);
    if (typeFilter) params.append("contactType", typeFilter);

    const response = await fetch(`/api/contacts?${params}`);
    const data = await response.json();
    setContacts(data);
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
    return contacts.filter((contact) => stages.includes(contact.stage));
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

        {/* Filters */}
        <Card className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
          </div>
        </Card>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-gray-500">Loading pipeline...</p>
          </div>
        ) : (
          <div className="flex gap-4 overflow-x-auto pb-4">
            {stageGroups.map((group) => {
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
                        groupContacts.map((contact) => (
                          <div
                            key={contact.id}
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow"
                          >
                            <div 
                              className="mb-2 cursor-pointer"
                              onClick={() => router.push(`/contacts/${contact.id}`)}
                            >
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {contact.displayName ||
                                  `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                                  "Unknown"}
                              </p>
                              {contact.email && (
                                <p className="text-xs text-gray-500 truncate mt-1">{contact.email}</p>
                              )}
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
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}
