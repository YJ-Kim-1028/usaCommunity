# 트러블슈팅 기록

개발 중 에러가 났다가 고친 일을 **문제점 → 원인 → 해결방법**으로 모아 둔 문서. 같은 문제가 다시 나왔을 때 빨리 찾고, 포트폴리오에서 "어떻게 풀었는지"를 설명할 근거로 쓴다.
버그 발견 경위와 테스트 방법은 `test.md`, 결정과 이유는 `dev-log.md`에 있다.

| # | 영역 | 한 줄 요약 |
|---|---|---|
| 1 | 인프라 | 무료 Supabase 프로젝트가 일시정지돼 앱이 연결되지 않음 |
| 2 | DB 권한 | 마이그레이션 적용 후 모든 테이블이 `permission denied` |
| 3 | DB 정책 | soft delete가 RLS 정책 위반으로 막힘 |
| 4 | 쿼리 | 작성자 조인이 "relationship이 둘 이상"으로 실패 |
| 5 | 웹 렌더링 | 개발 서버가 `window is not defined`로 죽음 |
| 6 | 웹 | `Alert.alert`가 웹에서 아무 동작도 하지 않음 |
| 7 | 인증 | 가입해도 세션이 안 생겨 이후 단계 진행 불가 |
| 8 | 개발 환경 | CLI 로그인이 터미널 환경에 따라 실패 |

---

## 1. 무료 Supabase 프로젝트가 일시정지돼 연결 실패
- **문제점**: 앱과 스크립트가 `https://<ref>.supabase.co`에 연결되지 않음. 증상은 `Could not resolve host`(DNS 조회 실패).
- **원인**: 무료 플랜 프로젝트는 일정 기간 접속이 없으면 자동으로 일시정지(paused)된다. 일시정지 중에는 주소 자체가 응답하지 않는다.
- **발견 경로**: `.env.development`의 주소로 `curl`/`nslookup` → "존재하지 않는 도메인". 삭제된 것으로 오해하기 쉬운 증상이라 대시보드에서 상태를 확인함.
- **해결방법**: 대시보드에서 **Resume project**(무료)로 복구. 상태가 `Coming up` → `Healthy`가 될 때까지 몇 분 기다린 뒤 `/auth/v1/health`가 200인지 확인. 유료 업그레이드(Upgrade to Pro)는 필요 없음.
- **재발 방지**: 한동안 접속이 없으면 다시 멈춘다. 배포 주소를 공개할 때는 정기적으로 접속하거나, 멈춰 있어도 README·캡처로 결과를 볼 수 있게 해 둔다.

## 2. 마이그레이션 적용 후 모든 테이블이 `permission denied` (42501)
- **문제점**: 테이블과 RLS 정책을 만들었는데, 앱/API로 조회하면 `permission denied for table topics`.
- **원인**: 대시보드에서 "자동 테이블 노출"을 꺼 둔 설정(보안 방침) 때문에, 테이블에 API 롤(`anon`/`authenticated`)의 기본 권한이 없다. RLS 정책은 "어떤 행을 볼 수 있는가"를 정하고, **GRANT는 "이 테이블에 접근 자체를 할 수 있는가"를 정한다.** 둘 다 있어야 한다.
- **발견 경로**: 마이그레이션 적용 직후 공개 키로 `topics`/`posts`를 조회해 확인.
- **해결방법**: `20261109000001_grant_table_privileges.sql`로 RLS 정책과 **같은 범위**에서만 `authenticated`에 GRANT. `anon`에는 아무것도 열지 않음(비로그인 차단은 그대로 유지). 운영자용 뷰는 일부러 권한을 회수한 상태라 건드리지 않음.
- **교훈**: 권한은 정책보다 넓지 않게(최소 권한). 새 테이블을 만들 때마다 정책과 GRANT를 같은 마이그레이션에 함께 쓴다.

## 3. soft delete(`update ... set deleted_at`)가 RLS 위반으로 막힘
- **문제점**: 본인 글을 삭제하면 `new row violates row-level security policy for table "posts"`.
- **원인**: Postgres는 UPDATE 후의 **새 행도 SELECT 정책으로 검사**한다. 읽기 정책이 `deleted_at is null`인데, `deleted_at`을 채운 새 행은 "읽을 수 없는 행"이라 거부된다. 실제 DB가 없을 때 설계해서 검증하지 못했던 결함.
- **발견 경로**: 실제 DB를 대상으로 한 E2E 검증(가입→글→삭제)에서 실패.
- **해결방법**: `20261109000002_soft_delete_functions.sql` — 본인 소유를 직접 확인한 뒤 `deleted_at`을 채우는 `security definer` 함수(`soft_delete_post`, `soft_delete_comment`)를 만들고, 앱은 `supabase.rpc()`로 호출. `security definer` 함수는 RLS를 우회하므로 ① 함수 안에서 `author_id = auth.uid()` 검사 ② `set search_path = ''`로 객체 바꿔치기 방지 ③ `anon` 실행 권한 회수를 함께 적용. 남의 글·없는 글은 42501로 거부되는지도 검증.

