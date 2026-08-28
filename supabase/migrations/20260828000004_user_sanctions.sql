-- 0004_user_sanctions.sql
-- 유저 제재(뮤트/정지) 실제 집행 테이블. 기간은 자유 입력이 아니라 고정 옵션(1주/2주/1개월/3개월/영구).
-- 신고(report)에서 이어질 수도, 운영자가 선제적으로 조치할 수도 있음.

create table public.user_sanctions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in ('mute', 'ban')),
  duration text not null check (duration in ('1week', '2weeks', '1month', '3months', 'permanent')),
  reason text not null,
  report_id uuid references public.reports (id) on delete set null,
  issued_by uuid references public.profiles (id),
  starts_at timestamptz not null default now(),
  expires_at timestamptz, -- duration이 'permanent'일 때만 null, 그 외엔 반드시 값 있어야 함
  created_at timestamptz not null default now(),
  constraint user_sanctions_expiry_matches_duration
    check ((duration = 'permanent') = (expires_at is null))
);

alter table public.user_sanctions enable row level security;

-- 본인이 지금 제재 상태인지는 스스로 확인할 수 있어야 함(로그인/글쓰기 전에 앱이 체크)
create policy "users can read their own sanctions"
  on public.user_sanctions for select
  to authenticated
  using (auth.uid() = user_id);

-- insert/update/delete 정책 없음 = 앱(일반 유저)은 절대 제재를 스스로 걸거나 풀 수 없고,
-- 운영자만 Supabase 대시보드 또는 (나중에 생길) 운영자 화면에서 부여/해제

create index user_sanctions_user_id_idx on public.user_sanctions (user_id);
-- "지금 유효한 제재가 있는지" 조회가 잦을 패턴 (user_id + 만료 안 됐거나 영구인 것)
create index user_sanctions_active_idx on public.user_sanctions (user_id, expires_at);

comment on column public.user_sanctions.duration is
  '운영자가 고르는 고정 기간 옵션. expires_at은 duration을 실제 타임스탬프로 환산한 값 —
  운영자 화면에서 "1개월 정지"를 선택하면 앱/운영자 화면이 starts_at + 해당 기간을 계산해서
  expires_at에 넣어줘야 함 (DB가 자동 계산하지 않음, 지금은 트리거까지는 과함)';
