-- 20261114000003_length_constraints.sql
-- 입력 길이 제한을 DB에도 건다.
--
-- 왜 DB에도 거나: 화면(앱)에서 글자 수를 막아도, 앱을 거치지 않고 서버에 직접 요청을 보내면 우회된다.
--   마지막 규칙은 서버(DB)가 지켜야 한다. (화면의 제한은 사용자를 돕는 편의, DB의 제한은 방어선)
-- 공백만 있는 값도 막기 위해 btrim(앞뒤 공백 제거) 후의 길이로 센다.
--
-- not valid: 이미 들어 있는 기존 행은 검사하지 않고 "앞으로 들어오는 행"부터 검사한다.
--   (기존 데이터가 규칙에 안 맞더라도 마이그레이션이 실패하지 않게 하기 위함)

alter table public.posts
  add constraint posts_title_length check (char_length(btrim(title)) between 1 and 60) not valid;
alter table public.posts
  add constraint posts_body_length check (char_length(btrim(body)) between 1 and 5000) not valid;
alter table public.comments
  add constraint comments_body_length check (char_length(btrim(body)) between 1 and 500) not valid;
alter table public.reports
  add constraint reports_reason_length check (char_length(btrim(reason)) between 1 and 200) not valid;
alter table public.profiles
  add constraint profiles_nickname_length check (char_length(btrim(nickname)) between 2 and 12) not valid;
