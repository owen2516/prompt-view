-- Private bucket for candidate screen recordings. All access goes through
-- Next.js Route Handlers using the service role key (uploads) or signed URLs
-- (admin playback) — no public/anon policies needed.
insert into storage.buckets (id, name, public)
values ('recordings', 'recordings', false)
on conflict (id) do nothing;
