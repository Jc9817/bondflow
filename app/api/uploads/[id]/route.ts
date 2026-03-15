import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";
import { unlink } from "fs/promises";
import path from "path";

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { caseId, status, approved } = body;

    const updateData: any = {};
    if (caseId  !== undefined) updateData.caseId = caseId;
    if (status  !== undefined) updateData.status = status;

    const job = await prisma.upload.update({
      where: { id },
      data: updateData,
    });

    if (approved) {
      await prisma.approvedData.upsert({
        where:  { uploadId: id },
        create: {
          uploadId:    id,
          amount:      approved.amount ?? null,
          currency:    approved.currency ?? null,
          date:        approved.date ?? null,
          referenceNo: approved.referenceNo ?? null,
        },
        update: {
          amount:      approved.amount ?? null,
          currency:    approved.currency ?? null,
          date:        approved.date ?? null,
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

export async function DELETE(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const upload = await prisma.upload.findUnique({
      where: { id },
    });

    if (!upload) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.upload.update({ where: { id }, data: { caseId: null } });
    await prisma.extractionDraft.deleteMany({ where: { uploadId: id } });
    await prisma.approvedData.deleteMany({ where: { uploadId: id } });
    await prisma.upload.delete({ where: { id } });

    try {
      const diskPath = path.join(process.cwd(), "public", upload.filePath);
      await unlink(diskPath);
    } catch {
      // File might not exist on disk
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("DELETE error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}