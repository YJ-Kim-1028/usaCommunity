# feed

메인 피드, 게시글 상세, 댓글/대댓글, 신고를 담당하는 도메인.

- `screens/` — 피드, 게시글 상세 화면
- `components/` — 이 도메인 전용 UI (다른 도메인에서 import 금지, 공용이면 `shared/`로)
- `hooks/` — 게시글/댓글 목록·필터 관련 상태·로직
- `api.ts` — Supabase 게시글/댓글 API 호출 (`{ data, error }` 패턴)

구조 결정 배경은 `project-draft.md`의 "리포지토리 구조" 참고.
