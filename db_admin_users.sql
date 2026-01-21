-- Admin users table (Supabase)
create table if not exists public.admin_users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique not null,
  role text not null default 'moderator',
  created_at timestamp with time zone default now()
);

alter table public.admin_users enable row level security;

create policy "Admins can read own record"
  on public.admin_users
  for select
  using (auth.uid() = id);
