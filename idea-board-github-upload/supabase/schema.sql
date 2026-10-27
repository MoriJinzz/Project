-- Run once in the Supabase SQL Editor for this project.
create extension if not exists pgcrypto;

create table if not exists public.ideas (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text not null,
  author_nickname text not null,
  created_at timestamptz not null default now(),
  constraint ideas_title_valid check (char_length(title) between 3 and 120 and title = btrim(title)),
  constraint ideas_description_valid check (char_length(description) between 10 and 1000 and description = btrim(description)),
  constraint ideas_author_valid check (char_length(author_nickname) between 2 and 40 and author_nickname = btrim(author_nickname))
);

create table if not exists public.votes (
  idea_id uuid not null references public.ideas(id) on delete cascade,
  voter_id uuid not null,
  created_at timestamptz not null default now(),
  constraint votes_one_per_voter_per_idea primary key (idea_id, voter_id)
);

create index if not exists ideas_created_at_idx on public.ideas (created_at desc);

alter table public.ideas enable row level security;
alter table public.votes enable row level security;

-- Remove Supabase's broad default grants before granting only what this app needs.
revoke all on table public.ideas, public.votes from public, anon, authenticated;
grant select on public.ideas to anon;
grant insert (title, description, author_nickname) on public.ideas to anon;
grant select (idea_id) on public.votes to anon;
grant insert (idea_id, voter_id) on public.votes to anon;

drop policy if exists "Anyone can read ideas" on public.ideas;
drop policy if exists "Anyone can submit an idea" on public.ideas;
drop policy if exists "Anyone can read vote counts" on public.votes;
drop policy if exists "Anyone can vote" on public.votes;

create policy "Anyone can read ideas"
  on public.ideas for select to anon using (true);
create policy "Anyone can submit an idea"
  on public.ideas for insert to anon with check (true);
create policy "Anyone can read vote counts"
  on public.votes for select to anon using (true);
create policy "Anyone can vote"
  on public.votes for insert to anon with check (true);

-- security_invoker makes the view obey the anon role's table grants and RLS.
-- voter_id is never selected by the view or granted for reading.
create or replace view public.idea_board with (security_invoker = true) as
select
  i.id,
  i.title,
  i.description,
  i.author_nickname,
  i.created_at,
  count(v.idea_id)::integer as vote_count
from public.ideas as i
left join public.votes as v on v.idea_id = i.id
group by i.id;

revoke all on public.idea_board from public, anon, authenticated;
grant select on public.idea_board to anon;
