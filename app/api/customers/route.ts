import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? "";

  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { fullName:            { contains: search } },
        { companyName:         { contains: search } },
        { companyRegistration: { contains: search } },
        { phone:               { contains: search } },
        { email:               { contains: search } },
        { idNumber:            { contains: search } },
      ],
    } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      contacts: true,
      cases:    { select: { id: true, caseType: true, caseStatus: true } },
      jobs:     { select: { id: true, status: true } },
    },
  });

  return NextResponse.json({ customers });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName, companyName, companyRegistration,
      phone, email, idNumber, address, notes,
    } = body;

    if (!fullName?.trim()) {
      return NextResponse.json({ error: "fullName is required" }, { status: 400 });
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const customer = await prisma.customer.create({
      data: {
        fullName:            fullName.trim(),
        companyName:         companyName?.trim()         || null,
        companyRegistration: companyRegistration?.trim() || null,
        phone:               phone?.trim()               || null,
        email:               email?.trim()               || null,
        idNumber:            idNumber?.trim()            || null,
        address:             address?.trim()             || null,
        notes:               notes?.trim()               || null,
      },
      include: { contacts: true, cases: true, jobs: true },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/customers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}