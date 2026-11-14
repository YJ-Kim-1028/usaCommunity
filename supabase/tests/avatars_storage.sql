-- supabase/tests/avatars_storage.sql
-- 프로필 사진 저장소(avatars 버킷)의 설정과 접근 규칙을 실제 DB에서 검증하는 스크립트.
--
-- 실행:  npx supabase db query --linked -f supabase/tests/avatars_storage.sql
--
-- 동작: 가짜 사용자 2명으로 업로드·수정·삭제·조회를 시도하고, 마지막에 일부러 예외를 던져 전체를 롤백한다
--       (DB에는 아무것도 남지 않는다). 결과는 "오류 메시지(AVATARS_TEST_RESULT ...)"로 돌아오는데, 이는 의도된 것이다.
-- 참고: 여기서는 storage.objects 표에 직접 넣어 규칙(RLS)만 시험한다. 실제 파일 업로드·삭제는 앱(Storage API)에서 한다.
do $$
declare
  u1 uuid := gen_random_uuid();
  u2 uuid := gen_random_uuid();
  out text := '';
  n int;
  b record;
begin
  select * into b from storage.buckets where id = 'avatars';
  out := out || E'\n[1] 버킷 설정: public=' || coalesce(b.public::text, 'null') || ', 크기=' || coalesce(b.file_size_limit::text, 'null')
        || ', 형식=' || coalesce(array_to_string(b.allowed_mime_types, ','), 'null')
        || ' (기대: true, 2097152, image/jpeg,image/png,image/webp)';

  -- 사용자 1로 전환
  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u1::text, true);
  execute 'set local role authenticated';

  insert into storage.objects (bucket_id, name, owner_id) values ('avatars', u1::text || '/avatar', u1::text);
  out := out || E'\n[2] 본인 경로(내id/avatar)에 올리기: 성공 (기대)';

  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', u2::text || '/avatar', u1::text);
    out := out || E'\n[3] 남의 경로에 올리기: 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then out := out || E'\n[3] 남의 경로에 올리기: 차단됨 (기대)'; end;

  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', u1::text || '/other.png', u1::text);
    out := out || E'\n[4] 내 폴더의 다른 파일 이름(other.png): 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then out := out || E'\n[4] 내 폴더의 다른 파일 이름(other.png): 차단됨 (기대: 파일은 avatar 하나만)'; end;

  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', u1::text || '/avatar/sub', u1::text);
    out := out || E'\n[5] 하위 경로(내id/avatar/sub): 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then out := out || E'\n[5] 하위 경로(내id/avatar/sub): 차단됨 (기대)'; end;

  update storage.objects set metadata = '{"test": true}'::jsonb where bucket_id = 'avatars' and name = u1::text || '/avatar';
  get diagnostics n = row_count;
  out := out || E'\n[6] 본인 파일 바꾸기: ' || n || '행 (기대: 1)';

  select count(*) into n from storage.objects where bucket_id = 'avatars' and name = u1::text || '/avatar';
  out := out || E'\n[7] 본인 파일 조회: ' || n || '행 (기대: 1)';

  -- 사용자 2로 전환: 사용자 1의 파일에 접근할 수 없어야 한다
  execute 'reset role';
  perform set_config('request.jwt.claims', json_build_object('sub', u2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u2::text, true);
  execute 'set local role authenticated';

  select count(*) into n from storage.objects where bucket_id = 'avatars' and name = u1::text || '/avatar';
  out := out || E'\n[8] 남의 파일 조회: ' || n || '행 (기대: 0)';

  update storage.objects set metadata = '{"hack": true}'::jsonb where bucket_id = 'avatars' and name = u1::text || '/avatar';
  get diagnostics n = row_count;
  out := out || E'\n[9] 남의 파일 바꾸기: ' || n || '행 (기대: 0)';

  -- 삭제는 Supabase가 SQL로 직접 지우는 것을 막아 두었다("Storage API를 쓰라"). 그래서 지워 보는 대신,
  -- 삭제 규칙이 "본인 경로만"으로 등록되어 있는지 확인한다. 실제 삭제 동작은 앱(Storage API)에서 확인한다.
  select count(*) into n from pg_policies
  where schemaname = 'storage' and tablename = 'objects' and cmd = 'DELETE'
    and policyname = 'avatars: users can delete their own avatar'
    and qual like '%avatar%' and qual like '%auth.uid()%';
  out := out || E'\n[10] 삭제 규칙(본인 경로만) 등록: ' || n || '개 (기대: 1)';

  select count(*) into n from pg_policies
  where schemaname = 'storage' and tablename = 'objects' and policyname like 'avatars:%' and roles = '{authenticated}';
  out := out || E'\n[11] avatars 규칙 4개(올리기·바꾸기·지우기·조회)가 모두 로그인한 사용자 전용: ' || n || '개 (기대: 4)';

  -- 익명(로그인 안 함)
  execute 'reset role';
  execute 'set local role anon';
  begin
    insert into storage.objects (bucket_id, name, owner_id) values ('avatars', u1::text || '/avatar2', null);
    out := out || E'\n[12] 익명 올리기: 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then out := out || E'\n[12] 익명 올리기: 차단됨 (기대)'; end;

  raise exception 'AVATARS_TEST_RESULT%', out;
end
$$;
