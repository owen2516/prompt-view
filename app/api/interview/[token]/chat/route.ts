import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendAiMessage } from "@/lib/data/candidate-interview";

const bodySchema = z.object({
  sessionId: z.string(),
  questionId: z.string(),
  currentCode: z.string(),
  message: z.string().min(1),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const parsed = bodySchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const { token } = await params;
  try {
    const assistantMessage = await sendAiMessage(
      token,
      parsed.data.sessionId,
      parsed.data.questionId,
      parsed.data.currentCode,
      parsed.data.message
    );
    return NextResponse.json({
      message: assistantMessage.content,
      messageId: assistantMessage.id,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";

    if (message === "not_found") {
      return NextResponse.json({ error: "not_found" }, { status: 404 });
    }
    if (message === "not_writable") {
      return NextResponse.json({ error: "not_writable" }, { status: 409 });
    }
    if (message.includes("429") || message.toLowerCase().includes("quota")) {
      return NextResponse.json(
        {
          error: "rate_limit_exceeded",
          message: "AI 服務暫時因配額限制無法使用，請稍候再試。",
        },
        { status: 429 }
      );
    }

    console.error("Chat error:", e);
    return NextResponse.json({ error: "chat_failed", message }, { status: 500 });
  }
}
