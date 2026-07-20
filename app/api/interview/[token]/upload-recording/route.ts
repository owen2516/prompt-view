import { NextRequest, NextResponse } from "next/server";
import { uploadRecording } from "@/lib/data/candidate-interview";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const formData = await req.formData();
  const sessionId = formData.get("sessionId");
  const durationSecondsRaw = formData.get("durationSeconds");
  const file = formData.get("file");

  if (typeof sessionId !== "string" || !(file instanceof Blob)) {
    return NextResponse.json({ error: "invalid_body" }, { status: 400 });
  }
  const durationSeconds =
    typeof durationSecondsRaw === "string" && durationSecondsRaw
      ? Math.round(Number(durationSecondsRaw))
      : null;

  try {
    const bytes = new Uint8Array(await file.arrayBuffer());
    await uploadRecording(token, sessionId, bytes, file.type || "video/webm", durationSeconds);
    return NextResponse.json({ ok: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "error";
    if (message === "not_found") return NextResponse.json({ error: "not_found" }, { status: 404 });
    if (message === "not_writable") return NextResponse.json({ error: "not_writable" }, { status: 409 });
    console.error("Upload recording error:", e);
    return NextResponse.json({ error: "upload_failed", message }, { status: 500 });
  }
}
