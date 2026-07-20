import { createAdminClient } from "@/lib/supabase/admin";
import { isExpired } from "@/lib/tokens";
import { chat as geminiChat } from "@/lib/gemini";
import { runOnce, runTestCases, type TestCaseResult } from "@/lib/judge0";
import type { AiMessage, InterviewLink, InterviewSession, Question } from "@/types/db";

export type LinkEntryStatus =
  | "not_found"
  | "expired"
  | "completed"
  | "ready";

export async function loadLinkByToken(token: string) {
  const supabase = createAdminClient();
  const { data: link } = await supabase
    .from("interview_links")
    .select("*")
    .eq("token", token)
    .maybeSingle();
  return link as InterviewLink | null;
}

export async function getEntryData(token: string) {
  const link = await loadLinkByToken(token);
  if (!link) return { status: "not_found" as LinkEntryStatus };

  if (link.status === "completed") return { status: "completed" as LinkEntryStatus, link };
  if (link.status === "expired" || isExpired(link.expires_at)) {
    return { status: "expired" as LinkEntryStatus, link };
  }

  const supabase = createAdminClient();
  const { data: set } = await supabase
    .from("interview_sets")
    .select("*")
    .eq("id", link.interview_set_id)
    .maybeSingle();
  if (!set) return { status: "not_found" as LinkEntryStatus };

  const { data: questions } = set.question_ids.length
    ? await supabase.from("questions").select("*").in("id", set.question_ids)
    : { data: [] as Question[] };
  const orderedQuestions = set.question_ids
    .map((id: string) => (questions ?? []).find((q: Question) => q.id === id))
    .filter(Boolean) as Question[];

  const { data: existingSession } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("link_id", link.id)
    .maybeSingle();

  return {
    status: "ready" as LinkEntryStatus,
    link,
    set,
    questions: orderedQuestions,
    existingSession: (existingSession as InterviewSession | null) ?? null,
  };
}

export async function startOrResumeSession(
  token: string,
  candidateName: string,
  candidateEmail?: string | null
) {
  const link = await loadLinkByToken(token);
  if (!link) throw new Error("not_found");
  if (link.status === "completed") throw new Error("completed");
  if (link.status === "expired" || isExpired(link.expires_at)) throw new Error("expired");

  const supabase = createAdminClient();

  const { data: set } = await supabase
    .from("interview_sets")
    .select("id, admin_id")
    .eq("id", link.interview_set_id)
    .maybeSingle();
  if (!set) throw new Error("not_found");

  const { data: existingSession } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("link_id", link.id)
    .maybeSingle();

  await supabase
    .from("interview_links")
    .update({
      open_count: (link.open_count ?? 0) + 1,
      status: "in_progress",
      candidate_name: link.candidate_name ?? candidateName,
      candidate_email: link.candidate_email ?? candidateEmail ?? null,
    })
    .eq("id", link.id);

  if (existingSession) return existingSession as InterviewSession;

  let candidateId: string | null = null;
  if (candidateEmail) {
    const { data: existingCandidate } = await supabase
      .from("candidates")
      .select("id")
      .eq("admin_id", set.admin_id)
      .eq("email", candidateEmail)
      .maybeSingle();
    candidateId = existingCandidate?.id ?? null;
  }
  if (!candidateId) {
    const { data: newCandidate, error: candidateError } = await supabase
      .from("candidates")
      .insert({ admin_id: set.admin_id, name: candidateName, email: candidateEmail ?? null })
      .select("id")
      .single();
    if (candidateError) throw candidateError;
    candidateId = newCandidate.id;
  }

  const { data: session, error } = await supabase
    .from("interview_sessions")
    .insert({
      link_id: link.id,
      candidate_id: candidateId,
      candidate_name: candidateName,
      started_at: new Date().toISOString(),
      last_active_at: new Date().toISOString(),
      final_answers: {},
      status: "in_progress",
    })
    .select("*")
    .single();
  if (error) throw error;

  return session as InterviewSession;
}

async function assertWritableSession(token: string, sessionId: string) {
  const link = await loadLinkByToken(token);
  if (!link) throw new Error("not_found");
  if (link.status !== "pending" && link.status !== "in_progress") {
    throw new Error("not_writable");
  }
  const supabase = createAdminClient();
  const { data: session } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .eq("link_id", link.id)
    .maybeSingle();
  if (!session) throw new Error("not_found");
  if (session.status === "completed") throw new Error("not_writable");
  return { link, session: session as InterviewSession };
}

