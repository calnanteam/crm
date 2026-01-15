"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";

// Types based on Prisma schema
type ProposalStatus = "DRAFT" | "READY" | "SENT" | "ACCEPTED" | "DECLINED";

type Contact = {
  id: string;
  firstName?: string;
  lastName?: string;
  displayName?: string;
  email?: string;
  phone?: string;
  stage: string;
  proposalOwner?: {
    id: string;
    email: string;
    displayName?: string;
  };
  proposalOwnerUserId?: string;
};

type Proposal = {
  id: string;
  status: ProposalStatus;
  docUrl?: string;
  notes?: string;
  ownerUserId?: string;
  owner?: {
    id: string;
    email: string;
    displayName?: string;
  };
  createdAt: string;
  updatedAt: string;
};

type Task = {
  id: string;
  title: string;
  status: string;
  priority: string;
  dueAt?: string;
};

type Activity = {
  id: string;
  type: string;
  subject?: string;
  body?: string;
  occurredAt: string;
};

type ContactDetails = Contact & {
  tasks: Task[];
  activities: Activity[];
  proposals: Proposal[];
};

const PROPOSAL_STAGES = [
  "PROPOSAL_TO_BE_DEVELOPED",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_READY_FOR_FORMATTING",
  "PROPOSAL_SENT",
];

