import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { getAiSettings, upsertAiSettings } from "@/lib/data/ai-settings";

export async function GET() {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const settings = await getAiSettings(adminId);
  return NextResponse.json({ settings });
}

const putSchema = z.object({
  default_model: z.string().min(1),
  default_system_prompt: z.string().nullable().optional(),
});

export async function PUT(req: NextRequest) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = putSchema.safeParse(await req.json());
  if (!parsed.success) return NextResponse.json({ error: "invalid_body" }, { status: 400 });

  const settings = await upsertAiSettings(adminId, parsed.data);
  return NextResponse.json({ settings });
}
