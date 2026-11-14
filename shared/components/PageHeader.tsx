import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Shadow } from '@/constants/theme';

type PageHeaderProps = {
  title: string;
  onBack: () => void;
  /** 오른쪽에 둘 버튼(없으면 빈 칸) */
  right?: ReactNode;
};

/** 안쪽 화면(글 상세·글쓰기)의 위쪽 막대: 동그란 뒤로가기 버튼 + 제목 + 오른쪽 버튼 */
export function PageHeader({ title, onBack, right }: PageHeaderProps) {
  return (
    <View style={styles.header}>
      <Pressable
        onPress={onBack}
        accessibilityLabel="뒤로가기"
        style={({ hovered }: any) => [styles.round, hovered && styles.roundHover]}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Path d="M15 5l-7 7 7 7" stroke={Colors.text} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />
        </Svg>
      </Pressable>
      <Text style={styles.title}>{title}</Text>
      <View style={styles.right}>{right}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
  },
  round: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: Shadow.card,
  },
  roundHover: { boxShadow: Shadow.cardHover },
  title: { fontSize: 17, fontWeight: '800', color: Colors.text },
  right: { minWidth: 40, alignItems: 'flex-end' },
});
