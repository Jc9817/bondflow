import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = path.join(process.cwd(), "public", "uploads");

// GET /api/uploads -> list all uploads with case+customer info
export async function GET() {
  try {
    const uploads = await prisma.upload.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        case: {
          include: {
            customer: { select: { id: true, fullName: true } },
          },
        },
      },
    });
    return NextResponse.json({ uploads });
  } catch (err: any) {
    console.error("GET error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/uploads -> upload a new file
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext     = path.extname(file.name);
    const savedAs = `${randomUUID()}${ext}`;
    const filePath = path.join(UPLOAD_DIR, savedAs);

    const buffer = Buffer.from(await file.arrayBuffer());
    await writeFile(filePath, buffer);

    const upload = await prisma.upload.create({
      data: {
        fileName:    file.name,
        filePath:    `/uploads/${savedAs}`,
        contentType: file.type || null,
        size:        file.size,
        status:      "UPLOADED",
      },
    });

    return NextResponse.json({ success: true, savedAs, upload }, { status: 201 });
  } catch (err: any) {
    console.error("Upload error:", err);
    return NextResponse.json({ error: err.message || "Server error" }, { status: 500 });
  }
}