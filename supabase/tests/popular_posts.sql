-- supabase/tests/popular_posts.sql
-- 인기글 함수(popular_posts)를 실제 DB에서 검증하는 스크립트.
--
-- 실행:  npx supabase db query --linked -f supabase/tests/popular_posts.sql
--
-- 동작: 가짜 사용자·글·좋아요를 만들어 함수를 호출하고, 마지막에 일부러 예외를 던져 전체를 롤백한다.
--       그래서 DB에는 아무것도 남지 않는다. 결과는 "오류 메시지(POPULAR_TEST_RESULT ...)"로 돌아오는데, 이는 의도된 것이다.
-- 주의: 원래 DB에 있던 글도 결과에 함께 보일 수 있다(아래 기대값은 가짜 글 기준이므로, id만 찍힌 줄은 기존 글이다).
-- popular_posts 검증: 가짜 데이터를 만들고 결과를 확인한 뒤, 일부러 예외를 던져 전체를 롤백한다(DB에 아무것도 남지 않음).
do $$
declare
  t_free uuid; t_love uuid;
  u uuid[] := array[]::uuid[];
  uid uuid;
  i int;
  p1 uuid := gen_random_uuid(); p2 uuid := gen_random_uuid(); p3 uuid := gen_random_uuid();
  p4 uuid := gen_random_uuid(); p5 uuid := gen_random_uuid(); p6 uuid := gen_random_uuid(); p7 uuid := gen_random_uuid();
  out text := '';
  r record;
  names jsonb := jsonb_build_object(p1::text,'p1(자유,1일전,좋아요3)', p2::text,'p2(자유,3일전,좋아요1)', p3::text,'p3(자유,30일전,좋아요5)',
                                    p4::text,'p4(연애,1일전,좋아요2)', p5::text,'p5(자유,2일전,좋아요0)', p6::text,'p6(자유,삭제됨,좋아요4)', p7::text,'p7(자유,1일전,좋아요0)');
begin
  set local session_replication_role = replica; -- 가짜 계정을 만들지 않고 외래키 검사만 건너뛴다(롤백되므로 안전)

  select id into t_free from public.topics where slug = 'free';
  select id into t_love from public.topics where slug = 'love';
  if t_free is null or t_love is null then raise exception '토픽을 찾지 못했습니다'; end if;

  for i in 1..5 loop
    uid := gen_random_uuid(); u := u || uid;
    insert into public.profiles (id, nickname, mbti, ilju) values (uid, 'test' || i, 'INTJ', '기묘');
  end loop;

  insert into public.posts (id, author_id, topic_id, title, body, created_at, deleted_at) values
    (p1, u[1], t_free, 'p1', 'b', now() - interval '1 day', null),
    (p2, u[1], t_free, 'p2', 'b', now() - interval '3 days', null),
    (p3, u[1], t_free, 'p3', 'b', now() - interval '30 days', null),
    (p4, u[1], t_love, 'p4', 'b', now() - interval '1 day', null),
    (p5, u[1], t_free, 'p5', 'b', now() - interval '2 days', null),
    (p6, u[1], t_free, 'p6', 'b', now() - interval '1 day', now()),
    (p7, u[1], t_free, 'p7', 'b', now() - interval '1 day' + interval '1 hour', null);

  -- 좋아요: p1=3, p2=1, p3=5, p4=2, p5=0, p6=4(삭제된 글), p7=0
  insert into public.likes (post_id, user_id) select p1, u[k] from generate_series(1,3) k;
  insert into public.likes (post_id, user_id) values (p2, u[1]);
  insert into public.likes (post_id, user_id) select p3, u[k] from generate_series(1,5) k;
  insert into public.likes (post_id, user_id) select p4, u[k] from generate_series(1,2) k;
  insert into public.likes (post_id, user_id) select p6, u[k] from generate_series(1,4) k;

  -- 로그인한 사용자(authenticated)로 전환해서 호출한다 (RLS가 적용되는 실제 상황)
  perform set_config('request.jwt.claims', json_build_object('sub', u[1], 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', u[1]::text, true);
  execute 'set local role authenticated';

  out := out || E'\n[1] 자유 게시판, 전체 기간 (기대: p3(5) > p1(3) > p2(1) > p7(0, 더 최신) > p5(0). p6(삭제됨)과 p4(연애)는 없어야 함)\n';
  for r in select * from public.popular_posts(t_free, null, 10) loop out := out || '    ' || coalesce(names ->> r.id::text, 'id=' || r.id::text) || ' → ' || coalesce(r.like_count::text, 'null') || E'\n'; end loop;

  out := out || E'\n[2] 자유 게시판, 최근 7일 (기대: p1(3) > p2(1) > p7(0) > p5(0). p3(30일 전)은 없어야 함)\n';
  for r in select * from public.popular_posts(t_free, 7, 10) loop out := out || '    ' || coalesce(names ->> r.id::text, 'id=' || r.id::text) || ' → ' || coalesce(r.like_count::text, 'null') || E'\n'; end loop;

  out := out || E'\n[3] 모든 게시판, 전체 기간 (기대: p3(5) > p1(3) > p4(2) > p2(1) > p7(0) > p5(0). p6 없음)\n';
  for r in select * from public.popular_posts(null, null, 10) loop out := out || '    ' || coalesce(names ->> r.id::text, 'id=' || r.id::text) || ' → ' || coalesce(r.like_count::text, 'null') || E'\n'; end loop;

  out := out || E'\n[4] 개수 제한 (기대: limit 0 → 1개, limit 2 → 2개)\n';
  out := out || '    limit 0 → ' || coalesce((select count(*) from public.popular_posts(null, null, 0))::text, 'null') || '개, limit 2 → ' || coalesce((select count(*) from public.popular_posts(null, null, 2))::text, 'null') || E'개\n';

  -- 익명(anon)은 호출할 수 없어야 한다
  execute 'reset role';
  execute 'set local role anon';
  begin
    perform * from public.popular_posts(null, null, 5);
    out := out || E'\n[5] 익명 호출: 허용됨 (기대와 다름: 막혀야 함)\n';
  exception when insufficient_privilege then
    out := out || E'\n[5] 익명 호출: 막힘 (기대대로)\n';
  end;

  raise exception 'POPULAR_TEST_RESULT%', coalesce(out, '(out이 비어 있음)'); -- 예외로 전체를 롤백한다
end
$$;
