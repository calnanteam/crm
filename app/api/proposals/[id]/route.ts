/**
 * Proposals API - Get, Update, Delete by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { proposalUpdateSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/proposals/[id] - Get a single proposal
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, displayName: true } },
      },
    });

    if (!proposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(proposal);
  } catch (error) {
    console.error("Error fetching proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/proposals/[id] - Update a proposal
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const validated = proposalUpdateSchema.parse(body);

    const oldProposal = await prisma.proposal.findUnique({ where: { id } });

    const proposal = await prisma.proposal.update({
      where: { id },
      data: validated,
      include: {
        contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, displayName: true } },
      },
    });

    // Create activity log if status changed
    if (validated.status && oldProposal && validated.status !== oldProposal.status) {
      await prisma.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: `Proposal status changed from ${oldProposal.status} to ${validated.status}`,
          body: validated.notes || undefined,
          contactId: proposal.contactId,
          actorUserId: proposal.ownerUserId,
        },
      });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/proposals/[id] - Delete a proposal
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.proposal.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
