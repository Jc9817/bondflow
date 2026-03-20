import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const c = await prisma.case.findUnique({
    where: { id },
    include: {
      customer: true,
      jobs: {
        include: { approved: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });
  if (!c) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ case: c });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body   = await req.json();
    const updated = await prisma.case.update({
      where: { id },
      data: {
        caseType:   body.caseType,
        caseStatus: body.caseStatus,
      },
    });
    return NextResponse.json({ case: updated });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}