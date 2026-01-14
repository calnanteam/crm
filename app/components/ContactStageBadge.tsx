type Stage = 
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

interface ContactStageBadgeProps {
  stage: Stage;
}

export function ContactStageBadge({ stage }: ContactStageBadgeProps) {
  const stageConfig: Record<Stage, { color: string; label: string }> = {
    NEW_LEAD: { color: "bg-gray-100 text-gray-800", label: "New Lead" },
    FIRST_OUTREACH_SENT: { color: "bg-gray-100 text-gray-800", label: "First Outreach" },
    CONNECTED_CONVERSATION: { color: "bg-blue-100 text-blue-800", label: "Connected" },
    QUESTIONNAIRE_SENT: { color: "bg-blue-100 text-blue-800", label: "Questionnaire Sent" },
    QUESTIONNAIRE_RECEIVED: { color: "bg-blue-100 text-blue-800", label: "Questionnaire Received" },
    QUALIFIED_ACTIVE: { color: "bg-blue-500 text-white", label: "Qualified Active" },
    PROPOSAL_TO_BE_DEVELOPED: { color: "bg-yellow-100 text-yellow-800", label: "Proposal: To Be Developed" },
    PROPOSAL_IN_PROGRESS: { color: "bg-yellow-100 text-yellow-800", label: "Proposal: In Progress" },
    PROPOSAL_READY_FOR_FORMATTING: { color: "bg-yellow-100 text-yellow-800", label: "Proposal: Ready for Formatting" },
    PROPOSAL_SENT: { color: "bg-yellow-500 text-white", label: "Proposal Sent" },
    ACTIVE_NEGOTIATION: { color: "bg-green-100 text-green-800", label: "Active Negotiation" },
    SOFT_COMMITTED: { color: "bg-green-100 text-green-800", label: "Soft Committed" },
    CLOSED_CONVERTED: { color: "bg-green-500 text-white", label: "Closed Converted" },
    DORMANT: { color: "bg-red-100 text-red-800", label: "Dormant" },
    LOST: { color: "bg-red-500 text-white", label: "Lost" },
  };

  const config = stageConfig[stage];

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.color}`}>
      {config.label}
    </span>
  );
}