export default function ContactDetailPage() {
  const params = useParams();
  const contactId = params.id as string;

  const [contact, setContact] = useState<ContactDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Proposal form state
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalFormData, setProposalFormData] = useState({
    status: "DRAFT" as ProposalStatus,
    docUrl: "",
    notes: "",
  });
  const [editingProposal, setEditingProposal] = useState<Proposal | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchContact();
  }, [contactId]);

  async function fetchContact() {
    try {
      setLoading(true);
      const res = await fetch(`/api/contacts/${contactId}`);
      if (!res.ok) {
        throw new Error("Failed to fetch contact");
      }
      const data = await res.json();
      setContact(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  function isProposalStage(stage: string) {
    return PROPOSAL_STAGES.includes(stage);
  }

  async function handleCreateProposal() {
    if (!contact) return;

    setSubmitting(true);
    try {
      const res = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactId: contact.id,
          status: proposalFormData.status,
          docUrl: proposalFormData.docUrl || undefined,
          notes: proposalFormData.notes || undefined,
          ownerUserId: contact.proposalOwnerUserId || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to create proposal");
      }

      // Reset form and refresh contact
      setProposalFormData({ status: "DRAFT", docUrl: "", notes: "" });
      setShowProposalForm(false);
      await fetchContact();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to create proposal");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleUpdateProposal() {
    if (!editingProposal) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/proposals/${editingProposal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: proposalFormData.status,
          docUrl: proposalFormData.docUrl || undefined,
          notes: proposalFormData.notes || undefined,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to update proposal");
      }

      // Reset form and refresh contact
      setProposalFormData({ status: "DRAFT", docUrl: "", notes: "" });
      setEditingProposal(null);
      setShowProposalForm(false);
      await fetchContact();
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to update proposal");
    } finally {
      setSubmitting(false);
    }
  }

  function startEditProposal(proposal: Proposal) {
    setEditingProposal(proposal);
    setProposalFormData({
      status: proposal.status,
      docUrl: proposal.docUrl || "",
      notes: proposal.notes || "",
    });
    setShowProposalForm(true);
  }

  if (loading) {
    return <div className="p-8">Loading contact...</div>;
  }

  if (error || !contact) {
    return <div className="p-8 text-red-600">Error: {error || "Contact not found"}</div>;
  }

  const displayName = contact.displayName || 
    `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || 
    "Unknown Contact";

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">{displayName}</h1>
          <div className="text-sm text-gray-600 space-y-1">
            {contact.email && <div>Email: {contact.email}</div>}
            {contact.phone && <div>Phone: {contact.phone}</div>}
            <div className="mt-2">
              <span className="inline-block px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                {contact.stage.replace(/_/g, " ")}
              </span>
            </div>
          </div>
        </div>

        {/* Proposal Panel - Only show if in proposal stage */}
        {isProposalStage(contact.stage) && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-gray-900">Proposals</h2>
              {contact.proposals.length === 0 && !showProposalForm && (
                <button
                  onClick={() => setShowProposalForm(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Create Proposal
                </button>
              )}
            </div>

            {/* Existing Proposals */}
            {contact.proposals.length > 0 && (
              <div className="space-y-4 mb-4">
                {contact.proposals.map((proposal) => (
                  <div key={proposal.id} className="border border-gray-200 rounded p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                          proposal.status === "ACCEPTED" ? "bg-green-100 text-green-800" :
                          proposal.status === "DECLINED" ? "bg-red-100 text-red-800" :
                          proposal.status === "SENT" ? "bg-yellow-100 text-yellow-800" :
                          "bg-gray-100 text-gray-800"
                        }`}>
                          {proposal.status}
                        </span>
                      </div>
                      <button
                        onClick={() => startEditProposal(proposal)}
                        className="text-blue-600 hover:text-blue-800 text-sm"
                      >
                        Edit
                      </button>
                    </div>
                    {proposal.docUrl && (
                      <div className="text-sm text-gray-600 mb-2">
                        <a href={proposal.docUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                          View Document
                        </a>
                      </div>
                    )}
                    {proposal.notes && (
                      <div className="text-sm text-gray-700">{proposal.notes}</div>
                    )}
                    {proposal.owner && (
                      <div className="text-xs text-gray-500 mt-2">
                        Owner: {proposal.owner.displayName || proposal.owner.email}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* Proposal Form */}
            {showProposalForm && (
              <div className="border border-gray-300 rounded p-4 bg-gray-50">
                <h3 className="font-semibold mb-4">
                  {editingProposal ? "Update Proposal" : "Create New Proposal"}
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      value={proposalFormData.status}
                      onChange={(e) =>
                        setProposalFormData({ ...proposalFormData, status: e.target.value as ProposalStatus })
                      }
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="READY">Ready</option>
                      <option value="SENT">Sent</option>
                      <option value="ACCEPTED">Accepted</option>
                      <option value="DECLINED">Declined</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Document URL (optional)
                    </label>
                    <input
                      type="url"
                      value={proposalFormData.docUrl}
                      onChange={(e) =>
                        setProposalFormData({ ...proposalFormData, docUrl: e.target.value })
                      }
                      placeholder="https://..."
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Notes (optional)
                    </label>
                    <textarea
                      value={proposalFormData.notes}
                      onChange={(e) =>
                        setProposalFormData({ ...proposalFormData, notes: e.target.value })
                      }
                      rows={3}
                      className="w-full border border-gray-300 rounded px-3 py-2"
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={editingProposal ? handleUpdateProposal : handleCreateProposal}
                      disabled={submitting}
                      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      {submitting ? "Saving..." : editingProposal ? "Update" : "Create"}
                    </button>
                    <button
                      onClick={() => {
                        setShowProposalForm(false);
                        setEditingProposal(null);
                        setProposalFormData({ status: "DRAFT", docUrl: "", notes: "" });
                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tasks Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Tasks</h2>
          {contact.tasks.length === 0 ? (
            <p className="text-gray-500 text-sm">No tasks yet.</p>
          ) : (
            <div className="space-y-2">
              {contact.tasks.map((task) => (
                <div key={task.id} className="border border-gray-200 rounded p-3 flex justify-between items-center">
                  <div>
                    <div className="font-medium text-gray-900">{task.title}</div>
                    <div className="text-xs text-gray-500">
                      {task.status} • {task.priority}
                      {task.dueAt && ` • Due: ${new Date(task.dueAt).toLocaleDateString()}`}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Activities Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Activity Log</h2>
          {contact.activities.length === 0 ? (
            <p className="text-gray-500 text-sm">No activities yet.</p>
          ) : (
            <div className="space-y-3">
              {contact.activities.map((activity) => (
                <div key={activity.id} className="border-l-4 border-blue-500 pl-4 py-2">
                  <div className="text-xs text-gray-500">
                    {new Date(activity.occurredAt).toLocaleString()} • {activity.type.replace(/_/g, " ")}
                  </div>
                  {activity.subject && (
                    <div className="font-medium text-gray-900">{activity.subject}</div>
                  )}
                  {activity.body && (
                    <div className="text-sm text-gray-700 mt-1">{activity.body}</div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
