import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { PrimaryButton } from '@/components/PrimaryButton';
import { StepHeader } from '@/components/StepHeader';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/features/auth/hooks/useOnboarding';
import { accountSchema } from '@/features/auth/schema';

function CheckIcon({ checked }: { checked: boolean }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Rect x={1} y={1} width={18} height={18} rx={4} stroke={Colors.surfaceBorder} strokeWidth={2} />
      {checked ? (
        <Path
          d="M5 10l3 3 7-7"
          stroke={Colors.surfaceBorder}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}

export default function Step1Account() {
  const router = useRouter();
  const { data, update } = useOnboarding();

  const [password, setPassword] = useState(data.password);
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [agreedPrivacy, setAgreedPrivacy] = useState(false);
  const [agreedAge, setAgreedAge] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNext = () => {
    const result = accountSchema.safeParse({
      email: data.email,
      password,
      passwordConfirm,
      agreedTerms,
      agreedPrivacy,
      agreedAge,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '입력값을 확인해주세요');
      return;
    }

    setError(null);
    update({ email: data.email, password });
    router.push('/(auth)/step-2');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StepHeader step={1} total={4} onBack={() => router.back()} />

      <Text style={styles.title}>계정을 만들어요</Text>
      <Text style={styles.subtitle}>이메일과 비밀번호로 가입해요</Text>

      <Text style={styles.label}>이메일</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.fieldBox, styles.flex1]}
          placeholder="you@email.com"
          placeholderTextColor={Colors.placeholder}
          autoCapitalize="none"
          keyboardType="email-address"
          value={data.email}
          onChangeText={(text) => update({ email: text })}
        />
      </View>

      <Text style={styles.label}>비밀번호</Text>
      <TextInput
        style={styles.fieldBox}
        placeholder="8자 이상"
        placeholderTextColor={Colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      <Text style={styles.label}>비밀번호 확인</Text>
      <TextInput
        style={styles.fieldBox}
        placeholder="다시 입력해주세요"
        placeholderTextColor={Colors.placeholder}
        secureTextEntry
        value={passwordConfirm}
        onChangeText={setPasswordConfirm}
      />

      <View style={styles.checkList}>
        <Pressable style={styles.checkRow} onPress={() => setAgreedTerms((v) => !v)}>
          <CheckIcon checked={agreedTerms} />
          <Text style={styles.checkLabel}>
            이용약관 동의 <Text style={styles.required}>(필수)</Text>
          </Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setAgreedPrivacy((v) => !v)}>
          <CheckIcon checked={agreedPrivacy} />
          <Text style={styles.checkLabel}>
            개인정보처리방침 동의 <Text style={styles.required}>(필수)</Text>
          </Text>
        </Pressable>
        <Pressable style={styles.checkRow} onPress={() => setAgreedAge((v) => !v)}>
          <CheckIcon checked={agreedAge} />
          <Text style={styles.checkLabel}>
            만 14세 이상입니다 <Text style={styles.required}>(필수)</Text>
          </Text>
        </Pressable>
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
    marginBottom: Spacing.two,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  fieldBox: {
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.text,
    minHeight: 48,
  },
  checkList: {
    gap: 10,
    marginTop: Spacing.three,
    marginBottom: Spacing.two,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  checkLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  required: {
    color: Colors.textFaint,
  },
  error: {
    color: Colors.accent,
    fontSize: 13,
  },
});
