-- 20261114000004_rate_limit.sql
-- 도배 방지: 짧은 시간에 같은 사용자가 글·댓글·신고를 너무 많이 올리지 못하게 DB에서 막는다.
--
-- 설계 메모
-- 1) 앱의 버튼을 막는 것만으로는 우회할 수 있어서, "저장되는 순간"에 DB 트리거가 검사한다.
-- 2) security definer: 삭제된 글(deleted_at이 채워진 행)까지 세어야 한다.
--    호출자 권한(RLS)으로 세면 삭제된 글이 안 보여서 "올리고 지우고 또 올리기"로 제한을 피할 수 있다.
--    RLS를 건너뛰는 함수이므로 set search_path = ''로 고정하고, 직접 실행 권한은 아무에게도 주지 않는다
--    (트리거가 부르는 용도로만 쓴다).
-- 3) 한 함수를 여러 표에서 재사용한다: 트리거에 (작성자 열 이름, 최대 개수, 몇 초 동안) 값을 넘긴다.
-- 4) 막혔을 때는 'rate_limited'라는 오류 메시지를 던지고, 앱이 이 글자를 보고 한국어 안내로 바꾼다.

create or replace function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_column text := tg_argv[0];
  max_count integer := tg_argv[1]::integer;
  window_seconds integer := tg_argv[2]::integer;
  who uuid := (to_jsonb(new) ->> owner_column)::uuid;
  recent integer;
begin
  execute format(
    'select count(*) from %I.%I where %I = $1 and created_at > now() - make_interval(secs => $2)',
    tg_table_schema, tg_table_name, owner_column
  ) into recent using who, window_seconds;

  if recent >= max_count then
    raise exception 'rate_limited' using errcode = 'P0001';
  end if;
  return new;
end;
$$;

revoke all on function public.enforce_rate_limit() from public, anon, authenticated;

-- 글: 1분에 3개까지 / 댓글: 1분에 10개까지 / 신고: 1분에 5개까지
create trigger posts_rate_limit
  before insert on public.posts
  for each row execute function public.enforce_rate_limit('author_id', '3', '60');

create trigger comments_rate_limit
  before insert on public.comments
  for each row execute function public.enforce_rate_limit('author_id', '10', '60');

create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '5', '60');
