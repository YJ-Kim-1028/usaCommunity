-- 0003_report_status_and_soft_delete.sql
-- 신고 처리 상태 추가, 유저 직접 신고 지원, 게시글/댓글 soft delete로 전환
-- (신고당한 글을 작성자가 삭제하면 신고 기록까지 cascade로 같이 지워지던 문제 해결)

-- ============================================================
-- posts / comments: soft delete용 컬럼 추가
-- 앱에서 "삭제"는 이제 DELETE가 아니라 UPDATE ... set deleted_at = now() 로 처리
-- ============================================================
alter table public.posts add column deleted_at timestamptz;
alter table public.comments add column deleted_at timestamptz;

-- 삭제된 글/댓글은 RLS 단계에서부터 아무도 못 보게 (앱 코드가 필터를 깜빡해도 안전하도록)
drop policy "posts are readable by authenticated users" on public.posts;
create policy "posts are readable by authenticated users"
  on public.posts for select
  to authenticated
  using (deleted_at is null);

drop policy "comments are readable by authenticated users" on public.comments;
create policy "comments are readable by authenticated users"
  on public.comments for select
  to authenticated
  using (deleted_at is null);

-- ============================================================
-- reports: 처리 상태 + 유저 직접 신고 지원
-- ============================================================
alter table public.reports
  add column reported_user_id uuid references public.profiles (id) on delete cascade,
  add column status text not null default 'pending' check (status in ('pending', 'resolved', 'dismissed')),
  add column reviewed_by uuid references public.profiles (id),
  add column resolved_at timestamptz,
  add column action_note text;

-- 기존 제약(post_id/comment_id 중 하나만)을 지우고, reported_user_id까지 포함해서 셋 중 정확히 하나만 채워지게 변경
alter table public.reports drop constraint reports_target_check;
alter table public.reports add constraint reports_target_check
  check (num_nonnulls(post_id, comment_id, reported_user_id) = 1);

-- 운영자가 "처리 안 된 신고 목록"을 조회할 일이 많으므로 인덱스
create index reports_status_idx on public.reports (status);
create index reports_reported_user_id_idx on public.reports (reported_user_id);

comment on column public.reports.status is
  '신고 처리 상태. 앱에서는 안 씀 — 운영자가 Supabase 대시보드(Table Editor)에서 직접 갱신';
comment on column public.reports.action_note is
  '운영자가 어떤 조치를 취했는지 메모 (예: "게시글 삭제 조치함"). 유저 정지/뮤트 전용 테이블은
  실제로 필요해지면(유저가 생기고 반복 신고 사례가 나오면) 별도 마이그레이션으로 추가';
