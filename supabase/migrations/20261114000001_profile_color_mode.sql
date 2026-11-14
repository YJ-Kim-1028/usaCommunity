-- 20261114000001_profile_color_mode.sql
-- 화면 모드(밝게/어둡게) 선택을 계정에 저장해서, 다른 기기에서 로그인해도 같은 설정으로 보이게 한다.
--
-- 왜 profile_private에 두나: profiles는 다른 사용자도 읽을 수 있는 공개 프로필이다.
--   화면 취향은 남에게 보일 이유가 없으므로, 본인만 읽고 쓰는 profile_private에 둔다
--   (기존 RLS 정책 "users can manage their own private profile info"가 그대로 적용된다).
-- null은 "고르지 않음 = 기기 설정을 따른다"는 뜻이다.
-- 새 열이라도 테이블 단위 GRANT(20261109000001)가 이미 있어서 권한을 따로 열 필요가 없다.

alter table public.profile_private
  add column color_mode text check (color_mode in ('light', 'dark'));

comment on column public.profile_private.color_mode is
  '화면 모드 선택(light/dark). null이면 기기 설정을 따른다. 본인만 읽고 쓴다.';
