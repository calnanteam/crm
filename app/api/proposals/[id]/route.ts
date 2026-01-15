import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const updateProposalSchema = z.object({
  status: z.enum(["DRAFT", "READY", "SENT", "ACCEPTED", "DECLINED"]).optional(),
  ownerUserId: z.string().optional(),
  docUrl: z.string().url().optional().or(z.literal("")).nullable(),
  notes: z.string().optional().nullable(),
});

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const proposal = await prisma.proposal.findUnique({
      where: { id },
      include: {
        owner: true,
        contact: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
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
      { error: "Failed to fetch proposal" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    
    // Validate input
    const validatedData = updateProposalSchema.parse(body);
    
    // Get existing proposal to track status changes
    const existingProposal = await prisma.proposal.findUnique({
      where: { id },
      select: { status: true, contactId: true },
    });

    if (!existingProposal) {
      return NextResponse.json(
        { error: "Proposal not found" },
        { status: 404 }
      );
    }

    const updateData: any = {};
    if (validatedData.status !== undefined) updateData.status = validatedData.status;
    if (validatedData.ownerUserId !== undefined) updateData.ownerUserId = validatedData.ownerUserId;
    if (validatedData.docUrl !== undefined) updateData.docUrl = validatedData.docUrl;
    if (validatedData.notes !== undefined) updateData.notes = validatedData.notes;

    const proposal = await prisma.proposal.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        contact: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create activity for status change
    if (validatedData.status && validatedData.status !== existingProposal.status) {
      await prisma.activity.create({
        data: {
          type: "STATUS_CHANGE",
          subject: "Proposal Status Changed",
          body: `Proposal status changed from ${existingProposal.status} to ${validatedData.status}`,
          contactId: existingProposal.contactId,
          source: "system",
        },
      });
    }

    return NextResponse.json(proposal);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating proposal:", error);
    return NextResponse.json(
      { error: "Failed to update proposal" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    await prisma.proposal.delete({
      where: { id },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting proposal:", error);
    return NextResponse.json(
      { error: "Failed to delete proposal" },
      { status: 500 }
    );
  }
}
