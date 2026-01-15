/**
 * Tasks API - List and Create
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { taskCreateSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/tasks - List tasks with pagination
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);
    const skip = parseInt(searchParams.get("skip") || "0");

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        take,
        skip,
        orderBy: { createdAt: "desc" },
        include: {
          contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
          assignedTo: { select: { id: true, email: true, displayName: true } },
        },
      }),
      prisma.task.count(),
    ]);

    return NextResponse.json({
      data: tasks,
      pagination: {
        total,
        take,
        skip,
        hasMore: skip + take < total,
      },
    });
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks - Create a new task
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = taskCreateSchema.parse(body);

    // Convert date strings to Date objects
    const data: any = { ...validated };
    if (data.dueAt) data.dueAt = new Date(data.dueAt);

    const task = await prisma.task.create({
      data,
      include: {
        contact: { select: { id: true, displayName: true, firstName: true, lastName: true } },
        assignedTo: { select: { id: true, email: true, displayName: true } },
      },
    });

    // Create activity log for task creation
    await prisma.activity.create({
      data: {
        type: "TASK_CREATED",
        subject: `Task created: ${task.title}`,
        contactId: task.contactId,
        actorUserId: task.assignedToUserId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
