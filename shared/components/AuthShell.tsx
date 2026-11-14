import type { ReactNode } from 'react';
import { View } from 'react-native';

import { Colors, Shadow } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';

/**
 * 시작·로그인·가입 화면을 감싸는 틀.
 * 넓은 화면에서는 가운데 떠 있는 카드로, 휴대폰에서는 화면 전체로 보여 준다.
 */
export function AuthShell({ children }: { children: ReactNode }) {
  const { width } = useBreakpoint();
  const card = width >= 720;
  return (
    <View
      style={{
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: card ? Colors.shell : Colors.background,
        padding: card ? 32 : 0,
      }}>
      <View
        style={[
          { flex: 1, width: '100%', maxWidth: 480, backgroundColor: Colors.background, overflow: 'hidden' },
          card && { maxHeight: 860, borderRadius: 32, boxShadow: Shadow.cardHover },
        ]}>
        {children}
      </View>
    </View>
  );
}
