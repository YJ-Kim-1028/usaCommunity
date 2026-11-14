import { Tabs } from 'expo-router';

import { AppNav } from '@/components/AppNav';
import { useBreakpoint } from '@/hooks/useBreakpoint';

export default function TabsLayout() {
  const { nav } = useBreakpoint();
  return (
    <Tabs
      // 화면 폭에 따라 아래 탭 / 왼쪽 레일 / 왼쪽 사이드바로 바뀌는 내비게이션(AppNav)을 쓴다
      tabBar={(props) => <AppNav {...props} />}
      screenOptions={{
        headerShown: false,
        tabBarPosition: nav === 'bottom' ? 'bottom' : 'left',
      }}>
      <Tabs.Screen name="feed" options={{ title: '홈' }} />
      {/* 게시판은 홈에서 고를 수 있어서 메뉴에서 숨긴다 */}
      <Tabs.Screen name="board" options={{ title: '게시판', href: null }} />
      <Tabs.Screen name="notifications" options={{ title: '알림' }} />
      <Tabs.Screen name="profile" options={{ title: '마이' }} />
    </Tabs>
  );
}
