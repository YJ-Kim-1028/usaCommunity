-- 20261114000005_rate_limit_v2.sql
-- 도배 방지 정책 개정: "1분에 N개"에서 "최소 간격 + 새 계정 강화 + 하루 한도"로 바꾼다.
--
-- 왜 바꿨나: 다른 커뮤니티를 찾아보니(Stack Overflow, Discourse, 국내 커뮤니티 등) 공통적으로
--   1) 짧은 시간의 총량보다 "한 번 쓰면 N초/N분 기다리기"(최소 간격)를 쓰고,
--   2) 새 계정에는 더 엄격하게 하다가 활동이 쌓이면 풀어 주고,
--   3) 하루 총량으로 한 번 더 막았다.
--   이전 방식(1분에 3개)은 3개를 연달아 올리는 것을 허용했고 새 계정과 오래된 계정을 구분하지 못했다.
--
-- 새 정책 (트리거 인자: 작성자 열, 간격(초), 하루 한도, 새 계정 간격(초), 새 계정 하루 한도)
--   글   : 60초 / 하루 20개   (새 계정 180초 / 하루 5개)
--   댓글 : 10초 / 하루 200개  (새 계정  30초 / 하루 50개)
--   신고 : 10초 / 하루 20개   (새 계정  30초 / 하루 10개)
--   "새 계정" = 프로필을 만든 지 24시간이 안 된 계정. 하루 = 최근 24시간(굴러가는 창).
--   숫자는 조사한 사례를 참고해 정한 판단값이며, 실제로 운영하면서 조정해야 한다.
--
-- 설계 메모(이전과 같음)
--   - security definer: 삭제된 글(deleted_at)까지 세어야 "올리고 지우고 또 올리기"를 막는다.
--     RLS를 건너뛰므로 search_path를 고정하고, 직접 실행 권한은 아무에게도 주지 않는다.
--   - 막혔을 때 오류 메시지: 'rate_limited:interval'(너무 빨리) 또는 'rate_limited:daily'(하루 한도).
--     앱은 'rate_limited'가 들어 있는지로 알아보고, 'daily'면 다른 안내 문구를 보여 준다.

create or replace function public.enforce_rate_limit()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  owner_column text := tg_argv[0];
  cooldown_seconds integer := tg_argv[1]::integer;
  daily_max integer := tg_argv[2]::integer;
  new_cooldown_seconds integer := tg_argv[3]::integer;
  new_daily_max integer := tg_argv[4]::integer;
  who uuid := (to_jsonb(new) ->> owner_column)::uuid;
  is_new_account boolean;
  last_at timestamptz;
  day_count integer;
begin
  select exists (
    select 1 from public.profiles p
    where p.id = who and p.created_at > now() - interval '24 hours'
  ) into is_new_account;

  if is_new_account then
    cooldown_seconds := new_cooldown_seconds;
    daily_max := new_daily_max;
  end if;

  execute format(
    'select max(created_at), count(*) filter (where created_at > now() - interval ''24 hours'') from %I.%I where %I = $1',
    tg_table_schema, tg_table_name, owner_column
  ) into last_at, day_count using who;

  if last_at is not null and last_at > now() - make_interval(secs => cooldown_seconds) then
    raise exception 'rate_limited:interval' using errcode = 'P0001';
  end if;

  if day_count >= daily_max then
    raise exception 'rate_limited:daily' using errcode = 'P0001';
  end if;

  return new;
end;
$$;

-- 트리거를 새 인자로 다시 만든다
drop trigger posts_rate_limit on public.posts;
create trigger posts_rate_limit
  before insert on public.posts
  for each row execute function public.enforce_rate_limit('author_id', '60', '20', '180', '5');

drop trigger comments_rate_limit on public.comments;
create trigger comments_rate_limit
  before insert on public.comments
  for each row execute function public.enforce_rate_limit('author_id', '10', '200', '30', '50');

drop trigger reports_rate_limit on public.reports;
create trigger reports_rate_limit
  before insert on public.reports
  for each row execute function public.enforce_rate_limit('reporter_id', '10', '20', '30', '10');
