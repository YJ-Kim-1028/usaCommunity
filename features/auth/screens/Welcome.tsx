import { useRouter } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { Badge } from '@/components/Badge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function Welcome() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <View style={styles.spacer} />

      <Text style={styles.wordmark}>유사과학</Text>
      <Text style={styles.subtitle}>가제 · MBTI × 일주로 만나는{'\n'}나와 닮은 사람들</Text>

      <View style={styles.badgeRow}>
        <Badge label="INFP" />
        <Badge label="갑자일주" filled />
        <Badge label="ENTJ" />
      </View>

      <View style={styles.spacer} />

      <View style={styles.buttons}>
        <PrimaryButton label="회원가입" onPress={() => router.push('/(auth)/step-1')} />
        <Pressable style={styles.secondaryButton} onPress={() => router.push('/(auth)/login')}>
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
  },
  spacer: {
    flex: 1,
  },
  wordmark: {
    fontSize: 34,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: Colors.textFaint,
    textAlign: 'center',
    lineHeight: 22,
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
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.medium,
    paddingVertical: 16,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  secondaryLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
});
