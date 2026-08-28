# auth

온보딩(계정 생성 → 프로필 입력 → MBTI 선택 → 일주 결과 확인) + 로그인을 담당하는 도메인.

- `screens/` — 온보딩 4단계 화면
- `components/` — 이 도메인 전용 UI (다른 도메인에서 import 금지, 공용이면 `shared/`로)
- `hooks/` — 온보딩/로그인 관련 상태·로직
- `api.ts` — Supabase 인증 API 호출 (`{ data, error }` 패턴)
- `schema.ts` — zod 폼 검증 스키마

구조 결정 배경은 `project-draft.md`의 "리포지토리 구조" 참고.
