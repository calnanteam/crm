import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema for contact creation
const createContactSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  city: z.string().optional(),
  region: z.string().optional(),
  country: z.string().optional(),
  types: z.array(z.enum(["INVESTOR_CASH", "ROLL_IN_OWNER", "REALTOR", "PROFESSIONAL", "PARTNER", "INTERNAL"])).optional(),
  vehicle: z.enum(["CORE", "CAST3"]).optional(),
  stage: z.enum([
    "NEW_LEAD",
    "FIRST_OUTREACH_SENT",
    "CONNECTED_CONVERSATION",
    "QUESTIONNAIRE_SENT",
    "QUESTIONNAIRE_RECEIVED",
    "QUALIFIED_ACTIVE",
    "PROPOSAL_TO_BE_DEVELOPED",
    "PROPOSAL_IN_PROGRESS",
    "PROPOSAL_READY_FOR_FORMATTING",
    "PROPOSAL_SENT",
    "ACTIVE_NEGOTIATION",
    "SOFT_COMMITTED",
    "CLOSED_CONVERTED",
    "DORMANT",
    "LOST",
  ]).optional(),
  ownerUserId: z.string().optional(),
  proposalOwnerUserId: z.string().optional(),
  nextTouchAt: z.string().optional(),
  capitalPotential: z.enum([
    "UNDER_100K",
    "BAND_100K_250K",
    "BAND_250K_500K",
    "BAND_500K_1M",
    "BAND_1M_2M",
    "BAND_2M_5M",
    "BAND_5M_PLUS",
    "BAND_10M_PLUS",
    "UNKNOWN",
  ]).optional(),
  equityRollInPotential: z.enum([
    "UNDER_250K",
    "BAND_250K_500K",
    "BAND_500K_1M",
    "BAND_1M_2M",
    "BAND_2M_5M",
    "BAND_5M_PLUS",
    "BAND_10M_PLUS",
    "UNKNOWN",
  ]).optional(),
  rollInPropertyLocation: z.string().optional(),
  howWeMet: z.string().optional(),
  notes: z.string().optional(),
  organizationId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const stage = searchParams.get("stage");
    const ownerUserId = searchParams.get("ownerUserId");
    const vehicle = searchParams.get("vehicle");
    const contactType = searchParams.get("contactType");
    const search = searchParams.get("search");
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

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
      skip,
      take: Math.min(take, 100),
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
    
    // Validate input
    const validatedData = createContactSchema.parse(body);
    
    const contact = await prisma.contact.create({
      data: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        displayName: validatedData.displayName,
        email: validatedData.email,
        phone: validatedData.phone,
        city: validatedData.city,
        region: validatedData.region,
        country: validatedData.country || "Canada",
        types: validatedData.types || [],
        vehicle: validatedData.vehicle || "CORE",
        stage: validatedData.stage || "NEW_LEAD",
        ownerUserId: validatedData.ownerUserId,
        proposalOwnerUserId: validatedData.proposalOwnerUserId,
        nextTouchAt: validatedData.nextTouchAt ? new Date(validatedData.nextTouchAt) : null,
        capitalPotential: validatedData.capitalPotential || "UNKNOWN",
        equityRollInPotential: validatedData.equityRollInPotential || "UNKNOWN",
        rollInPropertyLocation: validatedData.rollInPropertyLocation,
        howWeMet: validatedData.howWeMet,
        notes: validatedData.notes,
        organizationId: validatedData.organizationId,
      },
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
      },
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating contact:", error);
    return NextResponse.json(
      { error: "Failed to create contact" },
      { status: 500 }
    );
  }
}
