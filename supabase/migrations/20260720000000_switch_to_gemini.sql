-- Switch AI provider from Claude to Gemini
-- Update default model in ai_settings table
update ai_settings
set default_model = 'gemini-flash-latest'
where default_model in ('claude-sonnet-4-6', 'gemini-2.0-flash');

-- Update default model in interview_sets table
update interview_sets
set ai_model = 'gemini-flash-latest'
where ai_model in ('claude-sonnet-4-6', 'gemini-2.0-flash');

-- Update default_model constraint/default value if any
alter table ai_settings
alter column default_model set default 'gemini-flash-latest';

alter table interview_sets
alter column ai_model set default 'gemini-flash-latest';
