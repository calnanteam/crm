import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// Validation schema
const createProposalSchema = z.object({
  contactId: z.string(),
  status: z.enum(["DRAFT", "READY", "SENT", "ACCEPTED", "DECLINED"]).optional(),
  ownerUserId: z.string().optional(),
  docUrl: z.string().url().optional().or(z.literal("")),
  notes: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const contactId = searchParams.get("contactId");
    const skip = parseInt(searchParams.get("skip") || "0");
    const take = parseInt(searchParams.get("take") || "50");

    const where: any = {};
    if (contactId) where.contactId = contactId;

    const proposals = await prisma.proposal.findMany({
      where,
      include: {
        owner: true,
        contact: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
      orderBy: { updatedAt: "desc" },
      skip,
      take: Math.min(take, 100),
    });

    return NextResponse.json(proposals);
  } catch (error) {
    console.error("Error fetching proposals:", error);
    return NextResponse.json(
      { error: "Failed to fetch proposals" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = createProposalSchema.parse(body);
    
    // If no owner specified, try to assign to MD
    let ownerUserId = validatedData.ownerUserId;
    if (!ownerUserId) {
      const mdUser = await prisma.user.findFirst({
        where: { email: { contains: "md", mode: "insensitive" } },
      });
      if (mdUser) {
        ownerUserId = mdUser.id;
      }
    }

    const proposal = await prisma.proposal.create({
      data: {
        contactId: validatedData.contactId,
        status: validatedData.status || "DRAFT",
        ownerUserId,
        docUrl: validatedData.docUrl || null,
        notes: validatedData.notes,
      },
      include: {
        owner: true,
        contact: {
          select: {
            id: true,
            displayName: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    // Create activity for proposal creation
    await prisma.activity.create({
      data: {
        type: "NOTE",
        subject: "Proposal Created",
        body: `Proposal created with status: ${proposal.status}`,
        contactId: validatedData.contactId,
        source: "system",
      },
    });

    return NextResponse.json(proposal, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error creating proposal:", error);
    return NextResponse.json(
      { error: "Failed to create proposal" },
      { status: 500 }
    );
  }
}
