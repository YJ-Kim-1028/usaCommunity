import type { Session } from '@supabase/supabase-js';
import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';

import { syncColorModeOnLogin } from '@/lib/colorModeSync';
import { supabase } from '@/lib/supabase';

export type MyProfile = {
  id: string;
  nickname: string;
  mbti: string;
  ilju: string;
  photoUrl: string | null;
};

type SessionContextValue = {
  session: Session | null;
  profile: MyProfile | null;
  /** 세션 복원(앱 시작 시 저장된 로그인 확인)이 끝나기 전에는 true */
  loading: boolean;
  refreshProfile: () => Promise<void>;
  /** 로그아웃. 세션이 사라지면 루트 레이아웃이 랜딩 화면으로 보낸다 */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function loadProfile(userId: string): Promise<MyProfile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, nickname, mbti, ilju, photo_url')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.warn('프로필을 불러오지 못했어요', error.message);
    return null;
  }
  if (!data) return null;
  return { id: data.id, nickname: data.nickname, mbti: data.mbti, ilju: data.ilju, photoUrl: data.photo_url ?? null };
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<MyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    supabase.auth.getSession().then(async ({ data }) => {
      if (!active) return;
      setSession(data.session);
      setProfile(data.session ? await loadProfile(data.session.user.id) : null);
      if (active) setLoading(false);
    });

    // onAuthStateChange 콜백 안에서 supabase를 await로 호출하면 교착될 수 있어, 상태만 바꾸고 프로필은 아래 effect에서 읽는다
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      if (!next) setProfile(null);
    });

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const userId = session?.user.id;
  useEffect(() => {
    if (!userId) return;
    let active = true;
    loadProfile(userId).then((p) => {
      if (active) setProfile(p);
    });
    // 화면 모드(밝게/어둡게)를 계정에 저장된 값과 맞춘다(실패해도 앱은 계속 동작)
    syncColorModeOnLogin(userId);
    return () => {
      active = false;
    };
  }, [userId]);

  const refreshProfile = useCallback(async () => {
    if (!userId) return;
    setProfile(await loadProfile(userId));
  }, [userId]);

  // 로그아웃은 세션을 다루는 일이라 여러 화면(프로필 등)이 같이 쓸 수 있게 세션 관리 쪽(shared)에 둔다
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo(
    () => ({ session, profile, loading, refreshProfile, signOut }),
    [session, profile, loading, refreshProfile, signOut],
  );
  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error('useSession은 SessionProvider 내부에서만 사용할 수 있어요');
  return ctx;
}
