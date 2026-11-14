import { StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors, Shadow, Spacing } from '@/constants/theme';

/** 아직 만들지 않은 화면에 보여 주는 안내 */
export function ComingSoon({ label }: { label: string }) {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Svg width={30} height={30} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 3a5 5 0 0 0-5 5v3.5c0 .8-.3 1.6-.9 2.2L5 15h14l-1.1-1.3c-.6-.6-.9-1.4-.9-2.2V8a5 5 0 0 0-5-5Z"
              stroke={Colors.accent}
              strokeWidth={2}
              strokeLinejoin="round"
            />
            <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={Colors.accent} strokeWidth={2} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={styles.title}>{label}</Text>
        <Text style={styles.body}>곧 만나요. 지금 열심히 준비하고 있어요.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
  },
  card: {
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRadius: 28,
    paddingVertical: 36,
    paddingHorizontal: 40,
    gap: 8,
    boxShadow: Shadow.card,
  },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  title: { fontSize: 20, fontWeight: '800', color: Colors.text },
  body: { fontSize: 14, color: Colors.textFaint },
});
