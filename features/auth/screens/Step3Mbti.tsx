import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { PrimaryButton } from '@/components/PrimaryButton';
import { StepHeader } from '@/components/StepHeader';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/features/auth/hooks/useOnboarding';

const MBTI_TYPES = [
  'INTJ', 'INTP', 'ENTJ', 'ENTP',
  'INFJ', 'INFP', 'ENFJ', 'ENFP',
  'ISTJ', 'ISFJ', 'ESTJ', 'ESFJ',
  'ISTP', 'ISFP', 'ESTP', 'ESFP',
];

export default function Step3Mbti() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    if (!data.mbti) {
      setError('MBTI를 선택해주세요');
      return;
    }
    setError(null);
    router.push('/(auth)/step-4');
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <StepHeader step={3} total={4} onBack={() => router.back()} />

      <Text style={styles.title}>MBTI를 선택해주세요</Text>
      <Text style={styles.subtitle}>프로필 뱃지로 표시돼요</Text>
      <Pressable onPress={() => Linking.openURL('https://www.16personalities.com/ko')}>
        <Text style={styles.link}>MBTI를 모르시나요? 간단 테스트 하러가기 →</Text>
      </Pressable>

      <View style={styles.grid}>
        {MBTI_TYPES.map((type) => {
          const selected = data.mbti === type;
          return (
            <Pressable
              key={type}
              style={[styles.cell, selected && styles.cellSelected]}
              onPress={() => update({ mbti: type })}>
              <Text style={[styles.cellLabel, selected && styles.cellLabelSelected]}>{type}</Text>
            </Pressable>
          );
        })}
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="다음" onPress={handleNext} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.three,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textFaint,
  },
  link: {
    fontSize: 13,
    color: Colors.text,
    textDecorationLine: 'underline',
    marginBottom: Spacing.two,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: Spacing.two,
  },
  cell: {
    width: '47%',
    minHeight: 56,
    borderWidth: 2,
    borderColor: '#ccc4b3',
    borderRadius: Radius.medium,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellSelected: {
    backgroundColor: Colors.surfaceBorder,
    borderColor: Colors.surfaceBorder,
  },
  cellLabel: {
    fontSize: 15,
    color: Colors.textMuted,
  },
  cellLabelSelected: {
    color: '#ffffff',
    fontWeight: '700',
  },
  error: {
    color: Colors.accent,
    fontSize: 13,
  },
});
