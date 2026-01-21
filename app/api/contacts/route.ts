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
    const q = searchParams.get("q"); // New: unified search parameter
    const cursor = searchParams.get("cursor");
    const sort = searchParams.get("sort");
    const limit = searchParams.get("limit"); // New: opt-in pagination
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = Math.min(parseInt(searchParams.get("take") || "50"), 100);

    const where: any = {};

    if (stage) where.stage = stage;
    if (ownerUserId) where.ownerUserId = ownerUserId;
    if (vehicle) where.vehicle = vehicle;
    if (contactType) where.types = { has: contactType };
    
    // Support both 'search' (old) and 'q' (new) parameters
    const searchTerm = q || search;
    if (searchTerm) {
      const searchNormalized = normalizePhone(searchTerm);
      const searchConditions: any[] = [
        { firstName: { contains: searchTerm, mode: "insensitive" } },
        { lastName: { contains: searchTerm, mode: "insensitive" } },
        { displayName: { contains: searchTerm, mode: "insensitive" } },
        { email: { contains: searchTerm, mode: "insensitive" } },
        { organization: { name: { contains: searchTerm, mode: "insensitive" } } },
      ];
      
      // If search contains any digits, also search normalized phone numbers
      if (searchNormalized) {
        searchConditions.push({ phoneNormalized: { contains: searchNormalized } });
      }
      
      where.OR = searchConditions;
    }

    // Determine if client wants cursor pagination (new format) or offset pagination (old format)
    // Pagination is opt-in: only use cursor mode if 'limit' parameter is provided
    const useCursorPagination = limit !== null;

    let orderBy: any;
    let sortConfig: { field: string; order: "asc" | "desc" } | null = null;
    
    if (useCursorPagination) {
      // Parse sort parameter for cursor pagination (e.g., "lastTouchAt_desc", "displayName_asc")
      // Default to lastTouchAt_desc if no sort specified
      const sortParam = sort || "lastTouchAt_desc";
      const [sortField, sortOrder] = sortParam.split("_");
      const orderByArray: any[] = [];
      
      // Map sort field to actual field names
      const sortFieldMap: Record<string, string> = {
        lastTouchAt: "lastTouchAt",
        displayName: "displayName",
        createdAt: "createdAt",
        updatedAt: "updatedAt",
        name: "displayName",
      };
      
      const actualSortField = sortFieldMap[sortField] || "lastTouchAt";
      const actualSortOrder = (sortOrder === "asc" ? "asc" : "desc") as "asc" | "desc";
      
      sortConfig = { field: actualSortField, order: actualSortOrder };
      
      // Add primary sort field (handling nulls for nullable fields)
      if (actualSortField === "lastTouchAt") {
        orderByArray.push({ [actualSortField]: { sort: actualSortOrder, nulls: "last" } });
      } else {
        orderByArray.push({ [actualSortField]: actualSortOrder });
      }
      // Add id as tie-breaker for stable pagination
      orderByArray.push({ id: actualSortOrder });
      
      orderBy = orderByArray;
    } else {
      // Default ordering for backward compatibility
      orderBy = { updatedAt: "desc" };
    }

    const findManyOptions: any = {
      where,
      include: {
        owner: true,
        proposalOwner: true,
        organization: true,
      },
      orderBy,
    };

    if (useCursorPagination) {
      // Cursor-based pagination (new format) - OPT-IN via 'limit' parameter
      const pageSize = Math.min(parseInt(limit || "25"), 100);
      findManyOptions.take = pageSize + 1; // Fetch one extra to determine if there's a next page
      
      // Decode cursor if provided
      let cursorData: { sortValue: any; id: string; sort: string } | null = null;
      if (cursor) {
        try {
          cursorData = JSON.parse(Buffer.from(cursor, "base64").toString("utf-8"));
        } catch (e) {
          // If cursor decode fails, treat as no cursor
          cursorData = null;
        }
      }
      
      if (cursorData && sortConfig) {
        // Build cursor WHERE clause for stable pagination
        // For desc order: (sortField < cursorValue) OR (sortField = cursorValue AND id < cursorId)
        // For asc order: (sortField > cursorValue) OR (sortField = cursorValue AND id > cursorId)
        const { sortValue, id: cursorId } = cursorData;
        const { field, order } = sortConfig;
        
        const cursorWhere: any = {
          OR: [],
        };
        
        if (order === "desc") {
          if (sortValue === null) {
            // If sorting by nullable field and cursor value is null, only compare by id
            cursorWhere.OR.push({
              [field]: null,
              id: { lt: cursorId },
            });
          } else {
            cursorWhere.OR.push({ [field]: { lt: sortValue } });
            cursorWhere.OR.push({
              [field]: sortValue,
              id: { lt: cursorId },
            });
          }
        } else {
          if (sortValue === null) {
            // For asc order with null values, non-null values come after nulls
            cursorWhere.OR.push({ [field]: { not: null } });
            cursorWhere.OR.push({
              [field]: null,
              id: { gt: cursorId },
            });
          } else {
            cursorWhere.OR.push({ [field]: { gt: sortValue } });
            cursorWhere.OR.push({
              [field]: sortValue,
              id: { gt: cursorId },
            });
          }
        }
        
        // Combine existing where with cursor where using AND
        findManyOptions.where = {
          AND: [where, cursorWhere],
        };
      }

      const contacts = await prisma.contact.findMany(findManyOptions);

      // Check if there are more items
      const hasNextPage = contacts.length > pageSize;
      const items = hasNextPage ? contacts.slice(0, pageSize) : contacts;
      
      // Encode next cursor if there are more pages
      let nextCursor: string | null = null;
      if (hasNextPage && items.length > 0 && sortConfig) {
        const lastItem = items[items.length - 1];
        const sortValue = (lastItem as any)[sortConfig.field];
        const cursorPayload = {
          sortValue,
          id: lastItem.id,
          sort: sort || "lastTouchAt_desc",
        };
        nextCursor = Buffer.from(JSON.stringify(cursorPayload)).toString("base64");
      }

      return NextResponse.json({
        items,
        nextCursor,
      });
    } else {
      // Offset-based pagination (old format for backward compatibility)
      // When no 'limit' parameter is provided, return exact same response as before
      findManyOptions.skip = skip;
      findManyOptions.take = take;

      const contacts = await prisma.contact.findMany(findManyOptions);

      // Return array format for backward compatibility
      return NextResponse.json(contacts);
    }
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
