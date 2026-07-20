import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { runQuestionCode } from "@/lib/data/candidate-interview";

const bodySchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  code: z.string(),
  stdin: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { token } = await params;
  try {
    const result = await runQuestionCode(
      token,
      parsed.data.sessionId,
      parsed.data.questionId,
      parsed.data.code,
      parsed.data.stdin
    );
    return NextResponse.json(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";

    if (message === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (message === "not_writable") {
      return NextResponse.json({ error: "not_writable" }, { status: 409 });
    }
    if (message === "no_test_cases") {
      return NextResponse.json({ error: "no_test_cases", message: "此題目尚未設定測試案例" }, { status: 400 });
    }
    if (message.startsWith("unsupported_language")) {
      return NextResponse.json(
        { error: "unsupported_language", message: "此程式語言暫不支援線上執行" },
        { status: 400 }
      );
    }

    console.error("Run error:", e);
    return NextResponse.json({ error: "run_failed", message }, { status: 500 });
  }
}
