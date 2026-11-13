import { useWindowDimensions } from 'react-native';

/** 이 너비(px) 이상이면 PC 웹 레이아웃(사이드바·본문 폭 제한·2단 피드), 미만이면 모바일 레이아웃 */
export const WIDE_BREAKPOINT = 900;

export function useBreakpoint() {
  const { width } = useWindowDimensions();
  return { width, isWide: width >= WIDE_BREAKPOINT };
}
