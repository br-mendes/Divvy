-- Unify profile schema: canonical = public.userprofiles
--
-- Goal:
-- - Ensure a writable `public.userprofiles` table exists.
-- - If an older deployment uses `public.user_profiles`, migrate data into `userprofiles`.
-- - If `public.user_profiles` does not exist, create a compatibility view that maps to `userprofiles`.
--
-- This keeps PostgREST relationships stable for embeds like `select=...,userprofiles(*)`.

do $$
declare
  has_userprofiles boolean;
  has_user_profiles boolean;
begin
  has_userprofiles := to_regclass('public.userprofiles') is not null;
  has_user_profiles := to_regclass('public.user_profiles') is not null;

  if not has_userprofiles then
    execute $$
      create table public.userprofiles (
        id uuid primary key,
        email text,
        fullname text,
        displayname text,
        avatarurl text,
        phone text,
        twofactorenabled boolean not null default false,
        is_super_admin boolean not null default false,
        status text default 'active',
        last_login_at timestamptz,
        createdat timestamptz not null default now(),
        updatedat timestamptz not null default now()
      )
    $$;

    -- Best-effort: FK to auth.users if available.
    if to_regclass('auth.users') is not null then
      begin
        execute 'alter table public.userprofiles add constraint userprofiles_id_fkey foreign key (id) references auth.users(id) on delete cascade';
      exception when others then
        null;
      end;
    end if;
  end if;

  -- If `user_profiles` exists (as table) and userprofiles is new/empty-ish, migrate data.
  if has_user_profiles then
    begin
      execute $$
        insert into public.userprofiles (
          id,
          email,
          fullname,
          displayname,
          avatarurl,
          twofactorenabled,
          is_super_admin,
          createdat,
          updatedat
        )
        select
          id,
          email,
          coalesce(full_name, ''),
          coalesce(display_name, full_name, ''),
          avatar_url,
          coalesce(two_factor_enabled, false),
          coalesce(is_super_admin, false),
          coalesce(created_at, now()),
          coalesce(updated_at, now())
        from public.user_profiles
        on conflict (id) do update set
          email = excluded.email,
          fullname = excluded.fullname,
          displayname = excluded.displayname,
          avatarurl = excluded.avatarurl,
          twofactorenabled = excluded.twofactorenabled,
          is_super_admin = excluded.is_super_admin,
          updatedat = excluded.updatedat
      $$;
    exception when others then
      null;
    end;
  end if;
end $$;

-- Keep updatedat fresh
create or replace function public.userprofiles_set_updatedat()
returns trigger
language plpgsql
as $$
begin
  new.updatedat = now();
  return new;
end;
$$;

drop trigger if exists trg_userprofiles_updatedat on public.userprofiles;
create trigger trg_userprofiles_updatedat
before update on public.userprofiles
for each row execute function public.userprofiles_set_updatedat();

-- RLS (own row only)
alter table public.userprofiles enable row level security;

drop policy if exists "userprofiles_select_own" on public.userprofiles;
create policy "userprofiles_select_own"
on public.userprofiles
for select
to authenticated
using (id = auth.uid());

drop policy if exists "userprofiles_insert_own" on public.userprofiles;
create policy "userprofiles_insert_own"
on public.userprofiles
for insert
to authenticated
with check (id = auth.uid());

drop policy if exists "userprofiles_update_own" on public.userprofiles;
create policy "userprofiles_update_own"
on public.userprofiles
for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

-- Compatibility view: user_profiles (snake_case) -> userprofiles (legacy)
do $$
begin
  if to_regclass('public.user_profiles') is null then
    execute $$
      create view public.user_profiles as
      select
        id,
        email,
        fullname as full_name,
        displayname as display_name,
        avatarurl as avatar_url,
        twofactorenabled as two_factor_enabled,
        is_super_admin,
        createdat as created_at,
        updatedat as updated_at
      from public.userprofiles
    $$;

    execute $$
      create or replace function public.user_profiles_view_upsert()
      returns trigger
      language plpgsql
      as $$
      begin
        insert into public.userprofiles (
          id,
          email,
          fullname,
          displayname,
          avatarurl,
          twofactorenabled,
          is_super_admin,
          createdat,
          updatedat
        )
        values (
          new.id,
          new.email,
          coalesce(new.full_name, ''),
          coalesce(new.display_name, new.full_name, ''),
          new.avatar_url,
          coalesce(new.two_factor_enabled, false),
          coalesce(new.is_super_admin, false),
          coalesce(new.created_at, now()),
          coalesce(new.updated_at, now())
        )
        on conflict (id) do update set
          email = excluded.email,
          fullname = excluded.fullname,
          displayname = excluded.displayname,
          avatarurl = excluded.avatarurl,
          twofactorenabled = excluded.twofactorenabled,
          is_super_admin = excluded.is_super_admin,
          updatedat = excluded.updatedat;

        return new;
      end;
      $$;
    $$;

    execute 'drop trigger if exists trg_user_profiles_upsert on public.user_profiles';
    execute 'create trigger trg_user_profiles_upsert instead of insert or update on public.user_profiles for each row execute function public.user_profiles_view_upsert()';
  end if;
end $$;
