import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/prisma/lib/prisma";

// GET /api/cases/[id]/comments
export async function GET(
  _: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const comments = await prisma.caseComment.findMany({
      where:   { caseId: id },
      orderBy: { createdAt: "asc" },
    });
    return NextResponse.json({ comments });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

// POST /api/cases/[id]/comments
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id }  = await params;
    const body    = await req.json();
    const { content, author } = body;

    if (!content?.trim()) {
      return NextResponse.json({ error: "Content is required" }, { status: 400 });
    }

    const comment = await prisma.caseComment.create({
      data: {
        caseId:  id,
        content: content.trim(),
        author:  author?.trim() || null,
      },
    });

    return NextResponse.json({ comment }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}