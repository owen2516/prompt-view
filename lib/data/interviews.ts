import { createAdminClient } from "@/lib/supabase/admin";
import { generateLinkToken, expiryDateFromDays } from "@/lib/tokens";
import type { InterviewSet, InterviewLink, Question, Difficulty } from "@/types/db";

export interface InterviewSetCard extends InterviewSet {
  question_count: number;
  total_question_minutes: number;
  total_opens: number;
  completed_count: number;
}

async function loadSetsWithAggregates(
  sets: InterviewSet[]
): Promise<InterviewSetCard[]> {
  if (sets.length === 0) return [];
  const supabase = createAdminClient();

  const allQuestionIds = [...new Set(sets.flatMap((s) => s.question_ids))];
  const { data: questions } = allQuestionIds.length
    ? await supabase
        .from("questions")
        .select("id, time_limit_minutes")
        .in("id", allQuestionIds)
    : { data: [] as Pick<Question, "id" | "time_limit_minutes">[] };
  const questionMinutesById = new Map(
    (questions ?? []).map((q) => [q.id, q.time_limit_minutes ?? 0])
  );

  const setIds = sets.map((s) => s.id);
  const { data: links } = await supabase
    .from("interview_links")
    .select("id, interview_set_id, open_count")
    .in("interview_set_id", setIds);
  const linkIds = (links ?? []).map((l) => l.id);

  const { data: sessions } = linkIds.length
    ? await supabase
        .from("interview_sessions")
        .select("link_id, status")
        .in("link_id", linkIds)
    : { data: [] as { link_id: string; status: string }[] };

  const completedLinkIds = new Set(
    (sessions ?? []).filter((s) => s.status === "completed").map((s) => s.link_id)
  );

  return sets.map((set) => {
    const setLinks = (links ?? []).filter((l) => l.interview_set_id === set.id);
    const total_opens = setLinks.reduce((sum, l) => sum + (l.open_count ?? 0), 0);
    const completed_count = setLinks.filter((l) => completedLinkIds.has(l.id)).length;
    const total_question_minutes = set.question_ids.reduce(
      (sum, qid) => sum + (questionMinutesById.get(qid) ?? 0),
      0
    );
    return {
      ...set,
      question_count: set.question_ids.length,
      total_question_minutes,
      total_opens,
      completed_count,
    };
  });
}

export async function listInterviewSets(adminId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sets")
    .select("*")
    .eq("admin_id", adminId)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return loadSetsWithAggregates((data ?? []) as InterviewSet[]);
}

export async function createInterviewSet(
  adminId: string,
  input: { title: string; target_role?: string | null }
) {
  const supabase = createAdminClient();
  const { data: aiSettings } = await supabase
    .from("ai_settings")
    .select("default_model, default_system_prompt")
    .eq("admin_id", adminId)
    .maybeSingle();

  const { data, error } = await supabase
    .from("interview_sets")
    .insert({
      admin_id: adminId,
      title: input.title,
      target_role: input.target_role ?? null,
      question_ids: [],
      status: "draft",
      ai_model: aiSettings?.default_model ?? "claude-sonnet-4-6",
      ai_system_prompt: aiSettings?.default_system_prompt ?? null,
    })
    .select("*")
    .single();
  if (error) throw error;
  return data as InterviewSet;
}

async function getOwnedSet(adminId: string, setId: string) {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sets")
    .select("*")
    .eq("id", setId)
    .eq("admin_id", adminId)
    .maybeSingle();
  if (error) throw error;
  return data as InterviewSet | null;
}

export async function getInterviewSetDetail(adminId: string, setId: string) {
  const set = await getOwnedSet(adminId, setId);
  if (!set) return null;

  const supabase = createAdminClient();
  const { data: questions } = set.question_ids.length
    ? await supabase.from("questions").select("*").in("id", set.question_ids)
    : { data: [] as Question[] };

  const orderedQuestions = set.question_ids
    .map((id) => (questions ?? []).find((q) => q.id === id))
    .filter((q): q is Question => Boolean(q));

  return { set, questions: orderedQuestions };
}

export async function updateInterviewSetSettings(
  adminId: string,
  setId: string,
  updates: Partial<
    Pick<
      InterviewSet,
      | "title"
      | "target_role"
      | "time_limit_minutes"
      | "expires_at"
      | "ai_model"
      | "ai_system_prompt"
      | "status"
    >
  >
) {
  const owned = await getOwnedSet(adminId, setId);
  if (!owned) throw new Error("not_found");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("interview_sets")
    .update(updates)
    .eq("id", setId)
    .select("*")
    .single();
  if (error) throw error;
  return data as InterviewSet;
}

