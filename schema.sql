create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  plan text not null default 'free' check (plan in ('free','starter','pro')),
  subscription_status text not null default 'inactive',
  access_suspended boolean not null default false,
  stripe_customer_id text unique,
  stripe_subscription_id text unique,
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  email text,
  company text,
  phone text,
  status text not null default 'Firfircoon' check (status in ('Firfircoon','Sugaya','Aan firfircoonayn')),
  notes text,
  created_at timestamptz not null default now()
);

create table if not exists public.deals (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  amount numeric(12,2) not null default 0 check (amount >= 0),
  stage text not null default 'Cusub' check (stage in ('Cusub','La xiriiray','Soo-jeedin','Guulaystay','Luntay')),
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.tasks (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  due_date date,
  completed boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles add column if not exists access_suspended boolean not null default false;

alter table public.profiles enable row level security;
alter table public.customers enable row level security;
alter table public.deals enable row level security;
alter table public.tasks enable row level security;

revoke all on table public.profiles, public.customers, public.deals, public.tasks from anon;
grant select on table public.profiles to authenticated;
grant select, insert, update, delete on table public.customers, public.deals, public.tasks to authenticated;

drop policy if exists "Users can view own profile" on public.profiles;
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
drop policy if exists "Users can update own profile" on public.profiles;

drop policy if exists "Users manage own customers" on public.customers;
drop policy if exists "Paid users manage own customers" on public.customers;
create policy "Paid users manage own customers" on public.customers for all
using (
  auth.uid() = user_id and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.subscription_status = 'active' and p.plan in ('starter','pro') and p.access_suspended = false
  )
)
with check (
  auth.uid() = user_id and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.subscription_status = 'active' and p.plan in ('starter','pro') and p.access_suspended = false
  )
);
drop policy if exists "Users manage own deals" on public.deals;
drop policy if exists "Paid users manage own deals" on public.deals;
create policy "Paid users manage own deals" on public.deals for all
using (
  auth.uid() = user_id and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.subscription_status = 'active' and p.plan in ('starter','pro') and p.access_suspended = false
  )
)
with check (
  auth.uid() = user_id and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.subscription_status = 'active' and p.plan in ('starter','pro') and p.access_suspended = false
  )
);
drop policy if exists "Users manage own tasks" on public.tasks;
drop policy if exists "Paid users manage own tasks" on public.tasks;
create policy "Paid users manage own tasks" on public.tasks for all
using (
  auth.uid() = user_id and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.subscription_status = 'active' and p.plan in ('starter','pro') and p.access_suspended = false
  )
)
with check (
  auth.uid() = user_id and exists (
    select 1 from public.profiles p where p.id = auth.uid()
      and p.subscription_status = 'active' and p.plan in ('starter','pro') and p.access_suspended = false
  )
);

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name',''));
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
for each row execute procedure public.handle_new_user();
