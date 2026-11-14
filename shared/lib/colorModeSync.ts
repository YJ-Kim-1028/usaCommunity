import { Platform } from 'react-native';

import { getStoredColorMode, planSync, setColorMode, type ColorMode } from '@/lib/colorMode';
import { supabase } from '@/lib/supabase';

// 화면 모드(밝게/어둡게) 선택을 계정에 저장하고, 로그인할 때 불러온다.
// 저장 위치는 본인만 읽을 수 있는 profile_private.color_mode (null = 기기 설정을 따름).
// 서버 저장이 실패해도(열이 아직 없거나 네트워크 문제) 앱은 이 기기 저장만으로 계속 동작한다.

export async function saveColorMode(userId: string, mode: ColorMode): Promise<void> {
  const { error } = await supabase.from('profile_private').update({ color_mode: mode }).eq('user_id', userId);
  if (error) console.warn('화면 모드를 계정에 저장하지 못했어요', error.message);
}

/** 로그인 직후 한 번: 계정에 저장된 값과 이 기기의 값을 맞춘다(규칙은 planSync) */
export async function syncColorModeOnLogin(userId: string): Promise<void> {
  if (Platform.OS !== 'web') return;
  const { data, error } = await supabase.from('profile_private').select('color_mode').eq('user_id', userId).maybeSingle();
  if (error) {
    console.warn('계정의 화면 모드를 불러오지 못했어요', error.message);
    return;
  }
  const server = data?.color_mode === 'light' || data?.color_mode === 'dark' ? data.color_mode : null;
  const plan = planSync(server, getStoredColorMode());
  if (plan.apply) setColorMode(plan.apply);
  if (plan.push) await saveColorMode(userId, plan.push);
}
