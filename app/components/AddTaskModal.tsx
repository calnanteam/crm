"use client";

import { useState } from "react";
import { Modal } from "./Modal";
import { Input } from "./Input";
import { TextArea } from "./TextArea";
import { Button } from "./Button";

const SUCCESS_DISPLAY_DURATION = 1000; // milliseconds

interface AddTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  contactId: string;
  contactName: string;
  onTaskCreated?: () => void;
}

export function AddTaskModal({
  isOpen,
  onClose,
  contactId,
  contactName,
  onTaskCreated,
}: AddTaskModalProps) {
  const [title, setTitle] = useState("");
  const [dueAt, setDueAt] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim() || undefined,
          dueAt: dueAt || undefined,
          contactId,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create task");
      }

      setSuccessMessage("Task created successfully!");
      
      // Reset form
      setTitle("");
      setDueAt("");
      setDescription("");
      
      // Notify parent and close modal after a brief delay
      setTimeout(() => {
        if (onTaskCreated) {
          onTaskCreated();
        }
        onClose();
        setSuccessMessage(null);
      }, SUCCESS_DISPLAY_DURATION);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setTitle("");
      setDueAt("");
      setDescription("");
      setError(null);
      setSuccessMessage(null);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title={`Add Task for ${contactName}`}>
      <form onSubmit={handleSubmit}>
        <div className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-sm text-green-800">{successMessage}</p>
            </div>
          )}

          <Input
            label="Task Title *"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter task title"
            disabled={isSubmitting}
            required
          />

          <Input
            label="Due Date"
            type="datetime-local"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
            disabled={isSubmitting}
          />

          <TextArea
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter task description (optional)"
            disabled={isSubmitting}
            rows={3}
          />

          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              disabled={isSubmitting || !title.trim()}
            >
              {isSubmitting ? "Creating..." : "Create Task"}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}
