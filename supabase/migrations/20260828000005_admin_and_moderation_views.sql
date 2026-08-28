-- 0005_admin_and_moderation_views.sql
-- 운영자 판별용 테이블 + 신고/제재 이력을 한눈에 보는 뷰.
--
-- ⚠️ 중요: 뷰는 기본적으로 만든 사람(소유자) 권한으로 실행돼서 RLS를 우회함.
-- 그래서 이 뷰들은 authenticated/anon 롤한테서 접근 권한 자체를 회수(revoke)해서,
-- 일반 유저는 존재조차 조회 못 하게 막음. 운영자 화면은 이 뷰를 클라이언트에서 직접
-- 호출하면 안 되고, Edge Function이 서버 쪽에서 "이 사람 admins에 있나" 확인한 뒤
-- service_role로 대신 조회해서 결과만 돌려주는 구조로 만들어야 함 (이건 별도 설계 필요).

-- ============================================================
-- admins: 운영자 명단. 앱에서 아무도 못 건드림 — 본인 등록은 Supabase 대시보드에서 직접
-- ============================================================
create table public.admins (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admins enable row level security;

-- 본인이 운영자인지 정도는 앱에서 확인할 수 있어야 "운영자 메뉴 보이기/숨기기"가 가능함
create policy "users can check their own admin status"
  on public.admins for select
  to authenticated
  using (auth.uid() = user_id);

-- insert/update/delete 정책 없음 = 앱에서 아무도 자기 자신을 관리자로 등록 불가

-- ============================================================
-- moderation_user_overview: 유저 한 명에 대한 신고/제재 요약 (건바이건이 아니라 통합 뷰)
-- ============================================================
create view public.moderation_user_overview as
select
  p.id as user_id,
  p.nickname,
  (
    select count(*) from public.reports r
    where r.reported_user_id = p.id
       or r.post_id in (select id from public.posts where author_id = p.id)
       or r.comment_id in (select id from public.comments where author_id = p.id)
  ) as total_reports_received,
  (
    select count(*) from public.reports r
    where r.status = 'pending'
      and (r.reported_user_id = p.id
           or r.post_id in (select id from public.posts where author_id = p.id)
           or r.comment_id in (select id from public.comments where author_id = p.id))
  ) as pending_reports_count,
  (
    select count(*) from public.user_sanctions s where s.user_id = p.id
  ) as sanction_history_count,
  (
    select s.id from public.user_sanctions s
    where s.user_id = p.id
      and (s.expires_at is null or s.expires_at > now())
    order by s.created_at desc
    limit 1
  ) as active_sanction_id
from public.profiles p;

-- ============================================================
-- moderation_reported_posts: 특정 유저가 쓴 글 중 신고받은 것 전부 (신고 횟수 포함)
-- ============================================================
create view public.moderation_reported_posts as
select
  posts.id as post_id,
  posts.author_id,
  posts.title,
  posts.created_at,
  posts.deleted_at,
  count(reports.id) as report_count
from public.posts
join public.reports on reports.post_id = posts.id
group by posts.id, posts.author_id, posts.title, posts.created_at, posts.deleted_at;

-- 일반 유저(authenticated) 및 비로그인(anon)은 이 두 뷰에 아예 접근 못 하게 권한 회수
revoke all on public.moderation_user_overview from authenticated, anon;
revoke all on public.moderation_reported_posts from authenticated, anon;