export async function saveAnswer(
  token: string,
  sessionId: string,
  finalAnswers: Record<string, string>
) {
  const { session } = await assertWritableSession(token, sessionId);
  const supabase = createAdminClient();
  const merged = { ...(session.final_answers ?? {}), ...finalAnswers };
  const { error } = await supabase
    .from("interview_sessions")
    .update({ final_answers: merged, last_active_at: new Date().toISOString() })
    .eq("id", sessionId);
  if (error) throw error;
}

export async function sendAiMessage(
  token: string,
  sessionId: string,
  questionId: string,
  currentCode: string,
  userMessage: string
): Promise<AiMessage> {
  const { session } = await assertWritableSession(token, sessionId);
  const supabase = createAdminClient();

  const link = await loadLinkByToken(token);
  if (!link) throw new Error("not_found");

  const { data: set } = await supabase
    .from("interview_sets")
    .select("ai_model, ai_system_prompt")
    .eq("id", link.interview_set_id)
    .maybeSingle();
  if (!set) throw new Error("not_found");

  const { data: question } = await supabase
    .from("questions")
    .select("description")
    .eq("id", questionId)
    .maybeSingle();
  if (!question) throw new Error("not_found");

  const { data: history } = await supabase
    .from("ai_messages")
    .select("role, content")
    .eq("session_id", sessionId)
    .eq("question_id", questionId)
    .order("created_at", { ascending: true });

  const systemPrompt =
    set.ai_system_prompt ??
    "你是一位友善的技術面試助手，幫助應試者解決程式題。可依應試者要求直接提供完整解答。請用繁體中文回應。";

  const assistantReply = await geminiChat({
    systemPrompt,
    questionDescription: question.description,
    candidateCode: currentCode,
    conversationHistory: (history ?? []).map((m) => ({
      role: m.role as "user" | "assistant",
      content: m.content,
    })),
    userMessage,
  });

  await supabase.from("ai_messages").insert([
    { session_id: sessionId, question_id: questionId, role: "user", content: userMessage },
  ]);

  const { data: assistantMessage, error } = await supabase
    .from("ai_messages")
    .insert({
      session_id: sessionId,
      question_id: questionId,
      role: "assistant",
      content: assistantReply,
    })
    .select("*")
    .single();
  if (error) throw error;

  await supabase
    .from("interview_sessions")
    .update({
      ai_interaction_count: (session.ai_interaction_count ?? 0) + 1,
      last_active_at: new Date().toISOString(),
    })
    .eq("id", sessionId);

  return assistantMessage as AiMessage;
}

export async function runQuestionCode(
  token: string,
  sessionId: string,
  questionId: string,
  code: string,
  customStdin?: string
): Promise<
  | { mode: "manual"; stdout: string; stderr: string | null; compileOutput: string | null }
  | { mode: "tests"; results: TestCaseResult[] }
> {
  await assertWritableSession(token, sessionId);
  const supabase = createAdminClient();

  const { data: question } = await supabase
    .from("questions")
    .select("language, test_cases")
    .eq("id", questionId)
    .maybeSingle();
  if (!question) throw new Error("not_found");

  if (customStdin !== undefined) {
    const output = await runOnce(question.language, code, customStdin);
    return {
      mode: "manual",
      stdout: output.stdout,
      stderr: output.stderr,
      compileOutput: output.compileOutput,
    };
  }

  const testCases = question.test_cases ?? [];
  if (testCases.length === 0) throw new Error("no_test_cases");

  const results = await runTestCases(question.language, code, testCases);
  return { mode: "tests", results };
}

export async function submitSession(token: string, sessionId: string) {
  const { link, session } = await assertWritableSession(token, sessionId);
  const supabase = createAdminClient();

  const { error } = await supabase
    .from("interview_sessions")
    .update({
      status: "completed",
      submitted_at: new Date().toISOString(),
    })
    .eq("id", sessionId);
  if (error) throw error;

  await supabase.from("interview_links").update({ status: "completed" }).eq("id", link.id);

  return session;
}
