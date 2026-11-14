-- supabase/tests/search_posts.sql
-- 글 검색 함수(search_posts)를 실제 DB에서 검증하는 스크립트.
--
-- 실행:  npx supabase db query --linked -f supabase/tests/search_posts.sql
--
-- 동작: 가짜 사용자·글을 만들어 검색을 호출하고, 마지막에 일부러 예외를 던져 전체를 롤백한다(DB에는 아무것도 남지 않는다).
--       결과는 "오류 메시지(SEARCH_TEST_RESULT ...)"로 돌아오는데, 이는 의도된 것이다.
do $$
declare
  u1 uuid := gen_random_uuid();
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid(); p6 uuid := gen_random_uuid();
  t_free uuid;
  out text := '';
  n int;
  ids uuid[];
  photo text;
begin
  set local session_replication_role = replica; -- 가짜 계정을 만들지 않고 외래키 검사만 건너뛴다(롤백되므로 안전)

  select id into t_free from public.topics where slug = 'free';
  insert into public.profiles (id, nickname, mbti, ilju, photo_url) values (u1, 'sr1', 'INTJ', '기묘', 'https://example.test/avatars/u1/avatar?v=1');

  insert into public.posts (id, author_id, topic_id, title, body, created_at, deleted_at) values
    (p1, u1, t_free, 'Hello World',          'abc',       now() - interval '5 hours', null),
    (p2, u1, t_free, '100% 확실한 이야기',    'x',         now() - interval '4 hours', null),
    (p3, u1, t_free, 'under_score 이름',      'y',         now() - interval '3 hours', null),
    (p4, u1, t_free, 'deleted post hello',   'z',         now() - interval '2 hours', now()),
    (p5, u1, t_free, '본문에만 있는 글',        'zzz hello', now() - interval '1 hours', null),
    (p6, u1, t_free, 'underXscore 비슷한 이름', 'w',         now() - interval '30 minutes', null);

  perform set_config('request.jwt.claims', json_build_object('sub', u1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u1::text, true);
  execute 'set local role authenticated';

  select array_agg(id order by created_at desc) into ids from public.search_posts('hello');
  out := out || E'\n[1] "hello"(대소문자 무시, 제목·본문): ' || coalesce(array_length(ids, 1), 0) || '개 (기대: 2 = 제목에 있는 p1, 본문에 있는 p5. 삭제된 p4는 제외)'
        || ' / 최신순 ' || (case when ids[1] = p5 and ids[2] = p1 then '맞음' else '틀림' end);

  select count(*) into n from public.search_posts('100%');
  out := out || E'\n[2] "100%"(% 를 글자 그대로): ' || n || '개 (기대: 1)';

  select count(*) into n from public.search_posts('%%');
  out := out || E'\n[3] "%%"(와일드카드로 해석되면 전부 나옴): ' || n || '개 (기대: 0)';

  select count(*) into n from public.search_posts('under_s');
  out := out || E'\n[4] "under_s"(_ 를 글자 그대로): ' || n || '개 (기대: 1, underXscore는 나오면 안 됨)';

  select count(*) into n from public.search_posts('''; drop table public.posts; --');
  out := out || E'\n[5] SQL 인젝션 시도 문자열: ' || n || '개 (기대: 0, 그리고 posts 표가 멀쩡해야 함)';
  execute 'reset role';
  select count(*) into n from public.posts where author_id = u1;
  out := out || E'\n    posts 표 확인: ' || n || '개 남아 있음 (기대: 6)';
  execute 'set local role authenticated';

  select count(*) into n from public.search_posts('a');
  out := out || E'\n[6] 한 글자 검색어 "a": ' || n || '개 (기대: 0, 2자 미만은 빈 결과)';

  select count(*) into n from public.search_posts('   ');
  out := out || E'\n[7] 공백만 있는 검색어: ' || n || '개 (기대: 0)';

  select count(*) into n from public.search_posts('hello', 0);
  out := out || E'\n[8] 개수 0을 줘도: ' || n || '개 (기대: 1, 최소 1개)';

  select count(*) into n from public.search_posts('hello', 20, (select created_at from public.posts where id = p5));
  out := out || E'\n[9] 이전 페이지(p5보다 오래된 글만): ' || n || '개 (기대: 1 = p1)';

  select photo_url into photo from public.search_posts('hello') limit 1;
  out := out || E'\n[10] 작성자 사진 주소가 결과에 포함: ' || coalesce(photo, 'null') || ' (기대: https://example.test/avatars/u1/avatar?v=1)';

  execute 'reset role';
  execute 'set local role anon';
  begin
    perform * from public.search_posts('hello');
    out := out || E'\n[11] 익명 호출: 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then
    out := out || E'\n[11] 익명 호출: 차단됨 (기대: 차단)';
  end;

  raise exception 'SEARCH_TEST_RESULT%', out;
end
$$;
