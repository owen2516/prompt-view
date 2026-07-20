import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { generateQuestion } from "@/lib/gemini";

const generateSchema = z.object({
  topic: z.string().min(1, "Topic is required"),
  difficulty: z.enum(["easy", "medium", "hard"]),
  language: z.string().min(1, "Programming language is required"),
  additionalRequirements: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  await params;
  try {
    const adminId = await getAuthenticatedAdminId();
    if (!adminId) {
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    }

    const parsed = generateSchema.safeParse(await req.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "invalid_body" }, { status: 400 });
    }

    const question = await generateQuestion({
      topic: parsed.data.topic,
      difficulty: parsed.data.difficulty,
      language: parsed.data.language,
      additionalRequirements: parsed.data.additionalRequirements,
    });

    return NextResponse.json({ question });
  } catch (error) {
    console.error("Error generating question:", error);

    if (error instanceof Error) {
      // Handle rate limiting
      if (error.message.includes("429") || error.message.includes("quota")) {
        return NextResponse.json(
          {
            error: "rate_limit_exceeded",
            message:
              "API quota exceeded. Please try again in a few minutes or use the free tier limits more carefully.",
          },
          { status: 429 }
        );
      }

      return NextResponse.json(
        {
          error: "generation_failed",
          message: error.message,
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "unknown_error" },
      { status: 500 }
    );
  }
}
