import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

// PATCH /api/uploads/[id]
// Accepts: { status, caseId, customerId, approved: { amount, currency, date, referenceNo } }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params;
    const body    = await req.json();
    const { caseId, customerId, status, approved } = body;

    // Build update payload — only include fields that were sent
    const updateData: any = {};
    if (status     !== undefined) updateData.status     = status;
    if (caseId     !== undefined) updateData.caseId     = caseId;
    if (customerId !== undefined) updateData.customerId = customerId;

    const job = await prisma.upload.update({
      where: { id },
      data:  updateData,
      include: {
        customer: { select: { id: true, fullName: true } },
        case:     { select: { id: true, caseType: true } },
      },
    });

    // Save approved/extracted data if provided
    if (approved) {
      await prisma.approvedData.upsert({
        where:  { uploadId: id },
        create: {
          uploadId:    id,
          amount:      approved.amount      ?? null,
          currency:    approved.currency    ?? null,
          date:        approved.date        ?? null,
          referenceNo: approved.referenceNo ?? null,
        },
        update: {
          amount:      approved.amount      ?? null,
          currency:    approved.currency    ?? null,
          date:        approved.date        ?? null,
          referenceNo: approved.referenceNo ?? null,
        },
      });
    }

    return NextResponse.json({ job });
  } catch (err: any) {
    console.error("PATCH error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// DELETE /api/uploads/[id]
export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const upload = await prisma.upload.findUnique({ where: { id } });
    if (!upload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Disconnect from customer/case first, then delete related records
    await prisma.upload.update({ where: { id }, data: { caseId: null, customerId: null } });
    await prisma.extractionDraft.deleteMany({ where: { uploadId: id } });
    await prisma.approvedData.deleteMany({ where: { uploadId: id } });
    await prisma.upload.delete({ where: { id } });

    // Try delete from disk
    try {
      const diskPath = path.join(process.cwd(), "public", upload.filePath);
      await unlink(diskPath);
    } catch { /* file might not exist on disk */ }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}