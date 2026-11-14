import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, View } from 'react-native';

import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Colors } from '@/constants/theme';
import { SessionProvider, useSession } from '@/lib/session';

function RootNavigator() {
  const { session, loading } = useSession();

  // 저장된 로그인 복원이 끝나기 전에는 화면을 정하지 않는다(로그인 화면이 깜빡이는 것 방지)
  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background }}>
        <ActivityIndicator color={Colors.surfaceBorder} />
      </View>
    );
  }

  const loggedIn = !!session;
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 로그인 전: 랜딩·가입·로그인만 접근 가능 / 로그인 후: 앱 화면만 접근 가능 */}
      <Stack.Protected guard={!loggedIn}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={loggedIn}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="post/new" options={{ presentation: 'card' }} />
        <Stack.Screen name="post/[id]" options={{ presentation: 'card' }} />
        <Stack.Screen name="search" options={{ presentation: 'card' }} />
        <Stack.Screen name="profile-edit" options={{ presentation: 'card' }} />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <ErrorBoundary>
      <StatusBar style="dark" />
      <SessionProvider>
        <RootNavigator />
      </SessionProvider>
    </ErrorBoundary>
  );
}
