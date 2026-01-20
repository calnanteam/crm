"use client";

import { useState, useEffect } from "react";
import { Navigation } from "../components/Navigation";
import { Card } from "../components/Card";
import { ContactStageBadge } from "../components/ContactStageBadge";
import { Select } from "../components/Select";
import { useRouter } from "next/navigation";

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

interface Contact {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  stage: RelationshipStage;
  owner?: {
    displayName?: string;
    email?: string;
  };
  vehicle: string;
  types: string[];
}

export default function PipelinePage() {
  const router = useRouter();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [ownerFilter, setOwnerFilter] = useState("");
  const [vehicleFilter, setVehicleFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");

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
                            className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 hover:shadow-md transition-shadow cursor-pointer"
                            onClick={() => router.push(`/contacts/${contact.id}`)}
                          >
                            <div className="mb-2">
                              <p className="font-medium text-sm text-gray-900 truncate">
                                {contact.displayName ||
                                  `${contact.firstName || ""} ${contact.lastName || ""}`.trim() ||
                                  "Unknown"}
                              </p>
                              {contact.email && (
                                <p className="text-xs text-gray-500 truncate mt-1">{contact.email}</p>
                              )}
                            </div>

                            <div className="flex items-center justify-between">
                              <ContactStageBadge stage={contact.stage} />
                            </div>

                            {contact.owner && (
                              <div className="mt-2 pt-2 border-t border-gray-100">
                                <p className="text-xs text-gray-600">
                                  Owner: {contact.owner.displayName || contact.owner.email}
                                </p>
                              </div>
                            )}

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
