/**
 * Zod validation schemas for API request payloads
 */

import { z } from "zod";

// ============================================================================
// Contact Schemas
// ============================================================================

export const ContactTypeEnum = z.enum([
  "INVESTOR_CASH",
  "ROLL_IN_OWNER",
  "REALTOR",
  "PROFESSIONAL",
  "PARTNER",
  "INTERNAL",
]);

export const VehicleFlagEnum = z.enum(["CORE", "CAST3"]);

export const RelationshipStageEnum = z.enum([
  "NEW_LEAD",
  "FIRST_OUTREACH_SENT",
  "CONNECTED_CONVERSATION",
  "QUESTIONNAIRE_SENT",
  "QUESTIONNAIRE_RECEIVED",
  "QUALIFIED_ACTIVE",
  "PROPOSAL_TO_BE_DEVELOPED",
  "PROPOSAL_IN_PROGRESS",
  "PROPOSAL_READY_FOR_FORMATTING",
  "PROPOSAL_SENT",
  "ACTIVE_NEGOTIATION",
  "SOFT_COMMITTED",
  "CLOSED_CONVERTED",
  "DORMANT",
  "LOST",
]);

export const CapitalPotentialBandEnum = z.enum([
  "UNDER_100K",
  "BAND_100K_250K",
  "BAND_250K_500K",
  "BAND_500K_1M",
  "BAND_1M_2M",
  "BAND_2M_5M",
  "BAND_5M_PLUS",
  "BAND_10M_PLUS",
  "UNKNOWN",
]);

export const EquityRollInBandEnum = z.enum([
  "UNDER_250K",
  "BAND_250K_500K",
  "BAND_500K_1M",
  "BAND_1M_2M",
  "BAND_2M_5M",
  "BAND_5M_PLUS",
  "BAND_10M_PLUS",
  "UNKNOWN",
]);

export const contactCreateSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional().default("Canada"),
  types: z.array(ContactTypeEnum).optional(),
  vehicle: VehicleFlagEnum.optional(),
  stage: RelationshipStageEnum.optional(),
  ownerUserId: z.string().optional(),
  proposalOwnerUserId: z.string().optional(),
  nextTouchAt: z.string().datetime().optional(),
  lastTouchAt: z.string().datetime().optional(),
  capitalPotential: CapitalPotentialBandEnum.optional(),
  equityRollInPotential: EquityRollInBandEnum.optional(),
  rollInPropertyLocation: z.string().optional(),
  howWeMet: z.string().optional(),
  notes: z.string().optional(),
  organizationId: z.string().optional(),
});

export const contactUpdateSchema = contactCreateSchema.partial();

// ============================================================================
// Task Schemas
// ============================================================================

export const TaskStatusEnum = z.enum(["OPEN", "IN_PROGRESS", "DONE", "CANCELLED"]);

export const TaskPriorityEnum = z.enum(["LOW", "MEDIUM", "HIGH", "URGENT"]);

export const taskCreateSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  dueAt: z.string().datetime().optional(),
  assignedToUserId: z.string().optional(),
  contactId: z.string().min(1, "Contact ID is required"),
});

export const taskUpdateSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().optional(),
  status: TaskStatusEnum.optional(),
  priority: TaskPriorityEnum.optional(),
  dueAt: z.string().datetime().optional(),
  completedAt: z.string().datetime().optional(),
  assignedToUserId: z.string().optional(),
});

// ============================================================================
// Proposal Schemas
// ============================================================================

export const ProposalStatusEnum = z.enum(["DRAFT", "READY", "SENT", "ACCEPTED", "DECLINED"]);

export const proposalCreateSchema = z.object({
  status: ProposalStatusEnum.optional(),
  docUrl: z.string().url().optional(),
  notes: z.string().optional(),
  ownerUserId: z.string().optional(),
  contactId: z.string().min(1, "Contact ID is required"),
});

export const proposalUpdateSchema = z.object({
  status: ProposalStatusEnum.optional(),
  docUrl: z.string().url().optional(),
  notes: z.string().optional(),
  ownerUserId: z.string().optional(),
});

// ============================================================================
// Activity Schemas
// ============================================================================

export const ActivityTypeEnum = z.enum([
  "NOTE",
  "CALL",
  "MEETING",
  "EMAIL_LOGGED",
  "TEXT_LOGGED",
  "DOCUMENT_SENT",
  "DOCUMENT_RECEIVED",
  "STATUS_CHANGE",
  "TASK_CREATED",
  "TASK_COMPLETED",
]);

export const activityCreateSchema = z.object({
  type: ActivityTypeEnum,
  occurredAt: z.string().datetime().optional(),
  subject: z.string().optional(),
  body: z.string().optional(),
  contactId: z.string().min(1, "Contact ID is required"),
  actorUserId: z.string().optional(),
});
