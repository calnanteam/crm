"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Navigation } from "../../components/Navigation";
import { Card } from "../../components/Card";
import { ContactStageBadge } from "../../components/ContactStageBadge";
import { ActivityTimelineItem } from "../../components/ActivityTimelineItem";
import { TaskListItem } from "../../components/TaskListItem";
import { Button } from "../../components/Button";
import { Modal } from "../../components/Modal";
import { TextArea } from "../../components/TextArea";
import { Input } from "../../components/Input";
import { Select } from "../../components/Select";

export default function ContactDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const [contact, setContact] = useState<any>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [showStageModal, setShowStageModal] = useState(false);
  const [noteSubject, setNoteSubject] = useState("");
  const [noteBody, setNoteBody] = useState("");
  const [taskTitle, setTaskTitle] = useState("");
  const [taskDescription, setTaskDescription] = useState("");
  const [taskDueAt, setTaskDueAt] = useState("");
  const [taskPriority, setTaskPriority] = useState("MEDIUM");
  const [newStage, setNewStage] = useState("");
  const [contactId, setContactId] = useState<string | null>(null);

  useEffect(() => {
    params.then(p => {
      setContactId(p.id);
      fetchContact(p.id);
      fetchUsers();
    });
  }, [params]);

  const fetchContact = async (id: string) => {
    const response = await fetch(`/api/contacts/${id}`);
    const data = await response.json();
    setContact(data);
    setNewStage(data.stage);
    setLoading(false);
  };

  const fetchUsers = async () => {
    const response = await fetch("/api/users");
    const data = await response.json();
    setUsers(data);
  };

  const addNote = async () => {
    if (!contactId) return;
    await fetch("/api/activities", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "NOTE",
        subject: noteSubject,
        body: noteBody,
        contactId,
      }),
    });
    setShowNoteModal(false);
    setNoteSubject("");
    setNoteBody("");
    fetchContact(contactId);
  };

  const addTask = async () => {
    if (!contactId) return;
    await fetch("/api/tasks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: taskTitle,
        description: taskDescription,
        dueAt: taskDueAt || null,
        priority: taskPriority,
        contactId,
      }),
    });
    setShowTaskModal(false);
    setTaskTitle("");
    setTaskDescription("");
    setTaskDueAt("");
    setTaskPriority("MEDIUM");
    fetchContact(contactId);
  };

  const changeStage = async () => {
    if (!contactId) return;
    await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        stage: newStage,
        oldStage: contact.stage,
      }),
    });
    setShowStageModal(false);
    fetchContact(contactId);
  };

  const updateNextTouch = async (date: string) => {
    if (!contactId) return;
    await fetch(`/api/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ nextTouchAt: date }),
    });
    fetchContact(contactId);
  };

  const toggleTask = async (taskId: string, currentStatus: string) => {
    const newStatus = currentStatus === "DONE" ? "OPEN" : "DONE";
    await fetch(`/api/tasks/${taskId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    });
    if (contactId) fetchContact(contactId);
  };

  if (loading || !contact) {
    return (
      <>
        <Navigation />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <p>Loading...</p>
        </div>
      </>
    );
  }

  const contactName = contact.displayName || `${contact.firstName || ""} ${contact.lastName || ""}`.trim() || "Unknown Contact";
  
  const openTasks = contact.tasks?.filter((t: any) => t.status === "OPEN" || t.status === "IN_PROGRESS") || [];
  const completedTasks = contact.tasks?.filter((t: any) => t.status === "DONE") || [];

  const proposalStages = ["PROPOSAL_TO_BE_DEVELOPED", "PROPOSAL_IN_PROGRESS", "PROPOSAL_READY_FOR_FORMATTING", "PROPOSAL_SENT"];
  const isInProposal = proposalStages.includes(contact.stage);

  const stageOptions = [
    { value: "NEW_LEAD", label: "New Lead" },
    { value: "FIRST_OUTREACH_SENT", label: "First Outreach Sent" },
    { value: "CONNECTED_CONVERSATION", label: "Connected Conversation" },
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

  const priorityOptions = [
    { value: "LOW", label: "Low" },
    { value: "MEDIUM", label: "Medium" },
    { value: "HIGH", label: "High" },
    { value: "URGENT", label: "Urgent" },
  ];

  return (
    <>
      <Navigation />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex justify-between items-start mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{contactName}</h1>
            <div className="flex items-center space-x-4 mt-2">
              <ContactStageBadge stage={contact.stage} />
              <span className="text-sm text-gray-500">Vehicle: {contact.vehicle}</span>
              {contact.types && contact.types.length > 0 && (
                <span className="text-sm text-gray-500">
                  Types: {contact.types.join(", ")}
                </span>
              )}
            </div>
          </div>
          <div className="flex space-x-2">
            <Button variant="secondary" onClick={() => router.push(`/contacts/${contactId}/edit`)}>
              Edit
            </Button>
            <Button onClick={() => setShowNoteModal(true)}>Add Note</Button>
            <Button onClick={() => setShowTaskModal(true)}>Add Task</Button>
            <Button variant="secondary" onClick={() => setShowStageModal(true)}>
              Change Stage
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <Card title="Overview">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium text-gray-500">Email</p>
                  <p className="text-sm text-gray-900">{contact.email || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Phone</p>
                  <p className="text-sm text-gray-900">{contact.phone || "-"}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Location</p>
                  <p className="text-sm text-gray-900">
                    {[contact.city, contact.region, contact.country].filter(Boolean).join(", ") || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Owner</p>
                  <p className="text-sm text-gray-900">
                    {contact.owner?.displayName || contact.owner?.email || "-"}
                  </p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Capital Potential</p>
                  <p className="text-sm text-gray-900">{contact.capitalPotential}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-500">Equity Roll-In Potential</p>
                  <p className="text-sm text-gray-900">{contact.equityRollInPotential}</p>
                </div>
              </div>
              {contact.howWeMet && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">How We Met</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{contact.howWeMet}</p>
                </div>
              )}
              {contact.notes && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Notes</p>
                  <p className="text-sm text-gray-900 whitespace-pre-wrap">{contact.notes}</p>
                </div>
              )}
              {contact.rollInPropertyLocation && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-500">Roll-In Property Location</p>
                  <p className="text-sm text-gray-900">{contact.rollInPropertyLocation}</p>
                </div>
              )}
            </Card>

            {isInProposal && (
              <Card title="Proposal Status">
                <div className="space-y-2">
                  <div>
                    <p className="text-sm font-medium text-gray-500">Proposal Owner</p>
                    <p className="text-sm text-gray-900">
                      {contact.proposalOwner?.displayName || contact.proposalOwner?.email || "Not assigned"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-500">Current Stage</p>
                    <ContactStageBadge stage={contact.stage} />
                  </div>
                </div>
              </Card>
            )}

            <Card title="Activity Timeline">
              {contact.activities && contact.activities.length > 0 ? (
                <div className="space-y-4 divide-y divide-gray-200">
                  {contact.activities.map((activity: any) => (
                    <ActivityTimelineItem key={activity.id} activity={activity} />
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No activity yet</p>
              )}
            </Card>
          </div>

          <div className="space-y-6">
            <Card title="Next Touch">
              <div className="space-y-2">
                <Input
                  type="date"
                  value={contact.nextTouchAt ? new Date(contact.nextTouchAt).toISOString().split("T")[0] : ""}
                  onChange={(e) => updateNextTouch(e.target.value)}
                />
                {contact.lastTouchAt && (
                  <p className="text-xs text-gray-500">
                    Last touch: {new Date(contact.lastTouchAt).toLocaleDateString()}
                  </p>
                )}
              </div>
            </Card>

            <Card title="Open Tasks">
              {openTasks.length > 0 ? (
                <div className="space-y-2">
                  {openTasks.map((task: any) => (
                    <div key={task.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={false}
                        onChange={() => toggleTask(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{task.title}</p>
                        {task.dueAt && (
                          <p className="text-xs text-gray-500">
                            Due: {new Date(task.dueAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-500 text-sm">No open tasks</p>
              )}
            </Card>

            {completedTasks.length > 0 && (
              <Card title="Completed Tasks">
                <div className="space-y-2">
                  {completedTasks.slice(0, 5).map((task: any) => (
                    <div key={task.id} className="flex items-start space-x-2">
                      <input
                        type="checkbox"
                        checked={true}
                        onChange={() => toggleTask(task.id, task.status)}
                        className="mt-1"
                      />
                      <div className="flex-1">
                        <p className="text-sm text-gray-500 line-through">{task.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>

      <Modal isOpen={showNoteModal} onClose={() => setShowNoteModal(false)} title="Add Note">
        <div className="space-y-4">
          <Input
            label="Subject"
            value={noteSubject}
            onChange={(e) => setNoteSubject(e.target.value)}
            placeholder="Optional subject..."
          />
          <TextArea
            label="Note"
            value={noteBody}
            onChange={(e) => setNoteBody(e.target.value)}
            rows={6}
            placeholder="Enter your note..."
            required
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowNoteModal(false)}>
              Cancel
            </Button>
            <Button onClick={addNote} disabled={!noteBody}>
              Add Note
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showTaskModal} onClose={() => setShowTaskModal(false)} title="Add Task">
        <div className="space-y-4">
          <Input
            label="Task Title"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Enter task title..."
            required
          />
          <TextArea
            label="Description"
            value={taskDescription}
            onChange={(e) => setTaskDescription(e.target.value)}
            rows={4}
            placeholder="Optional description..."
          />
          <Input
            label="Due Date"
            type="date"
            value={taskDueAt}
            onChange={(e) => setTaskDueAt(e.target.value)}
          />
          <Select
            label="Priority"
            options={priorityOptions}
            value={taskPriority}
            onChange={(e) => setTaskPriority(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowTaskModal(false)}>
              Cancel
            </Button>
            <Button onClick={addTask} disabled={!taskTitle}>
              Add Task
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showStageModal} onClose={() => setShowStageModal(false)} title="Change Stage">
        <div className="space-y-4">
          <Select
            label="New Stage"
            options={stageOptions}
            value={newStage}
            onChange={(e) => setNewStage(e.target.value)}
          />
          <div className="flex justify-end space-x-2">
            <Button variant="secondary" onClick={() => setShowStageModal(false)}>
              Cancel
            </Button>
            <Button onClick={changeStage}>
              Change Stage
            </Button>
          </div>
        </div>
      </Modal>
    </>
  );
}
