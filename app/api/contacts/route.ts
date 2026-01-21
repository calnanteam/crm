import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { normalizePhone } from "@/lib/utils/phone";

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
    const cursor = searchParams.get("cursor");
    const sort = searchParams.get("sort") || "lastTouchAt_desc";
    const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);

    const where: any = {};

    if (stage) where.stage = stage;
    if (ownerUserId) where.ownerUserId = ownerUserId;
    if (vehicle) where.vehicle = vehicle;
    if (contactType) where.types = { has: contactType };
    if (search) {
      const searchNormalized = normalizePhone(search);
      const searchConditions: any[] = [
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { displayName: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
        { organization: { name: { contains: search, mode: "insensitive" } } },
      ];
      
      // If search contains any digits, also search normalized phone numbers
      if (searchNormalized) {
        searchConditions.push({ phoneNormalized: { contains: searchNormalized } });
      }
      
      where.OR = searchConditions;
    }

    // Parse sort parameter (e.g., "lastTouchAt_desc", "displayName_asc")
    const [sortField, sortOrder] = sort.split("_");
    const orderBy: any[] = [];
    
    // Map sort field to actual field names
    const sortFieldMap: Record<string, string> = {
      lastTouchAt: "lastTouchAt",
      displayName: "displayName",
      createdAt: "createdAt",
      updatedAt: "updatedAt",
    };
    
    const actualSortField = sortFieldMap[sortField] || "lastTouchAt";
    const actualSortOrder = sortOrder === "asc" ? "asc" : "desc";
    
    // Add primary sort field (handling nulls for nullable fields)
    if (actualSortField === "lastTouchAt") {
      orderBy.push({ [actualSortField]: { sort: actualSortOrder, nulls: "last" } });
    } else {
      orderBy.push({ [actualSortField]: actualSortOrder });
    }
    // Add id as tie-breaker for stable pagination
    orderBy.push({ id: actualSortOrder });

    const findManyOptions: any = {
      where,
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
      },
      orderBy,
      take: take + 1, // Fetch one extra to determine if there's a next page
    };

    // If cursor is provided, use cursor-based pagination
    if (cursor) {
      findManyOptions.cursor = { id: cursor };
      findManyOptions.skip = 1; // Skip the cursor item itself
    }

    const contacts = await prisma.contact.findMany(findManyOptions);

    // Check if there are more items
    const hasNextPage = contacts.length > take;
    const items = hasNextPage ? contacts.slice(0, take) : contacts;
    const nextCursor = hasNextPage ? items[items.length - 1].id : null;

    return NextResponse.json({
      items,
      nextCursor,
      hasNextPage,
    });
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
        phoneNormalized: normalizePhone(validatedData.phone),
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
