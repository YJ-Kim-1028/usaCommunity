-- 20261115000002_search_posts_photo.sql
-- 검색 결과에도 작성자의 프로필 사진 주소(photo_url)를 함께 돌려준다.
--
-- 왜 새 파일인가: 이미 적용된 20261114000002는 고치지 않고, 바뀐 내용은 새 마이그레이션으로 만든다.
-- 왜 drop 후 다시 만드나: 함수가 돌려주는 열 목록(반환 타입)이 바뀌면 create or replace로는 바꿀 수 없다.
-- 규칙(호출자 권한 RLS, search_path 고정, 2자 이상, 1~50개, 익명 차단)은 이전과 같다.

drop function if exists public.search_posts(text, integer, timestamptz);

create function public.search_posts(
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
  photo_url text,
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
    a.photo_url,
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

revoke execute on function public.search_posts(text, integer, timestamptz) from public, anon;
grant execute on function public.search_posts(text, integer, timestamptz) to authenticated;

comment on function public.search_posts(text, integer, timestamptz) is
  '글 검색(제목·본문, 최신순). 작성자 프로필 사진 주소 포함. 검색어 2자 이상, 개수 1~50. 호출자 권한(RLS 적용)으로 실행된다.';
