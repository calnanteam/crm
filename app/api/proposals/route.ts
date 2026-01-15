/**
 * Proposals API - List and Create
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { proposalCreateSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/proposals - List proposals with pagination
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);
    const skip = parseInt(searchParams.get("skip") || "0");

    const [proposals, total] = await Promise.all([
      prisma.proposal.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
          owner: { select: { id: true, email: true, displayName: true } },
        },
      }),
      prisma.proposal.count(),
    ]);

    return NextResponse.json({
      data: proposals,
      pagination: {
        total,
        take,
        skip,
        hasMore: skip + take < total,
      },
    });
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/proposals - Create a new proposal
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = proposalCreateSchema.parse(body);

    const proposal = await prisma.proposal.create({
      data: validated,
      include: {
        contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        owner: { select: { id: true, email: true, displayName: true } },
      },
    });

    // Create activity log for proposal creation
    await prisma.activity.create({
      data: {
        type: "STATUS_CHANGE",
        subject: `Proposal created with status: ${proposal.status}`,
        body: proposal.notes || undefined,
        contactId: proposal.contactId,
        actorUserId: proposal.ownerUserId,
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
