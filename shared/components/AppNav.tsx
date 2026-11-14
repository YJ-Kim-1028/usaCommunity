import { useRouter, type Tabs } from 'expo-router';
import type { ComponentProps } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Colors, Radius } from '@/constants/theme';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSession } from '@/lib/session';
import { tintIndexOf } from '@/lib/time';

type TabBarProps = Parameters<NonNullable<ComponentProps<typeof Tabs>['tabBar']>>[0];

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path d="M4 11 12 4l8 7" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      <Path d="M6 10v9h12v-9" stroke={color} strokeWidth={2} strokeLinejoin="round" />
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
      <Path d="M10 18.5a2 2 0 0 0 4 0" stroke={color} strokeWidth={2} strokeLinecap="round" />
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

function PlusIcon({ color }: { color: string }) {
  return (
    <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2.4} strokeLinecap="round" />
    </Svg>
  );
}

const ITEMS = [
  { name: 'feed', label: '홈', Icon: HomeIcon },
  { name: 'notifications', label: '알림', Icon: BellIcon },
  { name: 'profile', label: '마이', Icon: PersonIcon },
] as const;

/** 화면 폭에 맞춰 모양이 바뀌는 내비게이션: 아래 탭 / 왼쪽 아이콘 레일 / 왼쪽 사이드바 */
export function AppNav({ state, navigation }: TabBarProps) {
  const { nav } = useBreakpoint();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useSession();
  const activeName = state.routes[state.index]?.name;

  const go = (name: string) => {
    const route = state.routes.find((item) => item.name === name);
    if (!route) return;
    const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (activeName !== name && !event.defaultPrevented) navigation.navigate(route.name, route.params);
  };
  const write = () => router.push('/post/new');

  if (nav === 'bottom') {
    return (
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 8) }]}>
        {ITEMS.map(({ name, label, Icon }) => {
          const active = activeName === name;
          return (
            <Pressable key={name} style={styles.bottomItem} onPress={() => go(name)} accessibilityRole="tab">
              <View style={[styles.bottomIconWrap, active && styles.activeSurface]}>
                <Icon color={active ? Colors.text : Colors.textFaint} />
              </View>
              <Text style={[styles.bottomLabel, active && styles.labelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
    );
  }

  if (nav === 'rail') {
    return (
      <View style={styles.rail}>
        <View style={styles.railLogo}>
          <Text style={styles.railLogoText}>아</Text>
        </View>
        <View style={styles.railItems}>
          {ITEMS.map(({ name, label, Icon }) => {
            const active = activeName === name;
            return (
              <Pressable key={name} style={styles.railItem} onPress={() => go(name)} accessibilityRole="tab">
                <View style={[styles.railIconWrap, active && styles.activeSurface]}>
                  <Icon color={active ? Colors.text : Colors.textFaint} />
                </View>
                <Text style={[styles.bottomLabel, active && styles.labelActive]}>{label}</Text>
              </Pressable>
            );
          })}
        </View>
        <Pressable style={styles.railWrite} onPress={write} accessibilityLabel="글쓰기">
          <PlusIcon color={Colors.onInk} />
        </Pressable>
      </View>
    );
  }

  return (
    <View style={styles.sidebar}>
      <Text style={styles.sidebarLogo}>아브라카다브라</Text>
      <View style={styles.sidebarItems}>
        {ITEMS.map(({ name, label, Icon }) => {
          const active = activeName === name;
          return (
            <Pressable
              key={name}
              style={({ hovered }: any) => [styles.sidebarItem, active && styles.activeSurface, hovered && !active && styles.hoverSurface]}
              onPress={() => go(name)}
              accessibilityRole="tab">
              <Icon color={active ? Colors.text : Colors.textMuted} />
              <Text style={[styles.sidebarLabel, active && styles.sidebarLabelActive]}>{label}</Text>
            </Pressable>
          );
        })}
      </View>
      <Pressable style={({ hovered }: any) => [styles.sidebarWrite, hovered && { opacity: 0.9 }]} onPress={write}>
        <View style={styles.sidebarWriteInner}>
          <View style={styles.sidebarWritePlus}>
            <PlusIcon color={Colors.onInk} />
          </View>
          <Text style={styles.sidebarWriteLabel}>글쓰기</Text>
        </View>
      </Pressable>
      <View style={styles.sidebarSpacer} />
      {profile ? (
        <Pressable style={styles.me} onPress={() => go('profile')}>
          <Avatar size={36} initial={profile.nickname[0] ?? '?'} tintIndex={tintIndexOf(profile.nickname)} photoUrl={profile.photoUrl} />
          <View style={styles.meText}>
            <Text style={styles.meName} numberOfLines={1}>
              {profile.nickname}
            </Text>
            <Text style={styles.meSub}>
              {profile.mbti} · {profile.ilju}일주
            </Text>
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  activeSurface: { backgroundColor: Colors.accentSurface },
  hoverSurface: { backgroundColor: Colors.hover },
  labelActive: { color: Colors.text, fontWeight: '700' },

  // 아래 탭 바(좁은 화면)
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: 8,
  },
  bottomItem: { flex: 1, alignItems: 'center', gap: 2 },
  bottomIconWrap: { width: 56, height: 32, borderRadius: Radius.pill, alignItems: 'center', justifyContent: 'center' },
  bottomLabel: { fontSize: 11, color: Colors.textFaint },

  // 왼쪽 아이콘 레일(중간 화면)
  rail: {
    width: 84,
    alignSelf: 'stretch',
    alignItems: 'center',
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingVertical: 20,
    gap: 20,
  },
  railLogo: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLogoText: { color: Colors.onInk, fontSize: 20, fontWeight: '800' },
  railItems: { flex: 1, gap: 10, alignItems: 'center' },
  railItem: { alignItems: 'center', gap: 2 },
  railIconWrap: { width: 52, height: 40, borderRadius: Radius.large, alignItems: 'center', justifyContent: 'center' },
  railWrite: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // 왼쪽 사이드바(넓은 화면)
  sidebar: {
    width: 264,
    alignSelf: 'stretch',
    backgroundColor: Colors.card,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 24,
  },
  sidebarLogo: { fontSize: 21, fontWeight: '800', color: Colors.text, paddingHorizontal: 12, marginBottom: 24 },
  sidebarItems: { gap: 4, marginBottom: 20 },
  sidebarItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: Radius.pill,
  },
  sidebarLabel: { fontSize: 16, color: Colors.textMuted },
  sidebarLabelActive: { color: Colors.text, fontWeight: '700' },
  sidebarWrite: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceBorder,
    borderRadius: Radius.pill,
    paddingVertical: 14,
  },
  // 글자만 버튼 정중앙에 두고, + 는 글자 왼쪽 바깥에 붙인다(중앙 계산에 포함하지 않음)
  sidebarWriteInner: { position: 'relative' },
  sidebarWritePlus: { position: 'absolute', right: '100%', marginRight: 8, top: 0, bottom: 0, justifyContent: 'center' },
  sidebarWriteLabel: { color: Colors.onInk, fontSize: 16, fontWeight: '700' },
  sidebarSpacer: { flex: 1 },
  me: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 10,
    borderRadius: Radius.large,
    backgroundColor: Colors.background,
  },
  meText: { flexShrink: 1 },
  meName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  meSub: { fontSize: 12, color: Colors.textFaint },
});
