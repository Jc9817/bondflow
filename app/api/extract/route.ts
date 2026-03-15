import { NextRequest, NextResponse } from "next/server";
import { openai } from "@/lib/openai";
import { toFile } from "openai";

// The JSON schema we want OpenAI to strictly follow
const extractionSchema = {
  name: "document_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      amount: {
        type: ["number", "null"],
        description: "The monetary amount as a number, or null if not found.",
      },
      currency: {
        type: ["string", "null"],
        description: "3-letter currency code e.g. MYR, USD, or null if not found.",
      },
      date: {
        type: ["string", "null"],
        description: "Date in YYYY-MM-DD format, or null if not found.",
      },
      reference_no: {
        type: ["string", "null"],
        description: "Reference or invoice number, or null if not found.",
      },
    },
    required: ["amount", "currency", "date", "reference_no"],
    additionalProperties: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    // 1. Parse the uploaded file from the form
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

    // 2. Upload the file to OpenAI Files API
    const buffer = Buffer.from(await file.arrayBuffer());
    const openaiFile = await openai.files.create({
      file: await toFile(buffer, file.name, { type: file.type }),
      purpose: "user_data",
    });

    // 3. Call OpenAI Responses API with the uploaded file
    const response = await openai.responses.create({
      model: "gpt-4o",
      input: [
        {
          role: "user",
          content: [
            {
              type: "input_file",
              file_id: openaiFile.id,
            },
            {
              type: "input_text",
              text: `Extract fields from this document: amount, currency, date, reference_no.
- amount: numeric value only (no symbols), null if missing
- currency: 3-letter code like MYR or USD, null if missing  
- date: convert to YYYY-MM-DD format if possible, null if missing
- reference_no: invoice/reference number as string, null if missing
Return JSON only. No explanation.`,
            },
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          json_schema: extractionSchema,
        },
      },
    });

    // 4. Parse and return the extracted data
    const raw = response.output_text;
    const data = JSON.parse(raw);

    // Clean up the uploaded file from OpenAI to save storage
    await openai.files.del(openaiFile.id).catch(() => {});

    return NextResponse.json({ ok: true, data });
  } catch (err: any) {
    console.error("Extraction error:", err);
    return NextResponse.json(
      { ok: false, error: err?.message || "Extraction failed. Check server logs." },
      { status: 500 }
    );
  }
}