import { useWindowDimensions } from 'react-native';

/** 이 너비(px) 이상이면 "넓은 화면" 레이아웃(본문 폭 제한 등) */
export const WIDE_BREAKPOINT = 900;
/** 이 너비 이상이면 아래 탭 대신 왼쪽 아이콘 레일 */
export const RAIL_BREAKPOINT = 720;
/** 이 너비 이상이면 레일 대신 글자가 있는 왼쪽 사이드바 */
export const SIDEBAR_BREAKPOINT = 1100;

/** 내비게이션 모양: 좁은 화면=아래 탭, 중간=왼쪽 레일, 넓은 화면=왼쪽 사이드바 */
export type NavMode = 'bottom' | 'rail' | 'side';

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  const nav: NavMode = width >= SIDEBAR_BREAKPOINT ? 'side' : width >= RAIL_BREAKPOINT ? 'rail' : 'bottom';
  return { width, isWide: width >= WIDE_BREAKPOINT, nav };
}
