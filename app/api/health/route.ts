import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const timestamp = new Date().toISOString();
  const env = process.env.NODE_ENV || "development";
  
  let dbOk = false;
  let dbDetails: string | undefined;

  try {
    // Lightweight DB connectivity check using contact.count()
    await prisma.contact.count();
    dbOk = true;
  } catch (error) {
    // Don't expose sensitive error details
    dbDetails = error instanceof Error ? "Database connection failed" : "Unknown database error";
  }

  const ok = dbOk;

  return NextResponse.json({
    ok,
    timestamp,
    env,
    db: {
      ok: dbOk,
      ...(dbDetails && { details: dbDetails }),
    },
  });
}
