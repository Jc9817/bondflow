import { NextRequest, NextResponse } from "next/server";

/**
 * POST /api/extract
 *
 * AI extraction is disabled for now — returning empty fields for manual entry.
 * To re-enable AI later, restore the OpenAI logic from git history
 * or swap the return statement below with the OpenAI call.
 */
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData();
    const file = form.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }

    const allowedTypes = ["application/pdf", "image/jpeg", "image/png", "image/webp", "image/gif"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { ok: false, error: "Only PDF and images (jpg, png, webp, gif) are supported." },
        { status: 400 }
      );
    }

    // Return empty fields — user fills them manually on the review page
    return NextResponse.json({
      ok: true,
      data: {
        amount:       null,
        currency:     null,
        date:         null,
        reference_no: null,
      },
    });

  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message || "Something went wrong." },
      { status: 500 }
    );
  }
}