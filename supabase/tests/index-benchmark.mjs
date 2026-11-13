// 인덱스 효과 측정 실험 (글 ⑨ 참고)
// - 실제 Supabase 서버는 건드리지 않는다. Node 안에서 도는 PostgreSQL(PGlite)에 가짜 데이터를 만들어 쟀다.
// - 실행: 이 프로젝트에는 PGlite를 설치하지 않았다. 임시 폴더에서
//     npm init -y && npm i @electric-sql/pglite   (이 파일을 그 폴더에 두고)
//     node index-benchmark.mjs
// - 절대 시간보다 인덱스 전후 비교를 볼 것(메모리 DB, 가짜 데이터).
import { PGlite } from '@electric-sql/pglite';

const N_USERS = 20000;
const N_POSTS = 100000;
const N_LIKES = 300000;

const db = new PGlite();
const q = (s) => db.query(s);

// 실제 스키마(init_schema)와 같은 모양의 표 (인덱스는 실험에서 따로 만든다)
await db.exec(`
create table profiles (id int primary key, nickname text, mbti text, ilju text);
create table topics (id int primary key, name text);
create table posts (
  id int primary key,
  author_id int not null references profiles(id),
  topic_id int not null references topics(id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  deleted_at timestamptz
);
create table likes (
  post_id int not null references posts(id),
  user_id int not null references profiles(id),
  primary key (post_id, user_id)
);
`);
await q(`insert into topics select g, 'topic'||g from generate_series(1,5) g`);
await q(`insert into profiles select g, 'user'||g,
  (array['INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP','ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'])[1+floor(random()*16)::int],
  'ilju'||(1+floor(random()*60)::int) from generate_series(1,${N_USERS}) g`);

// 글 로드 시간 (인덱스 0개 vs 3개) 비교용으로 먼저 인덱스 없이 로드
const t0 = performance.now();
await q(`insert into posts
  select g, 1+floor(random()*${N_USERS})::int, 1+floor(random()*5)::int,
    'title '||g, repeat('내용 ', 40),
    now() - (random()*interval '365 days'),
    case when random() < 0.3 then now() else null end
  from generate_series(1,${N_POSTS}) g`);
const loadNoIdx = performance.now() - t0;

await q(`insert into likes
  select distinct on (p, u) p, u from (
    select 1+floor(power(random(),2)*${N_POSTS})::int p, 1+floor(random()*${N_USERS})::int u
    from generate_series(1,${N_LIKES})) s`);
await q('analyze');

async function plan(sql) {
  const runs = [];
  let root;
  for (let i = 0; i < 6; i++) {
    const r = await q('explain (analyze, buffers, format json) ' + sql);
    const j = r.rows[0]['QUERY PLAN'][0];
    if (i > 0) runs.push(j['Execution Time']); // 첫 실행은 버림
    root = j.Plan;
  }
  runs.sort((a, b) => a - b);
  const nodes = [];
  (function walk(n) { nodes.push(n['Node Type'] + (n['Index Name'] ? `(${n['Index Name']})` : '')); (n.Plans || []).forEach(walk); })(root);
  return { ms: runs[2].toFixed(2), plan: nodes.join(' > '), buffers: (root['Shared Hit Blocks'] || 0) + (root['Shared Read Blocks'] || 0) };
}
async function report(label, sql) {
  const r = await plan(sql);
  console.log(`${label.padEnd(44)} ${String(r.ms).padStart(9)} ms  buf=${String(r.buffers).padStart(6)}  ${r.plan}`);
}
async function size(name) {
  const r = await q(`select pg_size_pretty(pg_relation_size('${name}')) s`);
  return r.rows[0].s;
}

const cursor = (await q(`select created_at c from posts where deleted_at is null order by created_at desc offset 5000 limit 1`)).rows[0].c.toISOString();

const LIST = `select id,title,created_at from posts where topic_id=3 and deleted_at is null order by created_at desc limit 20`;
const MORE = `select id,title,created_at from posts where topic_id=3 and deleted_at is null and created_at < '${cursor}' order by created_at desc limit 20`;
const ALL = `select id,title,created_at from posts where deleted_at is null order by created_at desc limit 20`;
const POP_ALL = `select p.id, p.title, count(l.post_id) lc from posts p left join likes l on l.post_id=p.id where p.topic_id=3 and p.deleted_at is null group by p.id,p.title,p.created_at order by lc desc, p.created_at desc limit 2`;
const POP_7 = `select p.id, p.title, count(l.post_id) lc from posts p left join likes l on l.post_id=p.id where p.topic_id=3 and p.deleted_at is null and p.created_at >= now() - interval '7 days' group by p.id,p.title,p.created_at order by lc desc, p.created_at desc limit 2`;
const MBTI = `select p.id,p.title,p.created_at from posts p join profiles a on a.id=p.author_id where p.topic_id=3 and p.deleted_at is null and a.mbti='INTJ' order by p.created_at desc limit 20`;

