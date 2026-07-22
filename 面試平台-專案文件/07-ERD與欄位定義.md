# 7. ERD + 欄位定義

> 回上一層：[README.md](./README.md) ／ 完整 SQL DDL 請見 [../面試平台-規格開發書.md 第 4 節](../面試平台-規格開發書.md)

## 7.1 ERD

```mermaid
erDiagram
    ADMINS ||--o{ QUESTIONS : creates
    ADMINS ||--o{ INTERVIEW_SETS : creates
    ADMINS ||--o{ CANDIDATES : manages
    ADMINS ||--|| AI_SETTINGS : configures
    INTERVIEW_SETS ||--o{ INTERVIEW_LINKS : generates
    INTERVIEW_LINKS ||--o{ INTERVIEW_SESSIONS : produces
    CANDIDATES ||--o{ INTERVIEW_SESSIONS : attempts
    INTERVIEW_SESSIONS ||--o{ AI_MESSAGES : logs
    INTERVIEW_SESSIONS ||--o{ RECORDINGS : has
    QUESTIONS ||--o{ AI_MESSAGES : "referenced by"

    ADMINS {
        uuid id PK
        text name
        text email
        text role
    }
    AI_SETTINGS {
        uuid admin_id PK_FK
        text default_model
        text default_system_prompt
    }
    QUESTIONS {
        uuid id PK
        uuid admin_id FK
        text title
        text description
        text language
        text difficulty
        int time_limit_minutes
        text starter_code
        jsonb test_cases
        boolean is_ai_generated
    }
    INTERVIEW_SETS {
        uuid id PK
        uuid admin_id FK
        text title
        text target_role
        uuid_array question_ids
        int time_limit_minutes
        timestamptz expires_at
        text status
        text ai_model
        text ai_system_prompt
    }
    INTERVIEW_LINKS {
        uuid id PK
        uuid interview_set_id FK
        text token
        text candidate_name
        text candidate_email
        text status
        timestamptz expires_at
        int open_count
    }
    CANDIDATES {
        uuid id PK
        uuid admin_id FK
        text name
        text email
    }
    INTERVIEW_SESSIONS {
        uuid id PK
        uuid link_id FK
        uuid candidate_id FK
        text candidate_name
        timestamptz started_at
        timestamptz submitted_at
        timestamptz last_active_at
        jsonb final_answers
        text status
        text review_status
        numeric ai_score
        text ai_score_summary
        int ai_interaction_count
    }
    AI_MESSAGES {
        uuid id PK
        uuid session_id FK
        uuid question_id FK
        text role
        text content
    }
    RECORDINGS {
        uuid id PK
        uuid session_id FK
        text storage_path
        int duration_seconds
    }
```

## 7.2 欄位定義補充說明

| 資料表 | 欄位 | 說明 |
|---|---|---|
| `ai_settings` | `default_model` | MVP 固定 `gemini-flash-latest`，欄位保留供 Phase 5 多模型擴充 |
| `questions` | `test_cases` | MVP 可留空，供 Phase 5 線上執行/測試使用 |
| `interview_sets` | `status` | 模板生命週期：draft／published／active／expired，與底下連結/session 狀態各自獨立 |
| `interview_sets` | `question_ids` | 陣列型別，決定候選人作答時的題目順序 |
| `interview_links` | `token` | 高隨機性字串（如 nanoid(24)），連結識別依據，不可猜測 |
| `interview_links` | `status` | pending／in_progress／completed／expired；僅 pending/in_progress 允許寫入 |
| `interview_links` | `open_count` | 每次開啟頁面累加，供使用統計卡片顯示 |
| `interview_sessions` | `final_answers` | `{questionId: code}`，持續自動儲存草稿，提交時視為最終結果 |
| `interview_sessions` | `last_active_at` | 供斷點續答判斷與「最後活動時間」顯示 |
| `interview_sessions` | `ai_score` / `ai_score_summary` | AI 產出，僅供主管參考，非最終錄取依據 |
| `interview_sessions` | `review_status` | pending／reviewed，主管審閱進度追蹤 |
| `ai_messages` | `question_id` | 對話依題目分段顯示 |
| `recordings` | 一對多 `session_id` | 因連結允許中斷後繼續，同一 session 可能有多筆錄影片段，依 `created_at` 排序播放 |
