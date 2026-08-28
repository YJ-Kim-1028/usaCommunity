# 서버/백엔드 아키텍처 초안

유사과학 커뮤니티 (가제) — 클라이언트(앱)가 아닌, 우리가 통제하는 서버 쪽에서 도는 코드/구조를 정리하는 문서. `project-draft.md`(제품 스펙)와 `dev-log.md`(진행 이력)와는 별개로, "서버 아키텍처"만 따로 모아두는 곳.

## 기본 개념 — 클라이언트 vs 서버

- **클라이언트** = 사용자 손 안에서 도는 코드. 우리 경우 React Native 앱(휴대폰)과, 앞으로 만들 웹 관리자 페이지(브라우저)도 클라이언트임. 클라이언트 안의 코드는 마음만 먹으면 누구나 뜯어볼 수 있다고 가정해야 함 — 그래서 클라이언트엔 "공개돼도 되는 키"(publishable/anon key)만 넣고, "모든 걸 열 수 있는 마스터키"(service_role key)는 절대 넣지 않음
- **서버** = 사용자 손이 안 닿는, 우리만 통제하는 곳에서 도는 코드. Supabase의 **Edge Function**이 이 역할 — Supabase 클라우드에서 우리 대신 코드를 돌려주고, 여기엔 service_role 같은 민감한 키를 환경변수(secret)로 안전하게 숨겨둘 수 있음

## 왜 필요한가 (은행 창구 비유)

- 손님(웹 관리자 페이지)이 직접 금고 열쇠(service_role)를 들고 다니면 위험함
- 대신 손님은 **신분증(로그인)**만 보여주고
- **창구 직원(Edge Function)**이 신분증 확인해서 "이 사람 관리자 명단(`admins` 테이블)에 있네" 확인한 다음
- 자기가 갖고 있는 **금고 열쇠(service_role)**로 대신 데이터를 꺼내서 필요한 것만 건네줌
- 손님(웹페이지)은 금고 열쇠를 절대 손에 안 쥠 — 이게 핵심

## 운영자 화면 요청 흐름

1. 운영자가 웹 관리자 페이지에서 본인 계정으로 로그인 (일반 로그인과 동일, 다만 이 계정이 `admins` 테이블에 등록돼 있어야 함)
2. 관리자 페이지가 "이 유저 신고 이력 보여줘" 같은 요청을 Edge Function에 보냄 (로그인 토큰 같이 전달)
3. Edge Function이 "이 토큰 주인이 진짜 admins에 있나?" 확인 (호출자 권한으로 안전하게 체크 가능 — RLS가 지켜줌)
4. 맞으면 → Edge Function이 service_role로 대신 `moderation_user_overview`/`moderation_reported_posts` 뷰(`platform/db/0005_admin_and_moderation_views.sql`)를 조회해서 결과만 돌려줌
5. 아니면 → 거절

## 결정된 것

- **운영자 화면은 앱 안이 아니라 별도 웹 관리자 페이지로 만든다** (2026-08-28 결정)
  - 이유: 일반 유저 앱과 운영 도구를 분리하는 게 실수로 관리 기능이 일반 유저에게 노출될 위험을 원천 차단하고, 운영자는 어차피 컴퓨터로 작업할 가능성이 높음

## 아직 미정 — 다음에 정할 것

- [ ] 웹 관리자 페이지 기술 스택 확정 (Next.js 유력 후보 — 프론트와 같은 React+TypeScript라 학습 부담 적음)
- [ ] 호스팅 어디에 할지 (Vercel 등)
- [ ] 운영자 확인 + service_role 위임하는 Edge Function 실제 코드 작성
- [ ] 웹 관리자 페이지 화면 설계 (와이어프레임)

## 선택 검증 (2026-08-28, 웹 조사)

Next.js 후보를 정한 뒤 2026년 기준 프레임워크 동향을 조사함 — 결론: 그대로 가도 되는 선택.

- **Next.js**: "인터랙티브한 앱"(데이터 조회/조작 중심) 영역에서 여전히 표준. 우리 관리자 페이지가 정확히 이 유형. 경쟁이었던 Remix는 React Router에 흡수됐고, Astro는 Cloudflare에 인수돼 콘텐츠 위주 사이트 쪽으로 감 — 둘 다 우리 용도와는 다른 영역이라 Next.js가 여전히 맞는 선택
- **Edge Function**: 엣지 컴퓨팅이 2026년 표준 배포모델. Supabase Edge Function은 Deno Deploy 기반이라 콜드스타트가 거의 없어서, DB/Auth를 이미 Supabase로 쓰는 우리 프로젝트엔 별도 인프라 없이 자연스럽게 맞음
- 트렌드를 좇아서 고른 게 아니라, 먼저 고른 선택이 트렌드와 맞아떨어진 것 — 포트폴리오에서 "왜 이 스택인지" 설명할 근거로 남겨둠
  - 출처: [Next.js vs Remix vs Astro vs SvelteKit in 2026](https://dev.to/pockit_tools/nextjs-vs-remix-vs-astro-vs-sveltekit-in-2026-the-definitive-framework-decision-guide-lp5), [Supabase Edge Functions: Complete Guide (2026)](https://blog.starmorph.com/blog/about-supabase-edge-functions)

## 참고 — 이미 계획에 있던 다른 Edge Function 용도

- 일주 계산: 가입 시 `@fullstackfamily/manseryeok`을 Edge Function에서 실행 (`project-draft.md`의 "일주 계산 방식" 참고) — 이건 관리자 인증이 필요 없는 별개의 Edge Function
