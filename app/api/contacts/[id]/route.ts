/**
 * Contacts API - Get, Update, Delete by ID
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { contactUpdateSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/contacts/[id] - Get a single contact
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    const contact = await prisma.contact.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        proposalOwner: { select: { id: true, email: true, displayName: true } },
        organization: { select: { id: true, name: true } },
        tasks: {
          orderBy: { createdAt: "desc" },
          take: 50,
          include: {
            assignedTo: { select: { id: true, email: true, displayName: true } },
          },
        },
        activities: {
          orderBy: { occurredAt: "desc" },
          take: 50,
          include: {
            actor: { select: { id: true, email: true, displayName: true } },
          },
        },
        proposals: {
          orderBy: { createdAt: "desc" },
          include: {
            owner: { select: { id: true, email: true, displayName: true } },
          },
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
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * PATCH /api/contacts/[id] - Update a contact
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
    const validated = contactUpdateSchema.parse(body);

    // Convert date strings to Date objects
    const data: any = { ...validated };
    if (data.nextTouchAt) data.nextTouchAt = new Date(data.nextTouchAt);
    if (data.lastTouchAt) data.lastTouchAt = new Date(data.lastTouchAt);

    const contact = await prisma.contact.update({
      where: { id },
      data,
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        proposalOwner: { select: { id: true, email: true, displayName: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(contact);
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/contacts/[id] - Delete a contact
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { id } = await params;
    await prisma.contact.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
