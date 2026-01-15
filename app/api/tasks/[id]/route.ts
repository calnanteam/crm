/**
 * Tasks API - Get, Update, Delete by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { taskUpdateSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks/[id] - Get a single task
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, displayName: true } },
      },
    });

    if (!task) {
      return NextResponse.json(
        { error: "Task not found" },
        { status: 404 }
      );
    }

    return NextResponse.json(task);
  } catch (error) {
    console.error("Error fetching task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/tasks/[id] - Update a task
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
    const validated = taskUpdateSchema.parse(body);

    // Convert date strings to Date objects
    const data: any = { ...validated };
    if (data.dueAt) data.dueAt = new Date(data.dueAt);
    if (data.completedAt) data.completedAt = new Date(data.completedAt);

    const task = await prisma.task.update({
      where: { id },
      data,
      include: {
        contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, displayName: true } },
      },
    });

    // Create activity log if task completed
    if (validated.status === "DONE" && !task.completedAt) {
      await prisma.activity.create({
        data: {
          type: "TASK_COMPLETED",
          subject: `Task completed: ${task.title}`,
          contactId: task.contactId,
          actorUserId: task.assignedToUserId,
        },
      });
    }

    return NextResponse.json(task);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id] - Delete a task
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.task.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
