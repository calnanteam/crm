import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
        tasks: {
          include: {
            assignedTo: true,
          },
          orderBy: { createdAt: "desc" },
        },
        activities: {
          include: {
            actor: true,
          },
          orderBy: { occurredAt: "desc" },
        },
      },
    });

    if (!contact) {
      return NextResponse.json(
        { error: "Contact not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error fetching contact:", error);
    return NextResponse.json(
      { error: "Failed to fetch contact" },
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

    const updateData: any = { ...body };
    
    if (body.nextTouchAt) {
      updateData.nextTouchAt = new Date(body.nextTouchAt);
    }

    if (body.stage && body.stage !== body.oldStage) {
      updateData.stageUpdatedAt = new Date();
      
      const proposalStages = [
        "PROPOSAL_TO_BE_DEVELOPED",
        "PROPOSAL_IN_PROGRESS",
        "PROPOSAL_READY_FOR_FORMATTING",
        "PROPOSAL_SENT",
      ];
      
      if (proposalStages.includes(body.stage) && !body.proposalOwnerUserId) {
        const mdUser = await prisma.user.findFirst({
          where: { email: { contains: "md", mode: "insensitive" } },
        });
        if (mdUser) {
          updateData.proposalOwnerUserId = mdUser.id;
        }
      }
    }

    delete updateData.oldStage;

    const contact = await prisma.contact.update({
      where: { id },
      data: updateData,
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
      },
    });

    if (body.stage && body.stage !== body.oldStage) {
      await prisma.activity.create({
        data: {
          type: "STATUS_CHANGE",
          occurredAt: new Date(),
          subject: `Stage changed to ${body.stage}`,
          body: `Stage changed from ${body.oldStage || "unknown"} to ${body.stage}`,
          contactId: id,
          actorUserId: body.actorUserId,
        },
      });
    }

    return NextResponse.json(contact);
  } catch (error) {
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Failed to update contact" },
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
    
    await prisma.contact.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Failed to delete contact" },
      { status: 500 }
    );
  }
}
