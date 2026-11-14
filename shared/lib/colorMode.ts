import { useCallback, useSyncExternalStore } from 'react';
import { Platform } from 'react-native';

import { THEME_STORAGE_KEY } from '@/constants/theme';

export type ColorMode = 'light' | 'dark';

/** 직접 고른 값이 있으면 그것을, 없으면 기기 설정을 따른다 */
export function resolveMode(stored: ColorMode | null, systemDark: boolean): ColorMode {
  if (stored) return stored;
  return systemDark ? 'dark' : 'light';
}

export function nextMode(current: ColorMode): ColorMode {
  return current === 'dark' ? 'light' : 'dark';
}

/**
 * 로그인했을 때 서버(계정)에 저장된 값과 이 기기에 저장된 값을 맞추는 규칙.
 * - 서버에 값이 있으면 그것을 따른다(다른 기기에서 고른 설정이 따라온다).
 * - 서버에 값이 없고 이 기기에 값이 있으면, 그 값을 서버에 올린다(처음 한 번).
 * - 둘 다 없으면 아무것도 하지 않는다(기기 설정을 따른다).
 */
export function planSync(
  server: ColorMode | null,
  local: ColorMode | null,
): { apply: ColorMode | null; push: ColorMode | null } {
  if (server) return { apply: server, push: null };
  if (local) return { apply: null, push: local };
  return { apply: null, push: null };
}

// ── 아래는 브라우저(웹)에서만 동작한다. 앱(iOS·안드로이드)은 아직 밝은 모드만 쓴다. ──
const isWeb = Platform.OS === 'web' && typeof window !== 'undefined';
const listeners = new Set<() => void>();

/** 이 기기(브라우저)에 저장된, 직접 고른 값. 없으면 null */
export function getStoredColorMode(): ColorMode | null {
  if (!isWeb) return null;
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch {
    return null; // 저장소를 못 쓰는 환경(사생활 보호 모드 등)에서는 기기 설정을 따른다
  }
}

function currentMode(): ColorMode {
  if (!isWeb) return 'light';
  return resolveMode(getStoredColorMode(), window.matchMedia('(prefers-color-scheme: dark)').matches);
}

/** 화면 모드를 바꾼다: 이 기기에 저장하고, 화면에 바로 적용한다 */
export function setColorMode(mode: ColorMode) {
  if (!isWeb) return;
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, mode);
  } catch {
    // 저장하지 못해도 이번 접속 동안은 바뀐다
  }
  document.documentElement.setAttribute('data-theme', mode);
  listeners.forEach((listener) => listener());
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 직접 고른 값이 없을 때는 기기 설정이 바뀌어도 따라간다
  const query = isWeb ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  query?.addEventListener('change', onChange);
  return () => {
    listeners.delete(onChange);
    query?.removeEventListener('change', onChange);
  };
}

/** 지금 화면 모드와, 눌러서 바꾸는 함수(바뀐 값을 돌려준다) */
export function useColorMode() {
  const mode = useSyncExternalStore(subscribe, currentMode, () => 'light' as ColorMode);

  const toggle = useCallback((): ColorMode | undefined => {
    if (!isWeb) return undefined;
    const next = nextMode(currentMode());
    setColorMode(next);
    return next;
  }, []);

  return { mode, toggle, supported: isWeb };
}
