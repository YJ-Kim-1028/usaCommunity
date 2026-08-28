import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = () => {
    // TODO: Supabase 연동 후 실제 로그인 API 호출로 교체
    router.replace('/feed');
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

      <View style={styles.spacer} />

      <PrimaryButton label="로그인" onPress={handleLogin} />
      <Pressable onPress={() => router.replace('/(auth)/step-1')} style={styles.signupLink}>
        <Text style={styles.signupText}>계정이 없으신가요? 회원가입</Text>
      </Pressable>
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
  back: {
    marginBottom: Spacing.three,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
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
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
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