## 4. 작성자 조인이 "more than one relationship was found" 오류
- **문제점**: `posts`에서 `profiles`를 조인하면 `Could not embed because more than one relationship was found for 'posts' and 'profiles'`.
- **원인**: 두 테이블을 잇는 경로가 둘이다. 작성자 FK(`posts.author_id → profiles`)와 `likes`를 거치는 다대다 관계. PostgREST가 어느 쪽인지 정하지 못한다. 쿼리가 문자열이라 타입 검사로는 잡히지 않는다.
- **발견 경로**: E2E 검증의 피드 조회 단계.
- **해결방법**: 조인에 FK 이름을 지정. `author:profiles!posts_author_id_fkey!inner(...)`, 댓글은 `profiles!comments_author_id_fkey(...)`.

## 5. 개발 서버가 `ReferenceError: window is not defined`로 죽음
- **문제점**: `expo start --web` 직후 서버가 종료됨. 로그에 `SupabaseAuthClient._emitInitialSession`에서 `window is not defined`.
- **원인**: 앱 설정이 정적 웹 출력(`app.json`의 `web.output: "static"`)이라, 개발/빌드 서버(Node)가 화면을 한 번 **미리 렌더링**한다. 이때 Supabase 클라이언트가 세션 저장소(AsyncStorage의 웹 구현 = `localStorage`)를 만들면서 `window`를 찾는데, Node에는 `window`가 없다.
- **발견 경로**: 인증 연동 후 브라우저 테스트를 위해 웹 서버를 띄우다가 발견(타입 검사로는 못 잡음 — 실행 환경 차이).
- **해결방법**: `shared/lib/supabase.ts`에서 서버 렌더링 중(`typeof window === 'undefined'`)에는 `storage`를 쓰지 않고 `persistSession`/`autoRefreshToken`을 끈다. 브라우저에서만 저장소를 사용.
- **일반 원칙**: SSR/정적 출력이 켜진 앱에서 `window`, `localStorage`, `document` 등 브라우저 전용 API는 서버에서 실행되지 않게 가드한다.

## 6. 웹에서 `Alert.alert`가 아무 동작도 하지 않음
- **문제점**: 신고·삭제·로그아웃 확인창이 웹에서 뜨지 않아 버튼을 눌러도 아무 일도 없음.
- **원인**: react-native-web의 `Alert.alert`는 구현이 비어 있어(no-op) 웹에서는 호출해도 아무것도 보이지 않는다. 모바일 앱에서만 동작하는 코드.
- **해결방법**: `shared/lib/dialog.ts`에 `notify`/`confirmAction`을 만들어 웹에서는 `window.alert`/`window.confirm`, 네이티브에서는 `Alert.alert`를 쓰도록 분기. 화면 코드는 이 함수만 호출.

## 7. 가입해도 세션이 안 생겨 이후 단계 진행 불가
- **문제점**: `signUp` 직후 세션이 `null`이라 프로필 저장(RLS는 `auth.uid()` 필요)이 불가능. E2E 검증이 첫 단계에서 멈춤.
- **원인**: Supabase의 **Confirm email**(이메일 인증)이 켜져 있으면 가입만 되고, 메일 링크를 눌러야 세션이 생긴다. 무료 플랜 기본 메일은 시간당 발송 수 제한이 있어 방문자 가입에도 부적합.
- **해결방법**: 데모용으로 대시보드에서 Confirm email을 끔(결정과 이유는 `dev-log.md` 39번, `project-draft.md`). 코드에서는 세션이 없으면 `needsEmailConfirm`으로 안내하는 분기를 남겨, 나중에 다시 켜도 동작하게 함. 실서비스 전환 시 자체 SMTP 연결 후 재활성화(미해결).
- **교훈**: 테스트 계정은 실제로 메일이 가지 않는 예약 도메인(`@example.com`)만 쓴다. 실제 존재할 수 있는 주소로 가입 요청을 보내면 제3자에게 메일이 갈 수 있다.

## 8. CLI 로그인이 터미널 환경에 따라 실패
- **문제점 (a)**: `supabase login`이 `Cannot use automatic login flow inside non-TTY environments`로 실패.
  - **원인**: 브라우저 인증은 대화형 터미널이 필요한데, 자동 실행 환경(non-TTY)에는 없다.
  - **해결방법**: 사용자가 직접 연 터미널에서 로그인. 로그인 정보는 PC에 저장돼 이후 자동 실행에서도 쓸 수 있다.
- **문제점 (b)**: PowerShell에서 `npx`가 `이 시스템에서 스크립트를 실행할 수 없으므로 npx.ps1 …` (PSSecurityException)로 실패.
  - **원인**: Windows PowerShell 실행 정책이 `.ps1` 스크립트 실행을 막음.
  - **해결방법**: 정책을 바꾸지 않고 `npx.cmd`(또는 `.\node_modules\.bin\supabase.cmd`)를 사용.
- **보안 메모**: 액세스 토큰은 채팅·로그에 붙여 넣지 않는다. 노출됐다면 즉시 대시보드에서 폐기(Revoke)하고 토큰 없이 대화형 로그인을 쓴다.
