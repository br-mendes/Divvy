-- Extras needed by the current app routes/UI
-- - invites + get_invite_details()
-- - divvy_requests (remove_member workflow)
-- - divvy_periods (lock/unlock ranges)
-- - payments (manual payments history)
-- - transactions (settlement confirmations)
--
-- This migration is written to be idempotent-ish (create if not exists).

create extension if not exists "pgcrypto";

-- Admin check helper (best-effort across schema variants)
create or replace function public.is_divvy_admin_or_creator(p_divvy_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ok boolean;
begin
  if p_divvy_id is null or p_user_id is null then
    return false;
  end if;

  -- creator/owner
  if to_regclass('public.divvies') is not null then
    begin
      execute 'select exists(select 1 from public.divvies where id=$1 and (creatorid=$2 or owner_id=$2 or owner_id=$2))'
        into ok using p_divvy_id, p_user_id;
      if ok then return true; end if;
    exception when others then
      null;
    end;
  end if;

  -- membership role
  if to_regclass('public.divvy_members') is not null then
    execute 'select exists(select 1 from public.divvy_members where divvy_id=$1 and user_id=$2 and role in (''owner'',''admin''))'
      into ok using p_divvy_id, p_user_id;
    return ok;
  elsif to_regclass('public.divvymembers') is not null then
    execute 'select exists(select 1 from public.divvymembers where divvyid=$1 and userid=$2 and role in (''owner'',''admin''))'
      into ok using p_divvy_id, p_user_id;
    return ok;
  end if;

  return false;
end;
$$;

revoke all on function public.is_divvy_admin_or_creator(uuid, uuid) from public;
grant execute on function public.is_divvy_admin_or_creator(uuid, uuid) to authenticated;

-- =========================
-- INVITES
-- =========================

create table if not exists public.invites (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  divvy_id uuid not null,
  invitedemail text,
  invitedbyuserid uuid,
  role text not null default 'member',
  status text not null default 'pending',
  expiresat timestamptz,
  acceptedat timestamptz,
  acceptedby uuid,
  createdat timestamptz not null default now()
);

alter table public.invites enable row level security;

drop policy if exists "invites_select_member" on public.invites;
create policy "invites_select_member"
on public.invites
for select
to authenticated
using (public.is_divvy_member(divvy_id) or public.is_divvy_admin_or_creator(divvy_id));

drop policy if exists "invites_insert_admin" on public.invites;
create policy "invites_insert_admin"
on public.invites
for insert
to authenticated
with check (public.is_divvy_admin_or_creator(divvy_id));

drop policy if exists "invites_update_admin" on public.invites;
create policy "invites_update_admin"
on public.invites
for update
to authenticated
using (public.is_divvy_admin_or_creator(divvy_id))
with check (public.is_divvy_admin_or_creator(divvy_id));

-- get_invite_details used by /join/[token]
create or replace function public.get_invite_details(invite_token text)
returns table (
  id uuid,
  token text,
  divvy_id uuid,
  divvy_name text,
  invitedemail text,
  inviter_name text,
  status text,
  is_expired boolean
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  return query
  select
    i.id,
    i.token,
    i.divvy_id,
    d.name as divvy_name,
    i.invitedemail,
    coalesce(up.displayname, up.fullname, i.invitedbyuserid::text) as inviter_name,
    i.status,
    case
      when i.expiresat is null then false
      else i.expiresat < now()
    end as is_expired
  from public.invites i
  left join public.divvies d on d.id = i.divvy_id
  left join public.userprofiles up on up.id = i.invitedbyuserid
  where i.token = invite_token
  limit 1;
end;
$$;

revoke all on function public.get_invite_details(text) from public;
grant execute on function public.get_invite_details(text) to anon, authenticated;

-- =========================
-- REQUESTS (remove member approvals)
-- =========================

create table if not exists public.divvy_requests (
  id uuid primary key default gen_random_uuid(),
  divvyid uuid not null,
  type text not null,
  status text not null default 'pending',
  requested_by uuid not null,
  target_userid uuid not null,
  reason text,
  note text,
  decided_by uuid,
  decidedat timestamptz,
  createdat timestamptz not null default now(),
  updatedat timestamptz not null default now()
);

alter table public.divvy_requests enable row level security;

drop policy if exists "divvy_requests_select_admin" on public.divvy_requests;
create policy "divvy_requests_select_admin"
on public.divvy_requests
for select
to authenticated
using (public.is_divvy_admin_or_creator(divvyid));

drop policy if exists "divvy_requests_insert_member" on public.divvy_requests;
create policy "divvy_requests_insert_member"
on public.divvy_requests
for insert
to authenticated
with check (public.is_divvy_member(divvyid));

drop policy if exists "divvy_requests_update_admin" on public.divvy_requests;
create policy "divvy_requests_update_admin"
on public.divvy_requests
for update
to authenticated
using (public.is_divvy_admin_or_creator(divvyid))
with check (public.is_divvy_admin_or_creator(divvyid));

-- =========================
-- PERIODS
-- =========================

create table if not exists public.divvy_periods (
  id uuid primary key default gen_random_uuid(),
  divvyid uuid not null,
  period_from date not null,
  period_to date not null,
  status text not null default 'closed',
  closed_at timestamptz,
  snapshot jsonb,
  createdat timestamptz not null default now()
);

create unique index if not exists divvy_periods_unique
  on public.divvy_periods(divvyid, period_from, period_to);

alter table public.divvy_periods enable row level security;

drop policy if exists "divvy_periods_select_member" on public.divvy_periods;
create policy "divvy_periods_select_member"
on public.divvy_periods
for select
to authenticated
using (public.is_divvy_member(divvyid));

drop policy if exists "divvy_periods_insert_admin" on public.divvy_periods;
create policy "divvy_periods_insert_admin"
on public.divvy_periods
for insert
to authenticated
with check (public.is_divvy_admin_or_creator(divvyid));

drop policy if exists "divvy_periods_update_admin" on public.divvy_periods;
create policy "divvy_periods_update_admin"
on public.divvy_periods
for update
to authenticated
using (public.is_divvy_admin_or_creator(divvyid))
with check (public.is_divvy_admin_or_creator(divvyid));

-- =========================
-- PAYMENTS
-- =========================

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  divvyid uuid not null,
  createdby uuid,
  from_userid uuid not null,
  to_userid uuid not null,
  amount_cents integer not null,
  currency text not null default 'BRL',
  paid_at timestamptz not null default now(),
  note text,
  createdat timestamptz not null default now()
);

alter table public.payments enable row level security;

drop policy if exists "payments_select_member" on public.payments;
create policy "payments_select_member"
on public.payments
for select
to authenticated
using (public.is_divvy_member(divvyid));

drop policy if exists "payments_insert_member" on public.payments;
create policy "payments_insert_member"
on public.payments
for insert
to authenticated
with check (public.is_divvy_member(divvyid));

-- =========================
-- TRANSACTIONS
-- =========================

create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  divvyid uuid not null,
  fromuserid uuid not null,
  touserid uuid not null,
  amount numeric not null,
  status text not null default 'pending',
  paidat timestamptz,
  createdat timestamptz not null default now(),
  updatedat timestamptz not null default now()
);

alter table public.transactions enable row level security;

drop policy if exists "transactions_select_member" on public.transactions;
create policy "transactions_select_member"
on public.transactions
for select
to authenticated
using (public.is_divvy_member(divvyid));

drop policy if exists "transactions_insert_member" on public.transactions;
create policy "transactions_insert_member"
on public.transactions
for insert
to authenticated
with check (public.is_divvy_member(divvyid) and fromuserid = auth.uid());

drop policy if exists "transactions_update_involved" on public.transactions;
create policy "transactions_update_involved"
on public.transactions
for update
to authenticated
using (public.is_divvy_member(divvyid) and (fromuserid = auth.uid() or touserid = auth.uid()))
with check (public.is_divvy_member(divvyid) and (fromuserid = auth.uid() or touserid = auth.uid()));
