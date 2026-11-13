import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';

type ScreenFrameProps = {
  children: ReactNode;
  /** 넓은 화면(PC)에서 본문이 차지하는 최대 너비. 좁은 화면(모바일)에서는 무시하고 전체 너비를 쓴다 */
  maxWidth?: number;
};

/** 넓은 화면에서 화면 내용을 가운데 정렬하고 최대 너비를 제한한다. 모바일에서는 아무것도 바꾸지 않는다. */
export function ScreenFrame({ children, maxWidth = 640 }: ScreenFrameProps) {
  const { isWide } = useBreakpoint();
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, isWide && { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: Colors.background },
  inner: { flex: 1, width: '100%' },
});
