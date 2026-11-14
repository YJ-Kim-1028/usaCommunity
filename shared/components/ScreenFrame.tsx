import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { Colors } from '@/constants/theme';

type ScreenFrameProps = {
  children: ReactNode;
  /** 본문이 차지하는 최대 너비. 이보다 좁은 화면에서는 전체 너비를 쓴다 */
  maxWidth?: number;
};

/** 화면 내용을 가운데 정렬하고 최대 너비를 제한한다. 좁은 화면에서는 아무것도 바꾸지 않는다. */
export function ScreenFrame({ children, maxWidth = 640 }: ScreenFrameProps) {
  return (
    <View style={styles.outer}>
      <View style={[styles.inner, { maxWidth }]}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  outer: { flex: 1, alignItems: 'center', backgroundColor: Colors.background },
  inner: { flex: 1, width: '100%' },
});
