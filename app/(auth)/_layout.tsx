import { Stack } from 'expo-router';

import { OnboardingProvider } from '@/features/auth/hooks/useOnboarding';

export default function AuthLayout() {
  return (
    <OnboardingProvider>
      <Stack screenOptions={{ headerShown: false }} />
    </OnboardingProvider>
  );
}
