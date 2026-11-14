import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import { Image, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Badge } from '@/components/Badge';
import { PrimaryButton } from '@/components/PrimaryButton';
import { StepHeader } from '@/components/StepHeader';
import { Colors, Shadow, Spacing } from '@/constants/theme';
import { signUp } from '@/features/auth/api';
import { useOnboarding } from '@/features/auth/hooks/useOnboarding';
import { calcDayPillar } from '@/features/auth/ilju';
import { notify } from '@/lib/dialog';

export default function Step4Result() {
  const router = useRouter();
  const { data } = useOnboarding();

  const dayPillar = useMemo(
    () => calcDayPillar(Number(data.birthYear), Number(data.birthMonth), Number(data.birthDay)),
    [data.birthYear, data.birthMonth, data.birthDay],
  );

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const handleFinish = async () => {
    if (!dayPillar) {
      setError('생년월일을 다시 확인해주세요');
      return;
    }
    setError('');
    setSubmitting(true);
    // 일주는 "병오"처럼 두 글자만 저장하고, 화면에서 "일주"를 붙여 보여 준다
    const result = await signUp(data, dayPillar);
    setSubmitting(false);
    if (!result.ok) {
      setError(result.message);
      return;
    }
    if (result.needsEmailConfirm) {
      notify('가입 확인 메일을 보냈어요. 메일의 링크로 인증한 뒤 로그인해주세요.');
      router.replace('/(auth)/login');
    }
    // 이메일 인증이 꺼져 있으면 세션이 바로 생겨서 루트 레이아웃이 피드로 보낸다
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

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label={submitting ? '가입 중…' : '커뮤니티 시작하기'} onPress={handleFinish} disabled={submitting} />
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.danger,
    fontSize: 13,
    textAlign: 'center',
    marginBottom: Spacing.three,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
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
    backgroundColor: Colors.card,
    borderRadius: 28,
    boxShadow: Shadow.card,
    paddingVertical: 36,
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
