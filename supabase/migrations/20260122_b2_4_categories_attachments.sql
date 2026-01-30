-- B2.4 - Categories + Attachments + export support
-- Safe / idempotent-ish patterns: DROP POLICY IF EXISTS + CREATE POLICY.

-- 1) helper: membership check with fallback to multiple possible membership tables
create or replace function public.is_divvy_member(p_divvy_id uuid, p_user_id uuid default auth.uid())
returns boolean
language plpgsql
stable
security definer
set search_path = public
as $$
declare ok boolean;
begin
  if p_divvy_id is null or p_user_id is null then
    return false;
  end if;

  -- try common table names
  if to_regclass('public.divvy_members') is not null then
    execute 'select exists(select 1 from public.divvy_members where divvy_id=$1 and user_id=$2)'
      into ok using p_divvy_id, p_user_id;
    return ok;
  elsif to_regclass('public.group_members') is not null then
    execute 'select exists(select 1 from public.group_members where group_id=$1 and user_id=$2)'
      into ok using p_divvy_id, p_user_id;
    return ok;
  elsif to_regclass('public.divvy_memberships') is not null then
    execute 'select exists(select 1 from public.divvy_memberships where divvy_id=$1 and user_id=$2)'
      into ok using p_divvy_id, p_user_id;
    return ok;
  elsif to_regclass('public.divvy_users') is not null then
    execute 'select exists(select 1 from public.divvy_users where divvy_id=$1 and user_id=$2)'
      into ok using p_divvy_id, p_user_id;
    return ok;
  end if;

  return false;
end;
$$;

revoke all on function public.is_divvy_member(uuid, uuid) from public;
grant execute on function public.is_divvy_member(uuid, uuid) to authenticated;

-- 2) categories table
create table if not exists public.expense_categories (
  id uuid primary key default gen_random_uuid(),
  divvy_id uuid not null,
  name text not null,
  slug text not null,
  icon text,
  color text,
  created_by uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists expense_categories_unique_slug_per_divvy
  on public.expense_categories(divvy_id, slug);

create index if not exists expense_categories_divvy_id_idx
  on public.expense_categories(divvy_id);

alter table public.expense_categories enable row level security;

drop policy if exists "expense_categories_select" on public.expense_categories;
create policy "expense_categories_select"
on public.expense_categories
for select
to authenticated
using (public.is_divvy_member(divvy_id) or created_by = auth.uid());

drop policy if exists "expense_categories_insert" on public.expense_categories;
create policy "expense_categories_insert"
on public.expense_categories
for insert
to authenticated
with check (created_by = auth.uid() and (public.is_divvy_member(divvy_id) or created_by = auth.uid()));

drop policy if exists "expense_categories_update" on public.expense_categories;
create policy "expense_categories_update"
on public.expense_categories
for update
to authenticated
using (public.is_divvy_member(divvy_id) or created_by = auth.uid())
with check (public.is_divvy_member(divvy_id) or created_by = auth.uid());

drop policy if exists "expense_categories_delete" on public.expense_categories;
create policy "expense_categories_delete"
on public.expense_categories
for delete
to authenticated
using (public.is_divvy_member(divvy_id) or created_by = auth.uid());

-- keep updated_at in sync
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_expense_categories_updated_at on public.expense_categories;
create trigger trg_expense_categories_updated_at
before update on public.expense_categories
for each row execute function public.set_updated_at();

-- 3) attachments metadata table (optional base)
create table if not exists public.expense_attachments (
  id uuid primary key default gen_random_uuid(),
  divvy_id uuid not null,
  expense_id uuid not null,
  storage_bucket text not null default 'expense-attachments',
  storage_path text not null,
  file_name text,
  content_type text,
  byte_size bigint,
  created_by uuid,
  created_at timestamptz not null default now()
);

create index if not exists expense_attachments_divvy_id_idx
  on public.expense_attachments(divvy_id);

create index if not exists expense_attachments_expense_id_idx
  on public.expense_attachments(expense_id);

alter table public.expense_attachments enable row level security;

drop policy if exists "expense_attachments_select" on public.expense_attachments;
create policy "expense_attachments_select"
on public.expense_attachments
for select
to authenticated
using (public.is_divvy_member(divvy_id) or created_by = auth.uid());

drop policy if exists "expense_attachments_insert" on public.expense_attachments;
create policy "expense_attachments_insert"
on public.expense_attachments
for insert
to authenticated
with check (created_by = auth.uid() and (public.is_divvy_member(divvy_id) or created_by = auth.uid()));

drop policy if exists "expense_attachments_delete" on public.expense_attachments;
create policy "expense_attachments_delete"
on public.expense_attachments
for delete
to authenticated
using (public.is_divvy_member(divvy_id) or created_by = auth.uid());

-- 4) storage bucket (Supabase)
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public)
    values ('expense-attachments', 'expense-attachments', false)
    on conflict (id) do nothing;
  end if;
end $$;

-- 5) storage objects RLS (best-effort)
-- Path convention: {divvyId}/{expenseId}/{random}_{filename}
do $$
begin
  if to_regclass('storage.objects') is not null then
    -- SELECT
    begin
      execute 'drop policy if exists "expense_attachments_storage_select" on storage.objects';
    exception when others then null;
    end;

    execute $pol$
      create policy "expense_attachments_storage_select"
      on storage.objects
      for select
      to authenticated
      using (
        bucket_id = 'expense-attachments'
        and public.is_divvy_member(nullif(split_part(name, '/', 1), '')::uuid)
      )
    $pol$;

    -- DELETE
    begin
      execute 'drop policy if exists "expense_attachments_storage_delete" on storage.objects';
    exception when others then null;
    end;

    execute $pol$
      create policy "expense_attachments_storage_delete"
      on storage.objects
      for delete
      to authenticated
      using (
        bucket_id = 'expense-attachments'
        and public.is_divvy_member(nullif(split_part(name, '/', 1), '')::uuid)
      )
    $pol$;
  end if;
end $$;

