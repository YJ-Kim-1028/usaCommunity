import { Stack } from 'expo-router';

import { AuthShell } from '@/components/AuthShell';
import { OnboardingProvider } from '@/features/auth/hooks/useOnboarding';

export default function AuthLayout() {
  return (
    <OnboardingProvider>
      <AuthShell>
        <Stack screenOptions={{ headerShown: false }} />
      </AuthShell>
    </OnboardingProvider>
  );
}
