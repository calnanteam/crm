import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get("status");
    const priority = searchParams.get("priority");
    const assignedToUserId = searchParams.get("assignedToUserId");
    const contactId = searchParams.get("contactId");

    const where: any = {};

    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (assignedToUserId) where.assignedToUserId = assignedToUserId;
    if (contactId) where.contactId = contactId;

    const tasks = await prisma.task.findMany({
      where,
      include: {
        assignedTo: true,
        contact: true,
      },
      orderBy: [
        { status: "asc" },
        { priority: "desc" },
        { dueAt: "asc" },
      ],
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const task = await prisma.task.create({
      data: {
        title: body.title,
        description: body.description,
        status: body.status || "OPEN",
        priority: body.priority || "MEDIUM",
        dueAt: body.dueAt ? new Date(body.dueAt) : null,
        assignedToUserId: body.assignedToUserId,
        contactId: body.contactId,
      },
      include: {
        assignedTo: true,
        contact: true,
      },
    });

    await prisma.activity.create({
      data: {
        type: "TASK_CREATED",
        occurredAt: new Date(),
        subject: `Task created: ${body.title}`,
        contactId: body.contactId,
        actorUserId: body.actorUserId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}
