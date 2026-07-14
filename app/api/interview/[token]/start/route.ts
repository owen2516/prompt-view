import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { startOrResumeSession } from "@/lib/data/candidate-interview";

const bodySchema = z.object({
  candidateName: z.string().min(1),
  candidateEmail: z.string().email().optional().or(z.literal("")).optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { token } = await params;
  try {
    const session = await startOrResumeSession(
      token,
      parsed.data.candidateName,
      parsed.data.candidateEmail || null
    );
    return NextResponse.json({ session });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    const status = message === "not_found" ? 404 : 409;
    return NextResponse.json({ error: message }, { status });
  }
}
