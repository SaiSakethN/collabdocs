-- Run in the Supabase SQL editor. Safe to rerun; existing documents are retained.
create table if not exists public.demo_users (
  id text primary key check (id in ('alice','bob')),
  name text not null,
  email text not null unique
);
create table if not exists public.documents (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.demo_users(id),
  title text not null check (length(trim(title)) between 1 and 160),
  content jsonb not null default '{"type":"doc","content":[{"type":"paragraph"}]}',
  version integer not null default 1 check (version > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create table if not exists public.document_shares (
  document_id uuid not null references public.documents(id) on delete cascade,
  recipient_id text not null references public.demo_users(id),
  created_at timestamptz not null default now(),
  primary key (document_id, recipient_id)
);
create index if not exists documents_owner_updated on public.documents(owner_id, updated_at desc);
create index if not exists shares_recipient on public.document_shares(recipient_id);
-- No browser access: the server service role accesses tables after demo authorization.
alter table public.demo_users enable row level security;
alter table public.documents enable row level security;
alter table public.document_shares enable row level security;
revoke all on public.demo_users, public.documents, public.document_shares from anon, authenticated;
insert into public.demo_users(id,name,email) values ('alice','Alice','alice@collabdocs.demo'),('bob','Bob','bob@collabdocs.demo') on conflict (id) do nothing;
