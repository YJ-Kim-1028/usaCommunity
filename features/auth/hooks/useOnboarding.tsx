import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';

export type OnboardingData = {
  email: string;
  password: string;
  nickname: string;
  gender: 'female' | 'male' | null;
  birthYear: string;
  birthMonth: string;
  birthDay: string;
  birthHour: string;
  birthMinute: string;
  photoUri: string | null;
  mbti: string | null;
};

const initialData: OnboardingData = {
  email: '',
  password: '',
  nickname: '',
  gender: null,
  birthYear: '',
  birthMonth: '',
  birthDay: '',
  birthHour: '',
  birthMinute: '',
  photoUri: null,
  mbti: null,
};

type OnboardingContextValue = {
  data: OnboardingData;
  update: (patch: Partial<OnboardingData>) => void;
};

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<OnboardingData>(initialData);
  const value = useMemo(
    () => ({
      data,
      update: (patch: Partial<OnboardingData>) => setData((prev) => ({ ...prev, ...patch })),
    }),
    [data],
  );
  return <OnboardingContext.Provider value={value}>{children}</OnboardingContext.Provider>;
}

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) {
    throw new Error('useOnboarding은 OnboardingProvider 내부에서만 사용할 수 있어요');
  }
  return ctx;
}
