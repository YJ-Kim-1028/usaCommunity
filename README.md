# 아브라카다브라

MBTI와 일주(사주)로 이야기를 나누는 커뮤니티 웹 앱입니다. React Native(Expo)와 Supabase로 만들었고, 서버를 따로 두지 않고 접근 제어·도배 방지·입력 제한을 DB 규칙으로 처리합니다.

## 주요 기능

- 가입·로그인, 게시판별 피드, 글·댓글·대댓글, 좋아요, 신고
- 내 MBTI·내 일주로 글 필터, 인기글, 검색
- 내 정보 수정, 프로필 사진
- 반응형 화면과 다크 모드

## 기술 스택

React Native · Expo Router · TypeScript · Supabase(PostgreSQL, Auth, Storage) · zod · Jest · GitHub Actions

## 실행 방법

1. 의존성 설치

   ```bash
   npm install
   ```

2. 루트에 `.env.development`를 만들고 Supabase 프로젝트 값을 넣습니다(형식은 `.env.example` 참고).

   ```
   EXPO_PUBLIC_SUPABASE_URL=<프로젝트 주소>
   EXPO_PUBLIC_SUPABASE_ANON_KEY=<anon 키>
   ```

3. DB 적용 (Supabase CLI)

   ```bash
   npx supabase link
   npx supabase db push
   ```

4. 실행

   ```bash
   npx expo start --web
   ```

개발 중에는 Supabase 대시보드에서 이메일 확인(Confirm email)을 끄면 가입 직후 바로 로그인됩니다.

## 테스트

```bash
npm test             # Jest
npx tsc --noEmit     # 타입 검사
```

DB 규칙은 `supabase/tests/*.sql`로 실제 DB에서 검증합니다(가짜 사용자로 실행한 뒤 모두 되돌림). 푸시할 때마다 GitHub Actions가 타입 검사와 Jest를 실행합니다.

## 더 보기

- [`project-draft.md`](project-draft.md): 확정된 스펙과 결정 이유
- [`test.md`](test.md): 테스트 방법과 발견한 버그
- [`troubleshooting.md`](troubleshooting.md): 오류 → 원인 → 해결 기록
- [개발 블로그](https://blog.naver.com/code11298/224477384836)
