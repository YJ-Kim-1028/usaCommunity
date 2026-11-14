import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radius, Spacing, Shadow } from '@/constants/theme';
import { signIn } from '@/features/auth/api';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      setError('이메일과 비밀번호를 입력해주세요');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await signIn(email, password);
    setSubmitting(false);
    // 성공하면 세션이 생기면서 루트 레이아웃이 자동으로 피드로 보낸다
    if (!result.ok) setError(result.message);
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={() => router.back()} hitSlop={12} style={styles.back}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path
            d="M15 5l-7 7 7 7"
            stroke={Colors.surfaceBorder}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </Svg>
      </Pressable>

      <Text style={styles.title}>로그인</Text>
      <Text style={styles.subtitle}>다시 만나서 반가워요</Text>

      <Text style={styles.label}>이메일</Text>
      <TextInput
        style={styles.fieldBox}
        placeholder="you@email.com"
        placeholderTextColor={Colors.placeholder}
        autoCapitalize="none"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
      />

      <Text style={styles.label}>비밀번호</Text>
      <TextInput
        style={styles.fieldBox}
        placeholder="비밀번호 입력"
        placeholderTextColor={Colors.placeholder}
        secureTextEntry
        value={password}
        onChangeText={setPassword}
      />

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <View style={styles.spacer} />

      <PrimaryButton label={submitting ? '로그인 중…' : '로그인'} onPress={handleLogin} disabled={submitting} />
      <Pressable onPress={() => router.replace('/(auth)/step-1')} style={styles.signupLink}>
        <Text style={styles.signupText}>계정이 없으신가요? 회원가입</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  error: {
    color: Colors.danger,
    marginTop: Spacing.three,
    fontSize: 13,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    paddingTop: Spacing.five,
  },
  back: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.card,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: Shadow.card,
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.4,
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textFaint,
    marginBottom: Spacing.three,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
    marginBottom: 6,
  },
  fieldBox: {
    backgroundColor: Colors.card,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    ...({ outlineStyle: 'none' } as any),
    color: Colors.text,
    minHeight: 48,
    marginBottom: Spacing.three,
  },
  spacer: {
    flex: 1,
  },
  signupLink: {
    alignItems: 'center',
    paddingVertical: Spacing.three,
  },
  signupText: {
    fontSize: 13,
    color: Colors.textMuted,
    textDecorationLine: 'underline',
  },
});
