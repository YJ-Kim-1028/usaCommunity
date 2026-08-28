# 개발 로그 / 다음 계획

유사과학 커뮤니티 (가제, 현재 컨셉: MBTI × 일주) — 진행 순서 기록용 문서. 최신 항목이 위로 오게 정리.

## 완료

1. **아이디어 확정** — 집 평점 앱 보류 → MBTI×일주 그룹형 커뮤니티로 방향 결정 (`project-draft.md` 참고)
2. **게시판 구조 결정** — 정체성 기반 게시판 분리 대신 토픽 기반 메인 게시판 + 프로필 뱃지/필터 방식으로 결정
3. **MVP 기능 범위 확정** — 회원가입, 토픽 게시판+필터, 글쓰기/댓글, 신고, 알림
4. **온보딩 입력 항목 확정** — 이메일(인증 필수), 닉네임, 성별(필수), 생년월일+시간, 프로필 사진(선택), 약관 동의 전체 필수
5. **온보딩 와이어프레임 제작** — 계정 생성 → 프로필 입력 → MBTI 선택 → 일주 결과 확인, 4단계 모바일 와이어프레임
   ([캔버스 링크](https://claude.ai/code/artifact/5bb30111-fe0c-4e23-9c53-fb10eb7aad56))
6. **git 저장소 초기화** — 로컬 저장소 생성, 초안 문서 버전관리 시작
7. **프로젝트 가제 결정** — "유사과학 커뮤니티"로 가제 확정 (현재 컨셉은 MBTI × 일주)

8. **나머지 화면 와이어프레임** — 메인 피드(토픽 탭+필터+글목록), 게시글 상세(댓글/대댓글/신고), 프로필(뱃지+내 글 목록). 온보딩과 같은 캔버스에 "메인 앱" 페이지로 추가
   ([캔버스 링크](https://claude.ai/code/artifact/5bb30111-fe0c-4e23-9c53-fb10eb7aad56))
9. **일주 계산 API 검증** — Ablecity/SAZU/운세위키 3개 모두 실존 확인, 무료 티어·응답속도·문서 품질 비교했으나 가입자 수 비례 비용 문제로 **셋 다 기각**
10. **일주 계산 방식 최종 결정** — 오픈소스 라이브러리(`@fullstackfamily/manseryeok`)로 자체 계산. 외부 링크로 수동 입력받는 방식도 검토했으나 온보딩 이탈/입력 신뢰성 문제로 기각, 자동 계산 유지
11. **기술 스택 1차 결정** — React Native + Expo / Supabase(DB·인증·스토리지) / manseryeok(Edge Function) / Expo Notifications
12. **메인 피드 화면 보완** — "지금 인기있는 글" 섹션 추가, 게시글 카드에 컬러 아바타 톤 적용 (커뮤니티 느낌 강화)
    ([캔버스 링크](https://claude.ai/code/artifact/5bb30111-fe0c-4e23-9c53-fb10eb7aad56))
13. **리포지토리 구조 확정** — 기능별(데이터팀/인프라팀식) 조직도 검토했으나, 지금 규모엔 관리할 인프라가 없고 과거 권한 문제로 불편했던 경험도 있어 **도메인별(features/auth, feed, profile) 구조**로 결정. 도메인 간 직접 import 금지 규칙 적용
14. **예외처리 방침 확정** — API 에러(`features/*/api.ts`), 폼 검증(`schema.ts`), Error Boundary/Toast(`shared/`), 크래시 모니터링(`platform/monitoring.ts`)로 레이어별 분리
15. **배포/운영 전략 수립** — 환경 분리(dev/prod), 브랜치 전략, CI/CD(GitHub Actions+EAS Build), EAS Submit/Update, Secrets 관리 방침을 실무 방식으로 미리 정리
16. **환경 개수/리전 확정** — Supabase 무료 티어가 계정당 활성 프로젝트 2개까지라 dev/prod 2개로 결정(stg는 나중에), 리전은 서울(ap-northeast-2)
17. **보안/개인정보보호 점검** — RLS+키 분리+서울 리전 등 기술적 기본기는 정리했으나, 개인정보처리방침 문서화·파기정책·국외이전 고지 여부는 **아직 미해결**로 확인. 처음엔 "출시 전 점검"으로 남겨뒀다가, 실유저 받을 때 문제 되는지 재확인한 결과 **선택이 아니라 법적 의무**로 확인 — 우선순위를 "실제 유저 받기 전 필수 선행 작업"으로 격상
18. **왜 국외(Supabase)를 쓰는지 근거 보강** — 자체 호스팅(24시간 운영 불가/장애 위험)과 국내 클라우드(인증·DB·스토리지 통합 서비스 부재로 개발기간 급증) 대안을 검토 후 기각, 서울 리전 Supabase가 "물리적 국내 저장 + 개발속도" 절충점이라는 이유를 문서에 명시
19. **초기 프로젝트 세팅 완료** — `npx create-expo-app`으로 스캐폴딩(Node.js v24.11.1 확인 후 진행) → 최신 템플릿의 `src/app` 구조를 우리가 정한 `app/`·`shared/`·`features/`·`platform/` 루트 구조로 재배치 → `tsconfig.json` 경로 별칭·`package.json`/`app.json` 프로젝트명 정리 → `features/*`, `platform/`, `shared/`에 도메인 안내 README 추가 → 타입체크(`tsc --noEmit`)·`expo-doctor`(21/21) 통과, `expo start --web` 로컬 구동 확인
20. **CLAUDE.md에 프로젝트 규칙 명문화** — (1) 결정/작업 시 항상 `project-draft.md`(스펙+이유) / `dev-log.md`(이력) 갱신 (2) 사용자 요청 전 커밋 금지 (3) **비용 발생 작업은 절대 임의 진행 금지, 불가피 시 먼저 보고·승인받고 진행** — 앞으로 이 저장소에서 작업하는 모든 세션이 자동으로 따르도록 문서화
21. **와이어프레임 → 실제 화면 구현 완료** — 온보딩 4단계 + 피드/게시글 상세/프로필 총 7개 화면을 React Native 코드로 포팅.
    - `zod`, `react-native-svg`, `expo-image-picker`, `@fullstackfamily/manseryeok` 설치
    - `shared/components`에 Badge, PrimaryButton, StepHeader, Avatar, ErrorBoundary, ComingSoon 등 공용 컴포넌트 작성, Expo 데모 보일러플레이트(explore.tsx, app-tabs 등)는 삭제
    - 일주는 실제로 `getGapja()`로 생년월일 기반 자동 계산 (하드코딩 아님) — 브라우저 테스트에서 1998-05-15 → "임술일주" 정상 계산 확인
    - 프로필 사진은 `expo-image-picker`로 실제 동작
    - 피드/댓글/프로필은 Supabase 연동 전이라 `features/feed/mockData.ts` 목업 데이터 사용 (TODO 주석으로 표시)
    - `app/(tabs)/`는 4탭(홈·게시판·알림·마이) 중 홈/마이만 실제 구현, 게시판/알림은 아직 와이어프레임이 없어 `ComingSoon` 플레이스홀더로 정직하게 표시
    - **버그 발견 및 수정**: `app/(tabs)/index.tsx`와 루트 `app/index.tsx`가 둘 다 URL "/"를 가리켜 충돌 → 브라우저 테스트 중 "Unmatched Route" 404 확인 → `(tabs)/index.tsx`를 `(tabs)/feed.tsx`로 이름 변경해서 해결
    - Chrome 브라우저로 전체 플로우(가입→프로필→MBTI→일주결과→피드→게시글상세→프로필탭→게시판탭) 직접 클릭 테스트, 콘솔 에러 없음 확인. `tsc --noEmit`, `expo-doctor`(21/21) 통과
22. **랜딩(Welcome)/로그인 화면 추가** — 앱 첫 진입 시 가입 화면으로 바로 넘어가던 것을 지적받아, 타이틀+태그라인+"회원가입"/"로그인" 버튼이 있는 랜딩 화면을 루트("/")에 추가. 로그인 화면(`features/auth/screens/Login.tsx`)도 신규 작성 (Supabase 연동 전이라 로그인은 아직 mock)
    - **버그 발견 및 수정**: 랜딩 화면의 "로그인" 버튼이 `View`+`onTouchEnd`로 구현돼서 웹 마우스 클릭에 반응 안 함 → `Pressable`+`onPress`로 교체
23. **테스트 기록 문서(`test.md`) 신설** — 테스트 방법(정적검사→로컬구동→브라우저 클릭테스트→콘솔확인)과 지금까지 발견한 버그 2건을 기록. `CLAUDE.md`에도 앞으로 테스트/버그 발견 시 이 문서를 갱신하라는 규칙 추가
24. **GitHub 원격 저장소 연결 및 첫 push** — `https://github.com/YJ-Kim-1028/usaCommunity`에 원격 연결. 그동안 쌓인 작업을 기능별로 10개 커밋(스캐폴딩/문서/와이어프레임/공용컴포넌트/앱셸/auth/feed/profile 등)으로 나눠서 push 완료. 이유: CI/CD(GitHub Actions)를 실제로 쓰려면 원격 저장소가 필요하고, 로컬 컴퓨터에만 있으면 백업이 안 됨
25. **Supabase 프로젝트 생성 및 클라이언트 연결** — 사용자가 직접 Organization(Free)·Project(Seoul 리전) 생성, Data API 활성화(자동 테이블 노출은 끔, 자동 RLS는 켬 — 우리 보안 방침과 일치). `@supabase/supabase-js` 등 설치, `shared/lib/supabase.ts` 클라이언트 작성. Project URL/publishable key는 `.env.development`에 저장(git 추적 제외, `.env.example`만 커밋). 앱 재구동해서 정상 로드 확인 — 단, 아직 실제 회원가입/로그인/게시글 API는 mock 그대로라 실질적인 데이터 연동은 다음 단계
26. **DB 스키마 설계 (`platform/db/0001_init_schema.sql`)** — profiles/profile_private/posts/comments/likes/reports 5개 테이블 + RLS 정책 작성.
    - **핵심 설계 결정**: 생년월일/성별처럼 민감한 정보(`profile_private`)와 공개해도 되는 정보(`profiles`: 닉네임/MBTI/일주/사진)를 테이블로 분리 — 다른 유저는 `profile_private`를 아예 못 읽게 정책을 안 만듦
    - **정규화 관련 질문에 답하며 보강**: `ilju`는 `birth_date`에서 계산되는 파생값이라 교과서적으로는 중복 저장이지만, 생년월일이 비공개라 다른 유저가 계산할 방법이 없어서 가입 시 계산해 공개 테이블에 저장하는 게 맞는 선택 — 의도적 비정규화. 외래키 컬럼들에 인덱스 추가, `reports`에 "post_id/comment_id 중 정확히 하나만" 제약 추가
    - 라이브 DB에 직접 실행하지 않고 SQL 파일로 만들어서 사용자가 Supabase SQL Editor에서 직접 실행하도록 안내 (실행 결과 확인 대기 중)
27. **`posts.topic`을 고정 check 제약 → `topics` 테이블로 변경** — 처음엔 4개 고정값이라 check 제약으로 단순화했으나, "1인이라도 팀 스타일로 설계하자"는 피드백을 받아 관리자가 나중에 토픽을 늘릴 수 있게 `topics` 테이블(slug/name/sort_order)로 분리하고 초기 4개 값은 seed insert로 넣음. `posts.topic_id`가 이 테이블을 참조. 토픽 추가/수정은 앱에서 못 하게(정책 없음) 하고 대시보드에서 운영자가 직접 관리 — 나중에 관리자 화면 생기면 그때 정책 추가
28. **"연예" 토픽 추가** — `topics` 테이블로 분리해둔 덕분에 스키마 변경 없이 새 마이그레이션 파일(`0002_add_entertainment_topic.sql`)로 데이터만 추가. Feed 화면의 토픽 탭 UI도 동기화
29. **모더레이션 설계 보강 (`0003_report_status_and_soft_delete.sql`)** — 일반적인 커뮤니티 플랫폼의 신고/모더레이션 DB 패턴을 웹에서 조사한 뒤, 기존 설계에서 빠진 것 3개를 확인하고 추가:
    - **⚠️ 결함 수정**: `reports.post_id`가 `on delete cascade`라 신고당한 유저가 글을 삭제하면 신고 기록까지 같이 사라지는 문제 발견 → `posts`/`comments`에 `deleted_at`(soft delete) 컬럼 추가, 앱에서 "삭제"는 실제 DELETE 대신 UPDATE로 처리하도록 변경, RLS SELECT 정책에서 `deleted_at is null` 조건 추가
    - `reports`에 `status`(pending/resolved/dismissed) · `reviewed_by` · `resolved_at` · `action_note` 추가 — 신고 처리 여부/방식을 추적 가능하게 함
    - `reports.reported_user_id` 추가 — 게시글/댓글뿐 아니라 유저 자체(예: 부적절한 프로필)도 신고 가능하게, 제약조건도 "셋 중 정확히 하나"로 확장
    - **일부러 안 만든 것**: 유저 정지/뮤트 전용 테이블 — 실제 유저가 생기고 모더레이션이 필요해지는 시점에 추가하기로 결정 (지금은 쓸 사람이 없는 인프라라 과설계로 판단)
30. **위 결정 재검토 — 유저 정지/뮤트를 지금 만들기로 변경** — "유저 받기 전에 다 설계해놓는 게 안전하지 않냐"는 지적을 받고 재검토: 신고 기능이 있어도 실제 제재 수단이 없으면 반쪽짜리이고, 테이블 하나 추가하는 비용도 크지 않아서 판단을 바꿈. `0004_user_sanctions.sql`로 `user_sanctions` 테이블(만료시각 있는 뮤트/정지, report와 연결 가능) 추가. 본인은 자기 제재 상태를 읽을 수 있고, 부여/해제는 앱에서 불가(운영자가 대시보드에서 직접)
    - **조사 결과 중 제가 처음에 누락하고 말 안 했던 것 2개도 이때 짚어서 보완**: (1) "신고-조치 분리"가 표준 패턴인데 별도 `moderation_actions` 테이블 대신 `reports.action_note`로 단순화한 건 제 임의 판단이었음을 명시 (2) soft delete(신고 증거 보존용)와 "회원 탈퇴 시 법적 파기"(진짜 삭제/익명화 필요)는 서로 다른 문제라는 것 — 나중에 탈퇴 기능 구현 시 반드시 구분해서 처리해야 함
31. **정지 기간 고정 옵션화 + 운영자 요약 뷰 + 새로운 설계 공백 발견** — 사용자가 요구사항 구체화(정지 기간은 자유입력이 아니라 1주/2주/1개월/3개월/영구 중 선택, 운영자가 "건바이건"이 아니라 유저 단위로 신고횟수·제재이력·신고받은 게시글 전체를 한번에 봐야 함)를 주면서, **운영자용 화면이 지금까지 하나도 설계되지 않았다는 걸 발견**.
    - `0004_user_sanctions.sql` 수정: `duration` 컬럼(고정 옵션) 추가, `expires_at`과 일관성 체크 제약 추가
    - `0005_admin_and_moderation_views.sql` 신규: `admins` 테이블(운영자 명단, 앱에서 자가등록 불가) + `moderation_user_overview`/`moderation_reported_posts` 뷰 2개
    - **핵심 보안 포인트**: Postgres 뷰는 기본적으로 RLS를 우회함(만든 사람 권한으로 실행) — 그래서 이 뷰들은 `authenticated`/`anon` 롤 접근 권한을 아예 회수(revoke)함. 즉 **운영자 화면은 클라이언트가 이 뷰를 직접 조회하면 안 되고, Edge Function이 관리자 여부를 먼저 확인한 뒤 service_role로 대신 조회해주는 구조가 필요** — 이건 아직 설계 안 됨
    - **새로 확정된 공백**: 운영자(관리자) 화면 자체가 와이어프레임도, 아키텍처(Edge Function 등)도 전혀 없는 상태. 별도로 논의/설계 필요
32. **`server-draft.md` 신설 + 운영자 웹 관리자 방향 확정** — 클라이언트/서버 개념, Edge Function이 왜 필요한지(은행 창구 비유), 운영자 요청 흐름을 문서화. **운영자 화면은 앱 안이 아니라 별도 웹 관리자 페이지로 만들기로 결정** (관리 기능이 일반 유저 앱에 실수로 노출될 위험을 원천 차단). 기술 스택은 Next.js 유력 후보로 남겨둠 (확정 아님)
33. **Next.js/Supabase 선택 검증 (웹 조사)** — 2026년 기준 서버 기술 동향을 조사해서 이미 고른 스택이 여전히 타당한지 확인. Supabase(BaaS 표준으로 자리잡음, Firebase보다 대규모 시 3~5배 저렴), Next.js(인터랙티브 앱 영역 표준 유지), Supabase Edge Function(콜드스타트 거의 없음) 모두 트렌드에 부합 — 검증 근거를 출처와 함께 `project-draft.md`/`server-draft.md`에 기록 (포트폴리오에서 "왜 이 스택인지" 설명 근거)

34. **DB 마이그레이션 관리 도구로 Supabase CLI 채택** — 지금까지 SQL 파일을 대시보드에 수동 복사-붙여넣기 하던 방식이 "실무에서도 이렇게 하냐"는 질문을 계기로, 공식 CLI 도입을 검토·채택. Prisma/Drizzle 같은 ORM은 이미 정한 `@supabase/supabase-js`와 중복돼서 기각, CLI는 마이그레이션 자동화 + 적용 이력 추적 + TypeScript 타입 자동생성만 담당하는 도구라 기존 결정과 안 부딪힘. 마이그레이션 파일 위치를 `platform/db/`에서 CLI 표준 위치(`supabase/migrations/`)로 이동 예정

## 다음 단계 — 개발 (⭐ = 내일 여기서부터)

- [ ] ⭐ `npx supabase login` (사용자가 직접, 브라우저 인증) → 완료되면 이어서: 프로젝트 연결(`supabase link --project-ref aampiuxluizjwplexvxx`, DB 비밀번호 필요할 수 있음, 노션에 저장해둔 것 준비) → `supabase db push`로 마이그레이션 5개 실제 적용. CLI 설치·init·마이그레이션 파일 `supabase/migrations/` 이동까지는 완료된 상태
- [ ] **운영자 웹 관리자 페이지** — 기술 스택 확정(Next.js), 호스팅 결정, Edge Function 작성, 화면 설계(`server-draft.md` 참고)
- [ ] 회원가입/로그인/게시글/댓글 API를 mock에서 실제 Supabase 호출로 교체
- [ ] 게시판/알림 탭 와이어프레임 및 구현 (지금은 ComingSoon 플레이스홀더)

## 다음 단계 — 법적 서류 (실유저 받기 전 필수, "기술 보안"과 별개)

- [ ] 개인정보처리방침 작성·게시 (개인정보보호위원회 표준 템플릿 기반)
- [ ] 회원 탈퇴 시 개인정보 파기 로직 구현 및 방침 명시 — ⚠️ soft delete(글/댓글의 `deleted_at`)로는 안 됨, 개인정보(profile_private 등)는 실제로 삭제/익명화해야 함. 단, 탈퇴자가 쓴 게시글/댓글 본문까지 진짜로 지울지, 작성자 표시만 "탈퇴한 사용자"로 바꾸고 글은 남길지는 별도 결정 필요
- [ ] 개인정보처리방침의 "국외 이전" 항목을 Supabase/AWS 정보로 정확히 작성 (별도 동의 화면은 불필요할 가능성 높음, 2023 개정법상 계약이행 예외 적용)

## 메모

- 커밋은 사용자가 명시적으로 요청할 때만 진행 (자동 커밋 금지)
- **결정을 기록할 때는 항상 이유(사유)도 같이 남긴다** — 나중에 왜 그렇게 했는지 판단하려면 결과만으론 부족해서, 이유까지 있어야 재검토/설명이 가능
- **비용 발생 작업은 절대 임의로 진행하지 않는다** — 불가피할 땐 먼저 사용자에게 보고하고 허락받은 후에만 진행 (`CLAUDE.md` 참고)
