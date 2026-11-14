-- supabase/tests/input_limits.sql
-- 입력 길이 제한(20261114000003)과 도배 방지 정책(20261114000005, 최소 간격·새 계정 강화·하루 한도)을
-- 실제 DB에서 검증하는 스크립트.
--
-- 실행:  npx supabase db query --linked -f supabase/tests/input_limits.sql
--
-- 동작: 가짜 사용자를 만들어 제한을 일부러 넘겨 보고, 마지막에 일부러 예외를 던져 전체를 롤백한다.
--       결과는 "오류 메시지(LIMITS_TEST_RESULT ...)"로 돌아오는데, 이는 의도된 것이다.
-- 참고: session_replication_role = replica 상태에서는 트리거가 꺼지므로, 도배 방지 트리거만
--       "enable always"로 켜 둔다(롤백되므로 안전). 준비용 데이터를 넣을 때도 트리거가 동작하므로,
--       준비 데이터는 제한에 걸리지 않게(간격을 두고) 넣는다.
do $$
declare
  t_free uuid;
  p uuid := gen_random_uuid();
  uo1 uuid := gen_random_uuid(); -- 오래된 계정: 글 간격(바로 두 번째 글)
  uo2 uuid := gen_random_uuid(); -- 오래된 계정: 마지막 글이 2분 전
  un1 uuid := gen_random_uuid(); -- 새 계정: 마지막 글이 2분 전
  uo3 uuid := gen_random_uuid(); -- 오래된 계정: 하루 글 20개 사용
  uo4 uuid := gen_random_uuid(); -- 오래된 계정: 10초 전에 삭제한 글
  uc1 uuid := gen_random_uuid(); -- 오래된 계정: 댓글 간격
  uc2 uuid := gen_random_uuid(); -- 오래된 계정: 마지막 댓글이 15초 전
  uc3 uuid := gen_random_uuid(); -- 오래된 계정: 하루 댓글 200개 사용
  ur1 uuid := gen_random_uuid(); -- 오래된 계정: 신고 간격
  ul  uuid := gen_random_uuid(); -- 새 계정: 길이 제한 시험
  out text := '';
  i int;
