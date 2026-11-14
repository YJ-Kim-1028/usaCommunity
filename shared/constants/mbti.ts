// MBTI 16가지. 가입(auth)과 정보 수정(profile) 두 곳에서 같이 쓰므로 공용(shared)에 둔다.
// 도메인(feature)끼리는 서로 직접 import하지 않는 규칙이 있어서, 둘이 공유하는 값은 여기에 둔다.
export const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
] as const;

export type MbtiType = (typeof MBTI_TYPES)[number];
