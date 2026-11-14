-- 20261114000002_search_posts.sql
-- 글 검색: 제목·본문에 검색어가 들어간 글을 최신순으로 찾는 DB 함수.
--
-- 설계 메모
-- 1) 검색어는 문자열을 이어 붙여 SQL을 만들지 않고 함수 "매개변수"로 받는다(SQL 인젝션 방지).
-- 2) LIKE의 특수문자(% _ \)는 검색어 안에서 글자 그대로 찾도록 이스케이프한다.
--    (안 하면 "100%"를 검색해도 %가 "아무 글자"로 해석돼 엉뚱한 결과가 나온다)
-- 3) security invoker: 호출한 사용자의 권한(RLS)으로 실행되므로, 삭제된 글은 검색에도 나오지 않는다.
-- 4) set search_path = '': 객체를 항상 public.xxx처럼 이름 전체로 불러, 바꿔치기를 막는다.
-- 5) 검색어는 2자 이상만 받고(그보다 짧으면 빈 결과), 한 번에 가져오는 개수는 1~50개로 제한한다.
-- 6) pg_trgm: 글자를 3글자 조각으로 쪼개 색인하는 확장. 앞뒤가 열린 부분 검색(%검색어%)은
--    일반 B-tree 인덱스로는 빨라지지 않아서, 이 확장의 GIN 인덱스를 쓴다.

create extension if not exists pg_trgm with schema extensions;

create index posts_title_trgm_idx on public.posts using gin (title extensions.gin_trgm_ops);
create index posts_body_trgm_idx on public.posts using gin (body extensions.gin_trgm_ops);

create or replace function public.search_posts(
  p_query text,
  p_limit integer default 20,
  p_before timestamptz default null
)
returns table (
  id uuid,
  title text,
  body text,
  created_at timestamptz,
  topic_id uuid,
  author_id uuid,
  nickname text,
  mbti text,
  ilju text,
  like_count bigint,
  comment_count bigint
)
language sql
stable
security invoker
set search_path = ''
as $$
  with q as (
    select
      '%' || replace(replace(replace(btrim(p_query), '\', '\\'), '%', '\%'), '_', '\_') || '%' as pattern,
      char_length(btrim(p_query)) as len
  )
  select
    p.id,
    p.title,
    p.body,
    p.created_at,
    p.topic_id,
    p.author_id,
    a.nickname,
    a.mbti,
    a.ilju,
    (select count(*) from public.likes l where l.post_id = p.id) as like_count,
    (select count(*) from public.comments c where c.post_id = p.id) as comment_count
  from public.posts p
  join public.profiles a on a.id = p.author_id
  cross join q
  where q.len >= 2
    and (p.title ilike q.pattern or p.body ilike q.pattern)
    and (p_before is null or p.created_at < p_before)
  order by p.created_at desc
  limit least(greatest(p_limit, 1), 50);
$$;

-- 로그인한 사용자만 부를 수 있다(익명에는 열지 않음)
revoke execute on function public.search_posts(text, integer, timestamptz) from public, anon;
grant execute on function public.search_posts(text, integer, timestamptz) to authenticated;

comment on function public.search_posts(text, integer, timestamptz) is
  '글 검색(제목·본문, 최신순). 검색어 2자 이상, 개수 1~50. 호출자 권한(RLS 적용)으로 실행된다.';
