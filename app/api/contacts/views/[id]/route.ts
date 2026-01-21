import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { z } from "zod";
import { getCurrentUser } from "@/lib/currentUser";

const updateViewSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  filtersJson: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateViewSchema.parse(body);

    // Check if view exists and belongs to user
    const existingView = await prisma.contactSavedView.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingView) {
      return NextResponse.json(
        { error: "View not found" },
        { status: 404 }
      );
    }

    // If setting as default, unset other defaults
    if (validatedData.isDefault) {
      await prisma.contactSavedView.updateMany({
        where: { userId: user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    const view = await prisma.contactSavedView.update({
      where: { id },
      data: validatedData,
    });

    return NextResponse.json(view);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: error.issues },
        { status: 400 }
      );
    }
    console.error("Error updating saved view:", error);
    return NextResponse.json(
      { error: "Failed to update saved view" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    // Check if view exists and belongs to user
    const existingView = await prisma.contactSavedView.findFirst({
      where: { id, userId: user.id },
    });

    if (!existingView) {
      return NextResponse.json(
        { error: "View not found" },
        { status: 404 }
      );
    }

    await prisma.contactSavedView.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting saved view:", error);
    return NextResponse.json(
      { error: "Failed to delete saved view" },
      { status: 500 }
    );
  }
}
