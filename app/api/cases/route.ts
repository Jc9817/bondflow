import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

export async function GET(req: NextRequest) {
  const customerId = req.nextUrl.searchParams.get("customerId");
  const cases = await prisma.case.findMany({
    where: customerId ? { customerId } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      customer: { select: { id: true, fullName: true, companyName: true } },
      jobs: { select: { id: true, fileName: true, status: true }, orderBy: { createdAt: "desc" } },
    },
  });
  return NextResponse.json({ cases });
}

export async function POST(req: NextRequest) {
  try {
    const { customerId, caseType } = await req.json();
    if (!customerId || !caseType) return NextResponse.json({ error: "customerId and caseType required" }, { status: 400 });
    const newCase = await prisma.case.create({
      data: { customerId, caseType },
      include: { customer: { select: { id: true, fullName: true, companyName: true } }, jobs: true },
    });
    return NextResponse.json({ case: newCase }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}