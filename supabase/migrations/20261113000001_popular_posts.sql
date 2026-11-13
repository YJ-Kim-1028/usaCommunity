-- 20261113000001_popular_posts.sql
-- 인기글 조회 함수. 정렬과 좋아요 수 세기를 앱이 아니라 DB가 한다.
--
-- 배경: 지금까지는 피드에 불러온 글(게시판별 최신 50개) 안에서 앱이 좋아요 순으로 정렬해 인기글을 골랐다.
--       그러면 50개보다 오래된 글이나 다른 게시판의 글은 인기글이어도 찾을 수 없다.
-- 결정: DB 함수로 옮겨, 그 게시판의 "전체 글"(또는 최근 N일에 쓴 글) 중에서 좋아요 순으로 뽑는다.
--
-- 설계 메모
-- 1) security invoker(기본값): 함수가 호출한 사용자의 권한으로 실행되므로 posts/likes의 읽기 정책(RLS)이 그대로 적용된다.
--    → 삭제된 글(deleted_at)은 이 함수에서도 보이지 않는다. (security definer로 만들면 RLS를 우회하므로 일부러 쓰지 않음)
-- 2) set search_path = '': 함수 안에서 객체를 항상 public.xxx처럼 이름 전체로 부르게 해, 같은 이름의 가짜 객체로 바꿔치기하는 것을 막는다.
-- 3) 기능 단위를 매개변수로: p_topic_id를 안 주면 모든 게시판, p_days를 안 주면 전체 기간이다.
-- 4) 같은 좋아요 수일 때는 최신 글이 위로 온다.
-- 5) p_limit은 1~20으로 제한한다(한 번에 너무 많이 가져가지 못하게).
-- 6) 기간은 "그 기간 안에 쓴 글"을 뜻한다("그 기간에 눌린 좋아요"가 아님).

create or replace function public.popular_posts(
  p_topic_id uuid default null,
  p_days integer default null,
  p_limit integer default 5
)
returns table (id uuid, title text, like_count bigint)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    p.id,
    p.title,
    count(l.post_id) as like_count
  from public.posts p
  left join public.likes l on l.post_id = p.id
  where (p_topic_id is null or p.topic_id = p_topic_id)
    and (p_days is null or p.created_at >= now() - make_interval(days => p_days))
  group by p.id, p.title, p.created_at
  order by like_count desc, p.created_at desc
  limit least(greatest(p_limit, 1), 20);
$$;

-- 로그인한 사용자만 부를 수 있다(익명에는 열지 않음)
revoke execute on function public.popular_posts(uuid, integer, integer) from public, anon;
grant execute on function public.popular_posts(uuid, integer, integer) to authenticated;

comment on function public.popular_posts(uuid, integer, integer) is
  '인기글(좋아요 순). p_topic_id 생략=모든 게시판, p_days 생략=전체 기간. 호출자 권한(RLS 적용)으로 실행된다.';
