import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

// GET /api/customers/[id]
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      cases: {
        include: {
          jobs: {
            include: { approved: true, draft: true },
            orderBy: { createdAt: "desc" },
          },
        },
        orderBy: { createdAt: "desc" },
      },
      jobs: {
        include: { approved: true, draft: true },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!customer) {
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  }

  return NextResponse.json({ customer });
}

// PATCH /api/customers/[id]
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body   = await req.json();

    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }

    const customer = await prisma.customer.update({
      where: { id },
      data: {
        fullName:            body.fullName?.trim()            || undefined,
        companyRegistration: body.companyRegistration?.trim() ?? null,
        contactPerson:       body.contactPerson?.trim()       ?? null,
        phone:               body.phone?.trim()               ?? null,
        email:               body.email?.trim()               ?? null,
        idNumber:            body.idNumber?.trim()            ?? null,
        address:             body.address?.trim()             ?? null,
        notes:               body.notes?.trim()               ?? null,
      },
    });

    return NextResponse.json({ customer });
  } catch (err: any) {
    console.error("PATCH /api/customers/[id] error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}