begin
  set local session_replication_role = replica;
  alter table public.posts enable always trigger posts_rate_limit;
  alter table public.comments enable always trigger comments_rate_limit;
  alter table public.reports enable always trigger reports_rate_limit;

  select id into t_free from public.topics where slug = 'free';

  insert into public.profiles (id, nickname, mbti, ilju, created_at) values
    (uo1, 'lo1', 'INTJ', '기묘', now() - interval '3 days'),
    (uo2, 'lo2', 'INTJ', '기묘', now() - interval '3 days'),
    (un1, 'ln1', 'INTJ', '기묘', now()),
    (uo3, 'lo3', 'INTJ', '기묘', now() - interval '3 days'),
    (uo4, 'lo4', 'INTJ', '기묘', now() - interval '3 days'),
    (uc1, 'lc1', 'INTJ', '기묘', now() - interval '3 days'),
    (uc2, 'lc2', 'INTJ', '기묘', now() - interval '3 days'),
    (uc3, 'lc3', 'INTJ', '기묘', now() - interval '3 days'),
    (ur1, 'lr1', 'INTJ', '기묘', now() - interval '3 days'),
    (ul,  'll1', 'INTJ', '기묘', now());

  -- ── 준비용 데이터(제한에 걸리지 않게 시간 간격을 두고 넣는다) ──
  insert into public.posts (author_id, topic_id, title, body, created_at) values
    (uo2, t_free, 'old2', 'b', now() - interval '2 minutes'),
    (un1, t_free, 'new1', 'b', now() - interval '2 minutes');
  for i in 1..20 loop -- 오래된 계정의 하루 글 20개(1시간 간격으로 최근 20시간)
    insert into public.posts (author_id, topic_id, title, body, created_at)
    values (uo3, t_free, 'day' || i, 'b', now() - make_interval(hours => 21 - i));
  end loop;
  insert into public.posts (author_id, topic_id, title, body, created_at, deleted_at)
  values (uo4, t_free, 'deleted', 'b', now() - interval '10 seconds', now()); -- 삭제한 글도 간격에 센다
  insert into public.comments (post_id, author_id, body, created_at) values (p, uc2, 'c', now() - interval '15 seconds');
  for i in 1..200 loop -- 하루 댓글 200개(6분 간격)
    insert into public.comments (post_id, author_id, body, created_at)
    values (p, uc3, 'c' || i, now() - make_interval(mins => i * 6));
  end loop;

  execute 'set local role authenticated';

  -- ── 글: 최소 간격 ──
  perform set_config('request.jwt.claims', json_build_object('sub', uo1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uo1::text, true);
  insert into public.posts (author_id, topic_id, title, body) values (uo1, t_free, 'a1', 'b');
  out := out || E'\n[1] 오래된 계정의 첫 글: 성공 (기대)';
  begin
    insert into public.posts (author_id, topic_id, title, body) values (uo1, t_free, 'a2', 'b');
    out := out || E'\n[2] 바로 이어서 두 번째 글: 허용됨 (기대: 차단 → 문제!)';
  exception when others then
    out := out || E'\n[2] 바로 이어서 두 번째 글: ' || (case when sqlerrm = 'rate_limited:interval' then '차단됨, rate_limited:interval (기대)' else '다른 오류: ' || sqlerrm end);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', uo2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uo2::text, true);
  begin
    insert into public.posts (author_id, topic_id, title, body) values (uo2, t_free, 'a3', 'b');
    out := out || E'\n[3] 오래된 계정, 마지막 글이 2분 전: 허용됨 (기대: 간격 60초라서 허용)';
  exception when others then
    out := out || E'\n[3] 오래된 계정, 마지막 글이 2분 전: 차단됨 ' || sqlerrm || ' (기대: 허용 → 문제!)';
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', un1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', un1::text, true);
  begin
    insert into public.posts (author_id, topic_id, title, body) values (un1, t_free, 'a4', 'b');
    out := out || E'\n[4] 새 계정, 마지막 글이 2분 전: 허용됨 (기대: 새 계정 간격 180초라서 차단 → 문제!)';
  exception when others then
    out := out || E'\n[4] 새 계정, 마지막 글이 2분 전: ' || (case when sqlerrm = 'rate_limited:interval' then '차단됨 (기대: 새 계정은 180초)' else '다른 오류: ' || sqlerrm end);
  end;

  -- ── 글: 하루 한도, 삭제한 글 ──
  perform set_config('request.jwt.claims', json_build_object('sub', uo3, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uo3::text, true);
  begin
    insert into public.posts (author_id, topic_id, title, body) values (uo3, t_free, 'a5', 'b');
    out := out || E'\n[5] 하루 글 20개를 쓴 계정의 21번째 글: 허용됨 (기대: 차단 → 문제!)';
  exception when others then
    out := out || E'\n[5] 하루 글 20개를 쓴 계정의 21번째 글: ' || (case when sqlerrm = 'rate_limited:daily' then '차단됨, rate_limited:daily (기대)' else '다른 오류: ' || sqlerrm end);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', uo4, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uo4::text, true);
  begin
    insert into public.posts (author_id, topic_id, title, body) values (uo4, t_free, 'a6', 'b');
    out := out || E'\n[6] 10초 전에 삭제한 글이 있는 상태의 새 글: 허용됨 (기대: 차단 → 문제!)';
  exception when others then
    out := out || E'\n[6] 10초 전에 삭제한 글이 있는 상태의 새 글: ' || (case when sqlerrm = 'rate_limited:interval' then '차단됨 (기대: 삭제해도 센다)' else '다른 오류: ' || sqlerrm end);
  end;

  -- ── 댓글 ──
  perform set_config('request.jwt.claims', json_build_object('sub', uc1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uc1::text, true);
  insert into public.comments (post_id, author_id, body) values (p, uc1, 'c1');
  begin
    insert into public.comments (post_id, author_id, body) values (p, uc1, 'c2');
    out := out || E'\n[7] 바로 이어서 두 번째 댓글: 허용됨 (기대: 차단 → 문제!)';
  exception when others then
    out := out || E'\n[7] 바로 이어서 두 번째 댓글: ' || (case when sqlerrm = 'rate_limited:interval' then '차단됨 (기대)' else '다른 오류: ' || sqlerrm end);
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', uc2, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uc2::text, true);
  begin
    insert into public.comments (post_id, author_id, body) values (p, uc2, 'c3');
    out := out || E'\n[8] 마지막 댓글이 15초 전: 허용됨 (기대: 간격 10초라서 허용)';
  exception when others then
    out := out || E'\n[8] 마지막 댓글이 15초 전: 차단됨 ' || sqlerrm || ' (기대: 허용 → 문제!)';
  end;

  perform set_config('request.jwt.claims', json_build_object('sub', uc3, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', uc3::text, true);
  begin
    insert into public.comments (post_id, author_id, body) values (p, uc3, 'c4');
    out := out || E'\n[9] 하루 댓글 200개를 쓴 계정의 201번째 댓글: 허용됨 (기대: 차단 → 문제!)';
  exception when others then
    out := out || E'\n[9] 하루 댓글 200개를 쓴 계정의 201번째 댓글: ' || (case when sqlerrm = 'rate_limited:daily' then '차단됨 (기대)' else '다른 오류: ' || sqlerrm end);
  end;

  -- ── 신고 ──
  perform set_config('request.jwt.claims', json_build_object('sub', ur1, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ur1::text, true);
  insert into public.reports (reporter_id, post_id, reason) values (ur1, p, 'r1');
  begin
    insert into public.reports (reporter_id, post_id, reason) values (ur1, p, 'r2');
    out := out || E'\n[10] 바로 이어서 두 번째 신고: 허용됨 (기대: 차단 → 문제!)';
  exception when others then
    out := out || E'\n[10] 바로 이어서 두 번째 신고: ' || (case when sqlerrm = 'rate_limited:interval' then '차단됨 (기대)' else '다른 오류: ' || sqlerrm end);
  end;

  -- 트리거 함수는 직접 부를 수 없어야 한다
  begin
    perform public.enforce_rate_limit();
    out := out || E'\n[11] 도배 방지 함수 직접 호출: 허용됨 (기대: 차단 → 문제!)';
  exception when insufficient_privilege then
    out := out || E'\n[11] 도배 방지 함수 직접 호출: 차단됨 (기대)';
  when others then
    out := out || E'\n[11] 도배 방지 함수 직접 호출: 다른 오류 ' || sqlerrm;
  end;

  -- ── 길이 제한 ──
  perform set_config('request.jwt.claims', json_build_object('sub', ul, 'role', 'authenticated')::text, true);
  perform set_config('request.jwt.claim.sub', ul::text, true);

  begin
    insert into public.posts (author_id, topic_id, title, body) values (ul, t_free, repeat('가', 61), 'b');
    out := out || E'\n[12] 제목 61자: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[12] 제목 61자: 거절됨 (기대)'; end;

  begin
    insert into public.posts (author_id, topic_id, title, body) values (ul, t_free, '     ', 'b');
    out := out || E'\n[13] 공백만 있는 제목: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[13] 공백만 있는 제목: 거절됨 (기대)'; end;

  begin
    insert into public.posts (author_id, topic_id, title, body) values (ul, t_free, 'ok', repeat('가', 5001));
    out := out || E'\n[14] 본문 5001자: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[14] 본문 5001자: 거절됨 (기대)'; end;

  begin
    insert into public.posts (author_id, topic_id, title, body) values (ul, t_free, repeat('가', 60), repeat('가', 5000));
    out := out || E'\n[15] 경계값(제목 60자, 본문 5000자): 허용됨 (기대)';
  exception when check_violation then out := out || E'\n[15] 경계값: 거절됨 (기대: 허용 → 문제!)'; end;

  begin
    insert into public.comments (post_id, author_id, body) values (p, ul, repeat('가', 501));
    out := out || E'\n[16] 댓글 501자: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[16] 댓글 501자: 거절됨 (기대)'; end;

  begin
    insert into public.comments (post_id, author_id, body) values (p, ul, repeat('가', 500));
    out := out || E'\n[17] 댓글 500자(경계값): 허용됨 (기대)';
  exception when check_violation then out := out || E'\n[17] 댓글 500자: 거절됨 (기대: 허용 → 문제!)'; end;

  begin
    insert into public.reports (reporter_id, post_id, reason) values (ul, p, repeat('가', 201));
    out := out || E'\n[18] 신고 사유 201자: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[18] 신고 사유 201자: 거절됨 (기대)'; end;

  begin
    update public.profiles set nickname = '가' where id = ul;
    out := out || E'\n[19] 닉네임 1자: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[19] 닉네임 1자: 거절됨 (기대)'; end;

  begin
    update public.profiles set nickname = repeat('가', 13) where id = ul;
    out := out || E'\n[20] 닉네임 13자: 허용됨 (기대: 거절 → 문제!)';
  exception when check_violation then out := out || E'\n[20] 닉네임 13자: 거절됨 (기대)'; end;

  raise exception 'LIMITS_TEST_RESULT%', out;
end
$$;
