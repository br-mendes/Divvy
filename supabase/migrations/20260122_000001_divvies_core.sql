-- Core Groups schema (Divvy)
-- Tables: divvies, divvy_members
-- RLS: enabled with minimal policies to allow owners/members to read and create.

create extension if not exists "pgcrypto";

create table if not exists public.divvies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  owner_id uuid not null,
  created_at timestamptz not null default now()
);

create table if not exists public.divvy_members (
  id uuid primary key default gen_random_uuid(),
  divvy_id uuid not null references public.divvies(id) on delete cascade,
  user_id uuid not null,
  role text not null default 'member',
  created_at timestamptz not null default now(),
  unique (divvy_id, user_id)
);

alter table public.divvies enable row level security;
alter table public.divvy_members enable row level security;

-- DIVVIES policies
drop policy if exists "divvies_select_owner_or_member" on public.divvies;
create policy "divvies_select_owner_or_member"
on public.divvies
for select
to authenticated
using (
  owner_id = auth.uid()
  or exists (
    select 1
    from public.divvy_members m
    where m.divvy_id = divvies.id
      and m.user_id = auth.uid()
  )
);

drop policy if exists "divvies_insert_owner" on public.divvies;
create policy "divvies_insert_owner"
on public.divvies
for insert
to authenticated
with check (owner_id = auth.uid());

drop policy if exists "divvies_update_owner" on public.divvies;
create policy "divvies_update_owner"
on public.divvies
for update
to authenticated
using (owner_id = auth.uid())
with check (owner_id = auth.uid());

-- DIVVY_MEMBERS policies
drop policy if exists "divvy_members_select_self_or_group_member" on public.divvy_members;
create policy "divvy_members_select_self_or_group_member"
on public.divvy_members
for select
to authenticated
using (
  user_id = auth.uid()
  or exists (
    select 1
    from public.divvy_members m2
    where m2.divvy_id = divvy_members.divvy_id
      and m2.user_id = auth.uid()
  )
);

drop policy if exists "divvy_members_insert_self" on public.divvy_members;
create policy "divvy_members_insert_self"
on public.divvy_members
for insert
to authenticated
with check (user_id = auth.uid());

-- optional: allow owner to add others later (leave for next steps)
