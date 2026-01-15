import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// TODO: Email BCC logging - Phase 2
// Implement email parsing from BCC'd emails to auto-create activities
// Store in Activity with type EMAIL_LOGGED and source "bcc"

// TODO: Unmatched activity inbox - Phase 2
// Create queue for activities that can't be auto-matched to contacts
// Require manual matching before finalizing

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");

    if (!contactId) {
      return NextResponse.json(
        { error: "contactId is required" },
        { status: 400 }
      );
    }

    const activities = await prisma.activity.findMany({
      where: { contactId },
      include: {
        actor: true,
      },
      orderBy: { occurredAt: "desc" },
    });

    return NextResponse.json(activities);
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Failed to fetch activities" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const activity = await prisma.activity.create({
      data: {
        type: body.type || "NOTE",
        occurredAt: body.occurredAt ? new Date(body.occurredAt) : new Date(),
        subject: body.subject,
        body: body.body,
        contactId: body.contactId,
        actorUserId: body.actorUserId,
      },
      include: {
        actor: true,
      },
    });

    if (body.type === "CALL" || body.type === "MEETING" || body.type === "EMAIL_LOGGED") {
      await prisma.contact.update({
        where: { id: body.contactId },
        data: { lastTouchAt: new Date() },
      });
    }

    return NextResponse.json(activity, { status: 201 });
  } catch (error) {
    console.error("Error creating activity:", error);
    return NextResponse.json(
      { error: "Failed to create activity" },
      { status: 500 }
    );
  }
}
