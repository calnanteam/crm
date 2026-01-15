/**
 * Contacts API - List and Create
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAuth } from "@/lib/requireAuth";
import { contactCreateSchema } from "@/lib/validation";
import { ZodError } from "zod";

export const dynamic = "force-dynamic";

/**
 * GET /api/contacts - List contacts with pagination
 */
export async function GET(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const { searchParams } = new URL(request.url);
    const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);
    const skip = parseInt(searchParams.get("skip") || "0");

    const [contacts, total] = await Promise.all([
      prisma.contact.findMany({
        take,
        skip,
        orderBy: { updatedAt: "desc" },
        include: {
          owner: { select: { id: true, email: true, displayName: true } },
          proposalOwner: { select: { id: true, email: true, displayName: true } },
          organization: { select: { id: true, name: true } },
        },
      }),
      prisma.contact.count(),
    ]);

    return NextResponse.json({
      data: contacts,
      pagination: {
        total,
        take,
        skip,
        hasMore: skip + take < total,
      },
    });
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/contacts - Create a new contact
 */
export async function POST(request: NextRequest) {
  const authError = await requireAuth();
  if (authError) return authError;

  try {
    const body = await request.json();
    const validated = contactCreateSchema.parse(body);

    // Convert date strings to Date objects
    const data: any = { ...validated };
    if (data.nextTouchAt) data.nextTouchAt = new Date(data.nextTouchAt);
    if (data.lastTouchAt) data.lastTouchAt = new Date(data.lastTouchAt);

    const contact = await prisma.contact.create({
      data,
      include: {
        owner: { select: { id: true, email: true, displayName: true } },
        proposalOwner: { select: { id: true, email: true, displayName: true } },
        organization: { select: { id: true, name: true } },
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return NextResponse.json(
        { error: "Validation failed", issues: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
