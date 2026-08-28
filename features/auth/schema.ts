import { z } from 'zod';

export const accountSchema = z.object({
  email: z.string().min(1, '이메일을 입력해주세요').email('이메일 형식이 올바르지 않아요'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 해요'),
  passwordConfirm: z.string(),
  agreedTerms: z.literal(true, { message: '이용약관에 동의해주세요' }),
  agreedPrivacy: z.literal(true, { message: '개인정보처리방침에 동의해주세요' }),
  agreedAge: z.literal(true, { message: '만 14세 이상만 가입할 수 있어요' }),
}).refine((data) => data.password === data.passwordConfirm, {
  message: '비밀번호가 일치하지 않아요',
  path: ['passwordConfirm'],
});

export type AccountFormData = z.infer<typeof accountSchema>;

export const profileSchema = z.object({
  nickname: z.string().min(2, '닉네임은 2자 이상이어야 해요').max(12, '닉네임은 12자 이하여야 해요'),
  gender: z.enum(['female', 'male'], { message: '성별을 선택해주세요' }),
  birthYear: z.string().regex(/^\d{4}$/, 'YYYY 형식으로 입력해주세요'),
  birthMonth: z.string().regex(/^(0?[1-9]|1[0-2])$/, 'MM 형식으로 입력해주세요'),
  birthDay: z.string().regex(/^(0?[1-9]|[12]\d|3[01])$/, 'DD 형식으로 입력해주세요'),
  birthHour: z.string().optional(),
  birthMinute: z.string().optional(),
  photoUri: z.string().optional(),
});

export type ProfileFormData = z.infer<typeof profileSchema>;
