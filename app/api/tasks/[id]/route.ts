import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();

    const updateData: any = { ...body };
    
    if (body.dueAt) {
      updateData.dueAt = new Date(body.dueAt);
    }
    
    // Set completedAt for closed statuses (DONE or CANCELLED)
    if (body.status && (body.status === "DONE" || body.status === "CANCELLED") && !body.completedAt) {
      updateData.completedAt = new Date();
    }
    
    // Clear completedAt for open statuses (OPEN or IN_PROGRESS)
    if (body.status && (body.status === "OPEN" || body.status === "IN_PROGRESS")) {
      updateData.completedAt = null;
    }

    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        assignedTo: true,
        contact: true,
      },
    });

    if (body.status === "DONE") {
      await prisma.activity.create({
        data: {
          type: "TASK_COMPLETED",
          occurredAt: new Date(),
          subject: `Task completed: ${task.title}`,
          contactId: task.contactId,
          actorUserId: body.actorUserId,
        },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Failed to update task" },
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
    
    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Failed to delete task" },
      { status: 500 }
    );
  }
}
