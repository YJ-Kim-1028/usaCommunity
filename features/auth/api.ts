import { uploadAvatar } from '@/lib/avatar';
import { supabase } from '@/lib/supabase';

import type { OnboardingData } from './hooks/useOnboarding';

export type AuthResult =
  | { ok: true; needsEmailConfirm: boolean }
  | { ok: false; message: string };

function friendlyMessage(raw: string): string {
  const msg = raw.toLowerCase();
  if (msg.includes('invalid login credentials')) return '이메일 또는 비밀번호가 올바르지 않아요';
  if (msg.includes('email not confirmed')) return '이메일 인증을 먼저 완료해주세요';
  if (msg.includes('already registered')) return '이미 가입된 이메일이에요';
  if (msg.includes('rate limit')) return '요청이 너무 많아요. 잠시 후 다시 시도해주세요';
  if (msg.includes('password')) return '비밀번호가 올바르지 않아요';
  return '문제가 생겼어요. 잠시 후 다시 시도해주세요';
}

export async function signIn(email: string, password: string): Promise<AuthResult> {
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  if (error) return { ok: false, message: friendlyMessage(error.message) };
  return { ok: true, needsEmailConfirm: false };
}

const pad = (value: string) => value.padStart(2, '0');

/**
 * 회원가입 + 프로필 생성.
 * profiles(공개 정보)와 profile_private(생년월일·성별)는 테이블이 분리돼 있어 둘 다 채운다.
 * 일주(ilju)는 생년월일에서 계산한 값을 가입 시점에 공개 테이블에 저장한다(생년월일이 비공개라 다른 유저가 계산할 수 없기 때문).
 */
export async function signUp(data: OnboardingData, ilju: string): Promise<AuthResult> {
  if (!data.gender || !data.mbti) {
    return { ok: false, message: '입력하지 않은 항목이 있어요. 이전 단계를 확인해주세요' };
  }

  let { data: auth, error } = await supabase.auth.signUp({ email: data.email.trim(), password: data.password });

  // 이전에 가입만 되고 프로필 생성이 실패한 계정이면, 로그인해서 프로필 생성을 이어 간다
  if (error && error.message.toLowerCase().includes('already registered')) {
    const retry = await supabase.auth.signInWithPassword({ email: data.email.trim(), password: data.password });
    if (retry.error) return { ok: false, message: friendlyMessage(error.message) };
    auth = { user: retry.data.user, session: retry.data.session };
    error = null;
  }
  if (error) return { ok: false, message: friendlyMessage(error.message) };

  // 이메일 인증이 켜져 있으면 세션이 없다 → 인증 후 로그인하도록 안내
  if (!auth.session || !auth.user) return { ok: true, needsEmailConfirm: true };

  const userId = auth.user.id;
  const { error: profileError } = await supabase.from('profiles').upsert({
    id: userId,
    nickname: data.nickname.trim(),
    mbti: data.mbti,
    ilju,
  });
  if (profileError) return { ok: false, message: '프로필을 저장하지 못했어요. 같은 정보로 다시 시도해주세요' };

  const birthDate = `${data.birthYear}-${pad(data.birthMonth)}-${pad(data.birthDay)}`;
  const birthTime = data.birthHour ? `${pad(data.birthHour)}:${pad(data.birthMinute || '0')}` : null;
  const { error: privateError } = await supabase.from('profile_private').upsert({
    user_id: userId,
    gender: data.gender,
    birth_date: birthDate,
    birth_time: birthTime,
  });
  if (privateError) return { ok: false, message: '프로필을 저장하지 못했어요. 같은 정보로 다시 시도해주세요' };

  // 가입 화면에서 고른 사진이 있으면 올린다. 실패해도 가입은 성공으로 두고, 나중에 정보 수정에서 올릴 수 있다.
  if (data.photoUri) await uploadAvatar(userId, data.photoUri);

  return { ok: true, needsEmailConfirm: false };
}
