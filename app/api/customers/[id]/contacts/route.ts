import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

// POST /api/customers/[id]/contacts — add a new contact person
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: customerId } = await params;
    const body = await req.json();
    const { name, phone, email } = body;

    if (!name?.trim()) {
      return NextResponse.json({ error: "Contact name is required" }, { status: 400 });
    }

    const contact = await prisma.contactPerson.create({
      data: {
        customerId,
        name:  name.trim(),
        phone: phone?.trim() || null,
        email: email?.trim() || null,
      },
    });

    return NextResponse.json({ contact }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/customers/[id]/contacts?contactId=xxx
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    await params; // ensure params resolved
    const contactId = req.nextUrl.searchParams.get("contactId");
    if (!contactId) {
      return NextResponse.json({ error: "contactId is required" }, { status: 400 });
    }
    await prisma.contactPerson.delete({ where: { id: contactId } });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}