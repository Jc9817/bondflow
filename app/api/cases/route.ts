import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  const cases = await prisma.case.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, fullName: true } },
      jobs: { select: { id: true, fileName: true, status: true } },
    },
  });
  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { customerId, caseType } = body;
    if (!customerId || !caseType) {
      return NextResponse.json({ error: "customerId and caseType are required" }, { status: 400 });
    }
    const newCase = await prisma.case.create({
      data: { customerId, caseType },
      include: { customer: { select: { id: true, fullName: true } } },
    });
    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}