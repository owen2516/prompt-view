import { NextRequest, NextResponse } from "next/server";
import { getEntryData } from "@/lib/data/candidate-interview";

// This route reads live session/link state and never touches cookies(), so
// Next.js would otherwise treat it as statically cacheable and serve stale
// data (e.g. a candidate's completed submission still showing as "ready").
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const data = await getEntryData(token);
  return NextResponse.json(data);
}
