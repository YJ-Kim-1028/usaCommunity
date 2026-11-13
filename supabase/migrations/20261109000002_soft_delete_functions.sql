-- soft delete를 DB 함수로 처리
--
-- 문제: 0003에서 posts/comments의 SELECT 정책을 `deleted_at is null`로 바꿨다.
--       Postgres는 UPDATE 후의 새 행도 SELECT 정책으로 검사하므로,
--       앱에서 `update ... set deleted_at = now()`를 하면 정책 위반(42501)으로 막힌다.
-- 해결: 본인 글/댓글인지 직접 확인한 뒤 deleted_at을 채우는 security definer 함수를 둔다.
--       함수는 소유자 권한으로 실행되어 RLS를 우회하므로, 권한 검사는 함수 안에서 반드시 한다.
--       search_path를 고정해 같은 이름의 다른 객체로 바꿔치기하는 공격을 막는다.

create or replace function public.soft_delete_post(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.posts
     set deleted_at = now()
   where id = p_id
     and author_id = auth.uid()
     and deleted_at is null;
  if not found then
    raise exception 'post not found or not owned by caller' using errcode = '42501';
  end if;
end;
$$;

create or replace function public.soft_delete_comment(p_id uuid)
returns void
language plpgsql
security definer
set search_path = ''
as $$
begin
  update public.comments
     set deleted_at = now()
   where id = p_id
     and author_id = auth.uid()
     and deleted_at is null;
  if not found then
    raise exception 'comment not found or not owned by caller' using errcode = '42501';
  end if;
end;
$$;

-- 함수는 기본적으로 모든 롤이 실행할 수 있으므로, 로그인한 사용자에게만 연다.
revoke all on function public.soft_delete_post(uuid) from public, anon;
revoke all on function public.soft_delete_comment(uuid) from public, anon;
grant execute on function public.soft_delete_post(uuid) to authenticated;
grant execute on function public.soft_delete_comment(uuid) to authenticated;
