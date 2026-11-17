-- 四年級第八課《四季的歌聲》寫作草稿與批改平台資料表
create table if not exists public.seasons_essays (
  seat integer primary key check (seat between 1 and 29),
  p1 text not null default '',
  p2 text not null default '',
  p3 text not null default '',
  p4 text not null default '',
  feedback jsonb not null default '{}'::jsonb,
  rule_reports jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.seasons_essays enable row level security;

-- 最小權限原則：禁止前端匿名或一般帳號直接讀寫，統一由 Edge Function 驗證後存取
revoke all on table public.seasons_essays from public, anon, authenticated;
grant select, insert, update, delete on table public.seasons_essays to service_role;

drop policy if exists "deny_direct_client_access" on public.seasons_essays;
create policy "deny_direct_client_access"
  on public.seasons_essays
  for all
  to anon, authenticated
  using (false)
  with check (false);

create or replace function public.set_seasons_essays_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = public
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_seasons_essays_updated_at on public.seasons_essays;
create trigger trg_seasons_essays_updated_at
  before update on public.seasons_essays
  for each row
  execute function public.set_seasons_essays_updated_at();
