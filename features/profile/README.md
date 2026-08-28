# profile

마이프로필(뱃지, 내가 쓴 글/댓글) 화면을 담당하는 도메인.

- `screens/` — 프로필 화면
- `components/` — 이 도메인 전용 UI (다른 도메인에서 import 금지, 공용이면 `shared/`로)
- `hooks/` — 프로필 데이터 관련 상태·로직
- `api.ts` — Supabase 프로필 API 호출 (`{ data, error }` 패턴)

구조 결정 배경은 `project-draft.md`의 "리포지토리 구조" 참고.
