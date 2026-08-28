# shared

여러 도메인이 공용으로 쓰는 것.

- `components/` — 버튼, 뱃지 등 공용 UI + Expo 기본 템플릿 컴포넌트 (`themed-text.tsx` 등). ErrorBoundary, Toast는 아직 미구현
- `hooks/`, `constants/` — Expo 기본 템플릿에서 옮겨온 테마/색상 관련 훅
- `lib/supabase.ts` — Supabase 클라이언트 설정 (아직 미구현, Supabase 프로젝트 생성 후 추가 예정)

구조 결정 배경은 `project-draft.md`의 "리포지토리 구조" 참고.
