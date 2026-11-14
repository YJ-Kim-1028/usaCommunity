-- supabase/tests/color_mode.sql
-- 화면 모드 열(profile_private.color_mode)이 의도대로 동작하는지 실제 DB에서 검증하는 스크립트.
--
-- 실행:  npx supabase db query --linked -f supabase/tests/color_mode.sql
--
-- 동작: 가짜 사용자 2명을 만들어 본인 저장·읽기, 잘못된 값 거절, 남의 값 접근 차단, 익명 차단을 확인하고,
--       마지막에 일부러 예외를 던져 전체를 롤백한다(DB에는 아무것도 남지 않는다).
--       결과는 "오류 메시지(COLOR_MODE_TEST_RESULT ...)"로 돌아오는데, 이는 의도된 것이다.
do $$
declare
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  out text := '';
  n int;
  v text;
begin
  set local session_replication_role = replica; -- 가짜 계정을 만들지 않고 외래키 검사만 건너뛴다(롤백되므로 안전)

  insert into public.profiles (id, nickname, mbti, ilju) values (u1, 'cm1', 'INTJ', '기묘'), (u2, 'cm2', 'INTJ', '기묘');
  insert into public.profile_private (user_id, gender, birth_date) values (u1, 'female', '2000-01-01'), (u2, 'male', '2000-01-01');

  -- 사용자 1(로그인한 사용자)로 전환
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u1::text, true);
  execute 'set local role authenticated';

  update public.profile_private set color_mode = 'dark' where user_id = u1;
  get diagnostics n = row_count;
  out := out || E'\n[1] 본인 값 저장: ' || n || '행 변경 (기대: 1)';

  select color_mode into v from public.profile_private where user_id = u1;
  out := out || E'\n[2] 본인 값 읽기: ' || coalesce(v, 'null') || ' (기대: dark)';

  begin
    update public.profile_private set color_mode = 'blue' where user_id = u1;
    out := out || E'\n[3] 잘못된 값 blue: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then
    out := out || E'\n[3] 잘못된 값 blue: 거절됨 (기대: 거절)';
  end;

  update public.profile_private set color_mode = null where user_id = u1;
  get diagnostics n = row_count;
  out := out || E'\n[4] 비움(null = 기기 설정 따름): ' || n || '행 변경 (기대: 1)';

  update public.profile_private set color_mode = 'light' where user_id = u1;

  -- 사용자 2로 전환: 사용자 1의 값에 접근할 수 없어야 한다
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u2::text, true);
  execute 'set local role authenticated';

  select count(*) into n from public.profile_private where user_id = u1;
  out := out || E'\n[5] 남의 값 읽기: ' || n || '행 보임 (기대: 0)';

  update public.profile_private set color_mode = 'dark' where user_id = u1;
  get diagnostics n = row_count;
  out := out || E'\n[6] 남의 값 수정: ' || n || '행 변경 (기대: 0)';

  -- 익명(로그인 안 함): 접근 자체가 막혀야 한다
  execute 'reset role';
  execute 'set local role anon';
  begin
    select count(*) into n from public.profile_private;
    out := out || E'\n[7] 익명 읽기: 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then
    out := out || E'\n[7] 익명 읽기: 차단됨 (기대: 차단)';
  end;

  raise exception 'COLOR_MODE_TEST_RESULT%', out;
end
$$;
