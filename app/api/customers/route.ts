import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

// GET /api/customers?search=xxx
export async function GET(req: NextRequest) {
  const search = req.nextUrl.searchParams.get("search") ?? "";

  const customers = await prisma.customer.findMany({
    where: search ? {
      OR: [
        { fullName:            { contains: search } },
        { phone:               { contains: search } },
        { idNumber:            { contains: search } },
        { email:               { contains: search } },
        { companyRegistration: { contains: search } },
        { contactPerson:       { contains: search } },
      ],
    } : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      cases: { select: { id: true, caseType: true, caseStatus: true } },
      jobs:  { select: { id: true, status: true } },
    },
  });

  return NextResponse.json({ customers });
}

// POST /api/customers
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      fullName, companyRegistration, contactPerson,
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
        companyRegistration: companyRegistration?.trim() || null,
        contactPerson:       contactPerson?.trim()       || null,
        phone:               phone?.trim()               || null,
        email:               email?.trim()               || null,
        idNumber:            idNumber?.trim()            || null,
        address:             address?.trim()             || null,
        notes:               notes?.trim()               || null,
      },
    });

    return NextResponse.json({ customer }, { status: 201 });
  } catch (err: any) {
    console.error("POST /api/customers error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}