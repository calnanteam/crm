import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const ownerUserId = searchParams.get("ownerUserId");
    const vehicle = searchParams.get("vehicle");
    const contactType = searchParams.get("contactType");
    const search = searchParams.get("search");

    const where: any = {};

    if (stage) where.stage = stage;
    if (ownerUserId) where.ownerUserId = ownerUserId;
    if (vehicle) where.vehicle = vehicle;
    if (contactType) where.types = { has: contactType };
    if (search) {
      where.OR = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    const contacts = await prisma.contact.findMany({
      where,
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
      },
      orderBy: { updatedAt: "desc" },
    });

    return NextResponse.json(contacts);
  } catch (error) {
    console.error("Error fetching contacts:", error);
    return NextResponse.json(
      { error: "Failed to fetch contacts" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const contact = await prisma.contact.create({
      data: {
        firstName: body.firstName,
        lastName: body.lastName,
        displayName: body.displayName,
        email: body.email,
        phone: body.phone,
        city: body.city,
        region: body.region,
        country: body.country || "Canada",
        types: body.types || [],
        vehicle: body.vehicle || "CORE",
        stage: body.stage || "NEW_LEAD",
        ownerUserId: body.ownerUserId,
        proposalOwnerUserId: body.proposalOwnerUserId,
        nextTouchAt: body.nextTouchAt ? new Date(body.nextTouchAt) : null,
        capitalPotential: body.capitalPotential || "UNKNOWN",
        equityRollInPotential: body.equityRollInPotential || "UNKNOWN",
        rollInPropertyLocation: body.rollInPropertyLocation,
        howWeMet: body.howWeMet,
        notes: body.notes,
        organizationId: body.organizationId,
      },
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
