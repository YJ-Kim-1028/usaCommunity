-- 0001_init_schema.sql
-- 유사과학 커뮤니티 (가제) 초기 스키마: 프로필/게시글/댓글/좋아요/신고
-- Supabase 대시보드 SQL Editor에서 실행하세요. (Table Editor로 직접 만들지 말고 이 파일로 실행 —
-- 나중에 스키마가 바뀔 때도 새 마이그레이션 파일을 추가하는 방식으로 git에 이력이 남게 하기 위함)

-- ============================================================
-- profiles: 공개 프로필 (닉네임/MBTI/일주/사진) — 다른 유저도 읽을 수 있음
-- ============================================================
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nickname text not null,
  mbti text not null check (mbti in (
    'INTJ','INTP','ENTJ','ENTP','INFJ','INFP','ENFJ','ENFP',
    'ISTJ','ISFJ','ESTJ','ESFJ','ISTP','ISFP','ESTP','ESFP'
  )),
  ilju text not null,
  photo_url text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- 로그인한 사람이면 누구나 다른 사람 프로필(닉네임/뱃지)을 읽을 수 있음 (피드에 표시하려면 필요)
create policy "profiles are readable by authenticated users"
  on public.profiles for select
  to authenticated
  using (true);

-- 본인 프로필만 만들 수 있음
create policy "users can insert their own profile"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 본인 프로필만 수정 가능
create policy "users can update their own profile"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- ============================================================
-- profile_private: 민감 정보 (성별/생년월일/시간) — 본인만 읽고 쓸 수 있음, 다른 유저는 절대 접근 불가
-- ============================================================
create table public.profile_private (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  gender text not null check (gender in ('female', 'male')),
  birth_date date not null,
  birth_time time,
  created_at timestamptz not null default now()
);

alter table public.profile_private enable row level security;

-- 본인만 읽기/쓰기/수정 가능 (다른 유저를 위한 select 정책을 아예 안 만들어서, 남은 절대 못 봄)
create policy "users can manage their own private profile info"
  on public.profile_private for all
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- topics: 게시판 토픽 (자유/연애·고민/정보/유머 등) — 나중에 관리자가 늘릴 수 있게 테이블로 분리
-- ============================================================
create table public.topics (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

alter table public.topics enable row level security;

-- 누구나 토픽 목록은 읽을 수 있음
create policy "topics are readable by authenticated users"
  on public.topics for select
  to authenticated
  using (true);

-- insert/update/delete 정책을 일부러 안 만듦 — 앱(일반 유저)은 토픽을 추가/수정 못 하고,
-- 운영자만 Supabase 대시보드(Table Editor)에서 직접 관리. 나중에 "관리자 화면"이 생기면
-- 그때 관리자 role을 위한 정책을 따로 추가하면 됨
insert into public.topics (slug, name, sort_order) values
  ('free', '자유', 0),
  ('love', '연애·고민', 1),
  ('info', '정보', 2),
  ('humor', '유머', 3);

-- ============================================================
-- posts: 게시글
-- ============================================================
create table public.posts (
  id uuid primary key default gen_random_uuid(),
  author_id uuid not null references public.profiles (id) on delete cascade,
  topic_id uuid not null references public.topics (id),
  title text not null,
  body text not null,
  created_at timestamptz not null default now()
);

-- 외래키 컬럼은 자동으로 인덱스가 안 생겨서 직접 추가 (작성자별 글 목록 조회용)
create index posts_author_id_idx on public.posts (author_id);
-- 피드 화면이 "토픽별 + 최신순"으로 조회하므로 그 패턴에 맞춘 복합 인덱스
create index posts_topic_id_created_at_idx on public.posts (topic_id, created_at desc);

alter table public.posts enable row level security;

-- 게시글은 로그인한 사람 누구나 읽을 수 있음
create policy "posts are readable by authenticated users"
  on public.posts for select
  to authenticated
  using (true);

-- 본인 명의로만 글쓰기 가능
create policy "users can insert their own posts"
  on public.posts for insert
  to authenticated
  with check (auth.uid() = author_id);

-- 작성자만 수정/삭제 가능
create policy "authors can update their own posts"
  on public.posts for update
  to authenticated
  using (auth.uid() = author_id);

create policy "authors can delete their own posts"
  on public.posts for delete
  to authenticated
  using (auth.uid() = author_id);

-- ============================================================
-- comments: 댓글/대댓글 (parent_comment_id로 대댓글 표현)
-- ============================================================
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  parent_comment_id uuid references public.comments (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- "이 글의 댓글 목록" 조회가 제일 흔한 패턴이라 post_id에 인덱스
create index comments_post_id_idx on public.comments (post_id);
create index comments_author_id_idx on public.comments (author_id);
create index comments_parent_comment_id_idx on public.comments (parent_comment_id);

alter table public.comments enable row level security;

create policy "comments are readable by authenticated users"
  on public.comments for select
  to authenticated
  using (true);

create policy "users can insert their own comments"
  on public.comments for insert
  to authenticated
  with check (auth.uid() = author_id);

create policy "authors can update their own comments"
  on public.comments for update
  to authenticated
  using (auth.uid() = author_id);

create policy "authors can delete their own comments"
  on public.comments for delete
  to authenticated
  using (auth.uid() = author_id);

-- ============================================================
-- likes: 게시글 좋아요 (한 유저가 같은 글에 중복으로 못 누르게 unique 제약)
-- ============================================================
create table public.likes (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- 복합키 (post_id, user_id)라 post_id 단독 조회는 이미 빠름. "내가 좋아요 누른 글" 조회용으로 user_id도 추가
create index likes_user_id_idx on public.likes (user_id);

alter table public.likes enable row level security;

create policy "likes are readable by authenticated users"
  on public.likes for select
  to authenticated
  using (true);

-- 본인 이름으로만 좋아요를 남기거나 취소할 수 있음
create policy "users can like posts as themselves"
  on public.likes for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "users can remove their own like"
  on public.likes for delete
  to authenticated
  using (auth.uid() = user_id);

-- ============================================================
-- reports: 신고 (본인이 신고 접수만 가능, 조회는 앱에서 안 씀 — 운영자는 대시보드에서 직접 확인)
-- ============================================================
create table public.reports (
  id uuid primary key default gen_random_uuid(),
  reporter_id uuid not null references public.profiles (id) on delete cascade,
  post_id uuid references public.posts (id) on delete cascade,
  comment_id uuid references public.comments (id) on delete cascade,
  reason text not null,
  created_at timestamptz not null default now(),
  -- 게시글 신고 또는 댓글 신고 중 정확히 하나만 채워지도록 강제 (둘 다 null이거나 둘 다 채워지는 걸 방지)
  constraint reports_target_check check (num_nonnulls(post_id, comment_id) = 1)
);

create index reports_reporter_id_idx on public.reports (reporter_id);
create index reports_post_id_idx on public.reports (post_id);
create index reports_comment_id_idx on public.reports (comment_id);

alter table public.reports enable row level security;

-- 본인 명의로만 신고 접수 가능 (select 정책은 일부러 안 만듦 — 앱에서 신고 내역을 다시 읽을 필요가 없고,
-- 신고자 신원이 다른 유저에게 노출되면 안 되기 때문. 운영자는 Supabase 대시보드에서 service_role로 직접 확인)
create policy "users can submit reports as themselves"
  on public.reports for insert
  to authenticated
  with check (auth.uid() = reporter_id);
