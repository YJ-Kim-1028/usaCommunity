import { Stack } from 'expo-router';

import { ScreenFrame } from '@/components/ScreenFrame';
import { OnboardingProvider } from '@/features/auth/hooks/useOnboarding';

export default function AuthLayout() {
  return (
    <OnboardingProvider>
      <ScreenFrame maxWidth={480}>
        <Stack screenOptions={{ headerShown: false }} />
      </ScreenFrame>
    </OnboardingProvider>
  );
}
