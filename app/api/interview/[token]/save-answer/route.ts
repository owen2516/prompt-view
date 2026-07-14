import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveAnswer } from "@/lib/data/candidate-interview";

const bodySchema = z.object({
  sessionId: z.string(),
  answers: z.record(z.string(), z.string()),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { token } = await params;
  try {
    await saveAnswer(token, parsed.data.sessionId, parsed.data.answers);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    const status = message === "not_found" ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