console.log(`\n데이터: 글 ${N_POSTS} (30% 삭제), 사용자 ${N_USERS}, 좋아요 약 ${N_LIKES}, 게시판 5개\n`);

console.log('=== 1단계: 인덱스 없음 (기본키만) ===');
await report('게시판 목록 (첫 20개)', LIST);
await report('더 보기 (5000번째 이후 20개)', MORE);
await report('전체 게시판 최신 20개', ALL);
await report('인기글 전체 기간', POP_ALL);
await report('인기글 7일', POP_7);
await report('MBTI 필터 목록', MBTI);

console.log('\n=== 2단계: 현재 인덱스 (topic_id, created_at desc) + likes(user_id)/posts(author_id) ===');
await q('create index posts_topic_id_created_at_idx on posts (topic_id, created_at desc)');
await q('create index posts_author_id_idx on posts (author_id)');
await q('analyze posts');
await report('게시판 목록 (첫 20개)', LIST);
await report('더 보기 (5000번째 이후 20개)', MORE);
await report('전체 게시판 최신 20개', ALL);
await report('인기글 전체 기간', POP_ALL);
await report('인기글 7일', POP_7);
await report('MBTI 필터 목록', MBTI);
const sizeFull = await size('posts_topic_id_created_at_idx');

console.log('\n=== 3단계: + posts(created_at desc) ===');
await q('create index posts_created_at_idx on posts (created_at desc)');
await q('analyze posts');
await report('전체 게시판 최신 20개', ALL);

console.log('\n=== 4단계: 부분 인덱스 (삭제 안 된 글만) ===');
await q('create index posts_topic_created_live_idx on posts (topic_id, created_at desc) where deleted_at is null');
await q('analyze posts');
await report('게시판 목록 (첫 20개)', LIST);
await report('더 보기 (5000번째 이후 20개)', MORE);
console.log('인덱스 크기: 기존 (topic_id, created_at)', sizeFull, ' / 부분 인덱스', await size('posts_topic_created_live_idx'));

console.log('\n=== 5단계: 인기글 7일 + created_at 부분 인덱스 확인 ===');
await report('인기글 7일', POP_7);

console.log('\n=== 6단계: 좋아요 수를 posts에 저장(비정규화) ===');
await q('alter table posts add column like_count int not null default 0');
await q('update posts p set like_count = c.n from (select post_id, count(*) n from likes group by post_id) c where c.post_id = p.id');
await q('create index posts_topic_likes_idx on posts (topic_id, like_count desc, created_at desc) where deleted_at is null');
await q('analyze posts');
await report('인기글 전체 기간 (like_count 열 사용)', `select id,title,like_count from posts where topic_id=3 and deleted_at is null order by like_count desc, created_at desc limit 2`);

console.log('\n=== 쓰기 비용: 글 10만 개를 넣는 시간 ===');
const db2 = new PGlite();
async function loadTime(idxSql) {
  const d = new PGlite();
  await d.exec(`create table posts (id int primary key, author_id int, topic_id int, title text, body text, created_at timestamptz, deleted_at timestamptz); ${idxSql}`);
  const t = performance.now();
  await d.query(`insert into posts select g, 1+floor(random()*20000)::int, 1+floor(random()*5)::int, 'title '||g, repeat('내용 ', 40), now()-(random()*interval '365 days'), null from generate_series(1,${N_POSTS}) g`);
  const ms = performance.now() - t;
  await d.close();
  return ms;
}
const w0 = await loadTime('');
const w1 = await loadTime('create index a on posts (topic_id, created_at desc);');
const w3 = await loadTime('create index a on posts (topic_id, created_at desc); create index b on posts (author_id); create index c on posts (created_at desc);');
console.log(`인덱스 0개(기본키만): ${(w0 / 1000).toFixed(2)}초 / 1개 추가: ${(w1 / 1000).toFixed(2)}초 / 3개 추가: ${(w3 / 1000).toFixed(2)}초`);
