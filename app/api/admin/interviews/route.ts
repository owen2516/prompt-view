import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getAuthenticatedAdminId } from "@/lib/auth";
import { listInterviewSets, createInterviewSet } from "@/lib/data/interviews";

export async function GET() {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const sets = await listInterviewSets(adminId);
  return NextResponse.json({ sets });
}

const createSchema = z.object({
  title: z.string().min(1),
  target_role: z.string().optional().nullable(),
});

export async function POST(req: NextRequest) {
  const adminId = await getAuthenticatedAdminId();
  if (!adminId) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const parsed = createSchema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }

  const set = await createInterviewSet(adminId, parsed.data);
  return NextResponse.json({ set }, { status: 201 });
}
