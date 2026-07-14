export type Difficulty = "easy" | "medium" | "hard";
export type InterviewSetStatus = "draft" | "published" | "active" | "expired";
export type LinkStatus = "pending" | "in_progress" | "completed" | "expired";
export type SessionStatus = "in_progress" | "completed";
export type ReviewStatus = "pending" | "reviewed";

export interface Admin {
  id: string;
  name: string | null;
  email: string | null;
  role: string;
  created_at: string;
}

export interface AiSettings {
  admin_id: string;
  default_model: string;
  default_system_prompt: string | null;
  updated_at: string;
}

export interface Question {
  id: string;
  admin_id: string;
  title: string;
  description: string;
  language: string;
  difficulty: Difficulty;
  time_limit_minutes: number | null;
  starter_code: string | null;
  test_cases: unknown;
  is_ai_generated: boolean;
  created_at: string;
}

export interface InterviewSet {
  id: string;
  admin_id: string;
  title: string;
  target_role: string | null;
  question_ids: string[];
  time_limit_minutes: number | null;
  expires_at: string | null;
  status: InterviewSetStatus;
  ai_model: string | null;
  ai_system_prompt: string | null;
  created_at: string;
}

export interface InterviewLink {
  id: string;
  interview_set_id: string;
  token: string;
  candidate_name: string | null;
  candidate_email: string | null;
  status: LinkStatus;
  expires_at: string | null;
  open_count: number;
  created_at: string;
}

export interface Candidate {
  id: string;
  admin_id: string;
  name: string;
  email: string | null;
  created_at: string;
}

export interface InterviewSession {
  id: string;
  link_id: string;
  candidate_id: string | null;
  candidate_name: string | null;
  started_at: string | null;
  submitted_at: string | null;
  last_active_at: string | null;
  final_answers: Record<string, string> | null;
  status: SessionStatus;
  review_status: ReviewStatus;
  ai_score: number | null;
  ai_score_summary: string | null;
  ai_interaction_count: number;
  created_at: string;
}

export interface AiMessage {
  id: string;
  session_id: string;
  question_id: string | null;
  role: "user" | "assistant";
  content: string;
  created_at: string;
}

export interface Recording {
  id: string;
  session_id: string;
  storage_path: string;
  duration_seconds: number | null;
  created_at: string;
}
