import { Tabs } from 'expo-router';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { Colors } from '@/constants/theme';

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11 12 4l8 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v9h12v-9" stroke={color} strokeWidth={2} strokeLinejoin="round" />
    </Svg>
  );
}

function BoardIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Rect x={4} y={4} width={16} height={16} rx={2} stroke={color} strokeWidth={2} />
      <Path d="M8 9h8M8 13h8M8 17h5" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3a5 5 0 0 0-5 5v3.5c0 .8-.3 1.6-.9 2.2L5 15h14l-1.1-1.3c-.6-.6-.9-1.4-.9-2.2V8a5 5 0 0 0-5-5Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function PersonIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} />
      <Path d="M4 20c1.5-4.5 5-6 8-6s6.5 1.5 8 6" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.surfaceBorder,
        tabBarInactiveTintColor: Colors.textFaint,
        tabBarStyle: { backgroundColor: Colors.background, borderTopColor: Colors.divider },
      }}>
      <Tabs.Screen name="feed" options={{ title: '홈', tabBarIcon: ({ color }) => <HomeIcon color={String(color)} /> }} />
      <Tabs.Screen
        name="board"
        options={{ title: '게시판', tabBarIcon: ({ color }) => <BoardIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="notifications"
        options={{ title: '알림', tabBarIcon: ({ color }) => <BellIcon color={String(color)} /> }}
      />
      <Tabs.Screen
        name="profile"
        options={{ title: '마이', tabBarIcon: ({ color }) => <PersonIcon color={String(color)} /> }}
      />
    </Tabs>
  );
}