export async function addQuestion(
  adminId: string,
  setId: string,
  input: {
    title: string;
    description: string;
    language: string;
    difficulty: Difficulty;
    time_limit_minutes?: number | null;
    starter_code?: string | null;
    is_ai_generated?: boolean;
  }
) {
  const set = await getOwnedSet(adminId, setId);
  if (!set) throw new Error("not_found");
  const supabase = createAdminClient();

  const { data: question, error } = await supabase
    .from("questions")
    .insert({
      admin_id: adminId,
      title: input.title,
      description: input.description,
      language: input.language,
      difficulty: input.difficulty,
      time_limit_minutes: input.time_limit_minutes ?? null,
      starter_code: input.starter_code ?? null,
      is_ai_generated: input.is_ai_generated ?? false,
    })
    .select("*")
    .single();
  if (error) throw error;

  const newQuestionIds = [...set.question_ids, question.id];
  const { error: updateError } = await supabase
    .from("interview_sets")
    .update({ question_ids: newQuestionIds })
    .eq("id", setId);
  if (updateError) throw updateError;

  return question as Question;
}

export async function updateQuestion(
  adminId: string,
  setId: string,
  questionId: string,
  updates: Partial<
    Pick<
      Question,
      | "title"
      | "description"
      | "language"
      | "difficulty"
      | "time_limit_minutes"
      | "starter_code"
    >
  >
) {
  const set = await getOwnedSet(adminId, setId);
  if (!set || !set.question_ids.includes(questionId)) throw new Error("not_found");
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("questions")
    .update(updates)
    .eq("id", questionId)
    .eq("admin_id", adminId)
    .select("*")
    .single();
  if (error) throw error;
  return data as Question;
}

export async function deleteQuestion(
  adminId: string,
  setId: string,
  questionId: string
) {
  const set = await getOwnedSet(adminId, setId);
  if (!set) throw new Error("not_found");
  const supabase = createAdminClient();

  const newQuestionIds = set.question_ids.filter((id) => id !== questionId);
  const { error: updateError } = await supabase
    .from("interview_sets")
    .update({ question_ids: newQuestionIds })
    .eq("id", setId);
  if (updateError) throw updateError;

  await supabase.from("questions").delete().eq("id", questionId).eq("admin_id", adminId);
}

export async function reorderQuestions(
  adminId: string,
  setId: string,
  orderedQuestionIds: string[]
) {
  const set = await getOwnedSet(adminId, setId);
  if (!set) throw new Error("not_found");
  const sameSet =
    orderedQuestionIds.length === set.question_ids.length &&
    orderedQuestionIds.every((id) => set.question_ids.includes(id));
  if (!sameSet) throw new Error("invalid_order");

  const supabase = createAdminClient();
  const { error } = await supabase
    .from("interview_sets")
    .update({ question_ids: orderedQuestionIds })
    .eq("id", setId);
  if (error) throw error;
}

export async function getLinkTabData(adminId: string, setId: string) {
  const set = await getOwnedSet(adminId, setId);
  if (!set) return null;
  const supabase = createAdminClient();

  const { data: links } = await supabase
    .from("interview_links")
    .select("*")
    .eq("interview_set_id", setId)
    .order("created_at", { ascending: false });

  const currentLink = (links ?? [])[0] as InterviewLink | undefined;

  const linkIds = (links ?? []).map((l) => l.id);
  const { data: sessions } = linkIds.length
    ? await supabase
        .from("interview_sessions")
        .select("link_id, status")
        .in("link_id", linkIds)
    : { data: [] as { link_id: string; status: string }[] };

  const totalOpens = (links ?? []).reduce((sum, l) => sum + (l.open_count ?? 0), 0);
  const completedLinkIds = new Set(
    (sessions ?? []).filter((s) => s.status === "completed").map((s) => s.link_id)
  );
  const completedCount = (links ?? []).filter((l) => completedLinkIds.has(l.id)).length;
  const completionRate = totalOpens > 0 ? Math.round((completedCount / totalOpens) * 100) : 0;

  return {
    currentLink: currentLink ?? null,
    stats: { totalOpens, completedCount, completionRate },
  };
}

export async function regenerateLink(
  adminId: string,
  setId: string,
  expiresInDays: 7 | 14 | 30 | 60
) {
  const set = await getOwnedSet(adminId, setId);
  if (!set) throw new Error("not_found");
  const supabase = createAdminClient();

  await supabase
    .from("interview_links")
    .update({ status: "expired" })
    .eq("interview_set_id", setId)
    .in("status", ["pending", "in_progress"]);

  const { data, error } = await supabase
    .from("interview_links")
    .insert({
      interview_set_id: setId,
      token: generateLinkToken(),
      status: "pending",
      expires_at: expiryDateFromDays(expiresInDays),
    })
    .select("*")
    .single();
  if (error) throw error;

  if (set.status === "draft") {
    await supabase
      .from("interview_sets")
      .update({ status: "published" })
      .eq("id", setId);
  }

  return data as InterviewLink;
}
