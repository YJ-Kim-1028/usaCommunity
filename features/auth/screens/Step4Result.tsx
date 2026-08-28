import { getGapja } from '@fullstackfamily/manseryeok';
import { useRouter } from 'expo-router';
import { useMemo } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Badge } from '@/components/Badge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StepHeader } from '@/components/StepHeader';
import { Colors, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/features/auth/hooks/useOnboarding';

export default function Step4Result() {
  const router = useRouter();
  const { data } = useOnboarding();

  const dayPillar = useMemo(() => {
    const year = Number(data.birthYear);
    const month = Number(data.birthMonth);
    const day = Number(data.birthDay);
    if (!year || !month || !day) return null;
    try {
      return getGapja(year, month, day).dayPillar;
    } catch {
      return null;
    }
  }, [data.birthYear, data.birthMonth, data.birthDay]);

  const handleFinish = () => {
    // TODO: Supabase 연동 후 실제 회원가입 API 호출로 교체
    router.replace('/feed');
  };

  return (
    <View style={styles.container}>
      <StepHeader step={4} total={4} onBack={() => router.back()} />

      <Text style={styles.title}>프로필이 완성됐어요</Text>
      <Text style={styles.subtitle}>이 뱃지로 커뮤니티에서 활동하게 돼요</Text>

      <View style={styles.spacer} />

      <View style={styles.card}>
        {data.photoUri ? (
          <Image source={{ uri: data.photoUri }} style={styles.avatarImage} />
        ) : (
          <Svg width={72} height={72} viewBox="0 0 72 72" fill="none" style={styles.avatarPlaceholder}>
            <Circle cx={36} cy={36} r={34} stroke={Colors.surfaceBorder} strokeWidth={2} strokeDasharray="4 5" />
            <Circle cx={36} cy={28} r={11} stroke={Colors.surfaceBorder} strokeWidth={2} />
            <Path
              d="M14 62c4-14 16-20 22-20s18 6 22 20"
              stroke={Colors.surfaceBorder}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        )}
        <Text style={styles.nickname}>{data.nickname || '닉네임'}</Text>
        <View style={styles.badgeRow}>
          <Badge label={data.mbti ?? 'MBTI'} />
          <Badge label={dayPillar ? `${dayPillar}일주` : '일주 계산 중'} filled />
        </View>
        <Text style={styles.description}>
          {dayPillar ? `${dayPillar}일주 · 60가지 조합 중 나만의 특별한 기운` : '생년월일을 다시 확인해주세요'}
        </Text>
      </View>

      <View style={styles.spacer} />

      <PrimaryButton label="커뮤니티 시작하기" onPress={handleFinish} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.three,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textFaint,
  },
  spacer: {
    flex: 1,
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 20,
    alignItems: 'center',
  },
  avatarImage: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 16,
  },
  avatarPlaceholder: {
    marginBottom: 16,
  },
  nickname: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 14,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  description: {
    fontSize: 13,
    color: Colors.textFaint,
    textAlign: 'center',
    lineHeight: 19,
  },
});
