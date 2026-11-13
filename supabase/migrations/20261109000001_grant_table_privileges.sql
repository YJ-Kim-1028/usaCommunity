-- 테이블 권한(GRANT) 부여
--
-- 배경: Supabase 대시보드에서 "자동 테이블 노출"을 꺼 두었기 때문에, 테이블을 만들어도
-- API 롤(anon/authenticated)에게 기본 권한이 없다. RLS 정책만 있고 GRANT가 없으면
-- "permission denied for table ..."(42501)로 막힌다.
--
-- 원칙: RLS 정책이 허용하는 동작과 같은 범위로만 연다(권한은 정책보다 넓지 않게).
--       정책이 모두 authenticated 기준이므로 anon에는 아무것도 열지 않는다.
--       모더레이션 뷰 2개는 0005에서 일부러 회수했으므로 건드리지 않는다.

grant usage on schema public to authenticated;

grant select, insert, update on public.profiles to authenticated;
grant select, insert, update, delete on public.profile_private to authenticated;
grant select on public.topics to authenticated;
grant select, insert, update, delete on public.posts to authenticated;
grant select, insert, update, delete on public.comments to authenticated;
grant select, insert, delete on public.likes to authenticated;
grant insert on public.reports to authenticated;
grant select on public.user_sanctions to authenticated;
grant select on public.admins to authenticated;
