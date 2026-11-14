import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      {/* 배경을 꾸미는 부드러운 원 */}
      <View style={styles.decoA} />
      <View style={styles.decoB} />
      <View style={styles.decoC} />

      <View style={styles.spacer} />

      <View style={styles.logoMark}>
        <Text style={styles.logoMarkText}>아</Text>
      </View>
      <Text style={styles.wordmark}>아브라카다브라</Text>
      <Text style={styles.subtitle}>MBTI × 일주로 만나는{'\n'}나와 닮은 사람들</Text>

      <View style={styles.badgeRow}>
        <Badge label="INFP" />
        <Badge label="갑자일주" filled />
        <Badge label="ENTJ" />
      </View>

      <View style={styles.spacer} />

      <View style={styles.buttons}>
        <PrimaryButton label="회원가입" onPress={() => router.push('/(auth)/step-1')} />
        <Pressable
          style={({ hovered }: any) => [styles.secondaryButton, hovered && styles.secondaryHover]}
          onPress={() => router.push('/(auth)/login')}>
          <Text style={styles.secondaryLabel}>로그인</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    paddingTop: Spacing.six,
    paddingBottom: Spacing.five,
    overflow: 'hidden',
  },
  decoA: { position: 'absolute', top: -80, right: -70, width: 260, height: 260, borderRadius: 130, backgroundColor: Colors.lavender },
  decoB: { position: 'absolute', top: 120, left: -90, width: 200, height: 200, borderRadius: 100, backgroundColor: Colors.pink, opacity: 0.8 },
  decoC: { position: 'absolute', bottom: 150, right: -60, width: 170, height: 170, borderRadius: 85, backgroundColor: Colors.sky, opacity: 0.9 },
  spacer: {
    flex: 1,
  },
  logoMark: {
    alignSelf: 'center',
    width: 76,
    height: 76,
    borderRadius: 24,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    boxShadow: Shadow.cardHover,
  },
  logoMarkText: { color: Colors.onInk, fontSize: 36, fontWeight: '800' },
  wordmark: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
    letterSpacing: -0.6,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textMuted,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: Spacing.four,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  buttons: {
    gap: 10,
  },
  secondaryButton: {
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 54,
    justifyContent: 'center',
    boxShadow: Shadow.card,
  },
  secondaryHover: { boxShadow: Shadow.cardHover },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
