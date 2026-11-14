import { z } from 'zod';

import { MBTI_TYPES } from '@/constants/mbti';

// 내 정보 수정에서 고칠 수 있는 항목의 규칙. 가입 때의 닉네임 규칙과 같다(2~12자).
// 같은 규칙이 DB에도 걸려 있다(profiles_nickname_length). 화면의 검사는 사용자를 돕는 것이고, DB가 마지막 방어선이다.
export const NICKNAME_MIN = 2;
export const NICKNAME_MAX = 12;

export const profileEditSchema = z.object({
  nickname: z
    .string()
    .trim()
    .min(NICKNAME_MIN, `닉네임은 ${NICKNAME_MIN}자 이상이어야 해요`)
    .max(NICKNAME_MAX, `닉네임은 ${NICKNAME_MAX}자 이하여야 해요`),
  mbti: z.enum(MBTI_TYPES, { message: 'MBTI를 선택해주세요' }),
});

export type ProfileEditData = z.infer<typeof profileEditSchema>;
