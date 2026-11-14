import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { countMine, fetchMyComments, fetchMyPosts, type MyComment, type MyPost } from '@/features/profile/api';
import { useColorMode } from '@/lib/colorMode';
import { saveColorMode } from '@/lib/colorModeSync';
import { confirmAction } from '@/lib/dialog';
import { useSession } from '@/lib/session';
import { timeAgo, tintIndexOf } from '@/lib/time';

const TABS = ['내가 쓴 글', '댓글'] as const;

export default function Profile() {
  const router = useRouter();
  const { session, profile, signOut } = useSession();
  const userId = session?.user.id;
  const { mode, toggle, supported: canSwitchMode } = useColorMode();
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);
  const [myPosts, setMyPosts] = useState<MyPost[]>([]);
  const [myComments, setMyComments] = useState<MyComment[]>([]);
  const [counts, setCounts] = useState({ posts: 0, comments: 0 });

  useFocusEffect(
    useCallback(() => {
      if (!userId) return;
      let active = true;
      Promise.all([fetchMyPosts(userId), fetchMyComments(userId), countMine(userId)]).then(([p, c, n]) => {
        if (!active) return;
        setMyPosts(p.data ?? []);
        setMyComments(c.data ?? []);
        setCounts(n);
      });
      return () => {
        active = false;
      };
    }, [userId]),
  );

  // 스위치를 누르면 이 기기에 저장하고, 로그인한 계정에도 저장해서 다른 기기에서도 이어지게 한다
  const handleToggleMode = () => {
    const next = toggle();
    if (next && userId) saveColorMode(userId, next);
  };

  const handleSignOut = async () => {
    if (await confirmAction('로그아웃', '로그아웃하시겠어요?', '로그아웃')) {
      // 세션이 사라지면 루트 레이아웃이 랜딩 화면으로 보낸다
      await signOut();
    }
  };

  const openPost = (id: string | null) => {
    if (id) router.push({ pathname: '/post/[id]', params: { id } });
  };

  const nickname = profile?.nickname ?? '';

  return (
    <View style={styles.screen}>
      <ScreenFrame maxWidth={760}>
        <ScrollView contentContainerStyle={styles.content}>
          <View style={styles.header}>
            <Text style={styles.pageTitle}>마이</Text>
            <View style={styles.headerActions}>
              <Pressable
                onPress={() => router.push('/profile-edit')}
                hitSlop={12}
                style={({ hovered }: any) => [styles.signOut, hovered && styles.signOutHover]}>
                <Text style={styles.editText}>정보 수정</Text>
              </Pressable>
              <Pressable onPress={handleSignOut} hitSlop={12} style={({ hovered }: any) => [styles.signOut, hovered && styles.signOutHover]}>
                <Text style={styles.signOutText}>로그아웃</Text>
              </Pressable>
            </View>
          </View>

          {/* 프로필 카드 */}
          <View style={styles.hero}>
            <View style={styles.heroDecoA} />
            <View style={styles.heroDecoB} />
            <View style={styles.avatarRing}>
              <Avatar size={76} initial={nickname[0] ?? '?'} tintIndex={tintIndexOf(nickname)} photoUrl={profile?.photoUrl} />
            </View>
            <Text style={styles.nickname}>{nickname}</Text>
            <View style={styles.badgeRow}>
              {profile ? <Badge label={profile.mbti} /> : null}
              {profile ? <Badge label={`${profile.ilju}일주`} filled /> : null}
            </View>
          </View>

          {/* 화면 모드(밝게/어둡게) 전환: 직접 고르면 저장되어 다음에도 유지된다 */}
          {canSwitchMode ? (
            <Pressable
              style={({ hovered }: any) => [styles.modeRow, hovered && styles.listItemHover]}
              onPress={handleToggleMode}
              accessibilityRole="switch"
              accessibilityState={{ checked: mode === 'dark' }}
              accessibilityLabel="다크 모드">
              <View style={styles.modeText}>
                <Text style={styles.modeTitle}>다크 모드</Text>
                <Text style={styles.modeSub}>{mode === 'dark' ? '어두운 화면으로 보고 있어요' : '밝은 화면으로 보고 있어요'}</Text>
              </View>
              <View style={[styles.switchTrack, mode === 'dark' && styles.switchTrackOn]}>
                <View style={styles.switchKnob} />
              </View>
            </Pressable>
          ) : null}

          {/* 활동 숫자 */}
          <View style={styles.statRow}>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{counts.posts}</Text>
              <Text style={styles.statLabel}>게시글</Text>
            </View>
            <View style={styles.statTile}>
              <Text style={styles.statValue}>{counts.comments}</Text>
              <Text style={styles.statLabel}>댓글</Text>
            </View>
          </View>

          <View style={styles.tabRow}>
            {TABS.map((item) => (
              <Pressable key={item} onPress={() => setTab(item)} style={[styles.tabPill, tab === item && styles.tabPillActive]}>
                <Text style={[styles.tabLabel, tab === item && styles.tabLabelActive]}>{item}</Text>
              </Pressable>
            ))}
          </View>

          {tab === '내가 쓴 글' ? (
            <View style={styles.list}>
              {myPosts.map((post) => (
                <Pressable
                  key={post.id}
                  style={({ hovered }: any) => [styles.listItem, hovered && styles.listItemHover]}
                  onPress={() => openPost(post.id)}>
                  <Text style={styles.itemTitle}>{post.title}</Text>
                  <Text style={styles.itemMeta}>
                    {timeAgo(post.createdAt)} · 좋아요 {post.likeCount} · 댓글 {post.commentCount}
                  </Text>
                </Pressable>
              ))}
              {myPosts.length === 0 ? <Text style={styles.empty}>아직 작성한 글이 없어요</Text> : null}
            </View>
          ) : (
            <View style={styles.list}>
              {myComments.map((comment) => (
                <Pressable
                  key={comment.id}
                  style={({ hovered }: any) => [styles.listItem, hovered && styles.listItemHover]}
                  onPress={() => openPost(comment.postId)}>
                  <Text style={styles.itemTitle}>{comment.body}</Text>
                  <Text style={styles.itemMeta}>
                    {comment.postTitle ?? '삭제된 글'} · {timeAgo(comment.createdAt)}
                  </Text>
                </Pressable>
              ))}
              {myComments.length === 0 ? <Text style={styles.empty}>아직 작성한 댓글이 없어요</Text> : null}
            </View>
          )}
        </ScrollView>
      </ScreenFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  content: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 48, gap: 14 },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  pageTitle: { fontSize: 22, fontWeight: '800', color: Colors.text },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  editText: { color: Colors.accent, fontSize: 13, fontWeight: '700' },
  signOut: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: Radius.pill },
  signOutHover: { backgroundColor: Colors.hover },
  signOutText: { color: Colors.textMuted, fontSize: 13, fontWeight: '600' },

  hero: {
    alignItems: 'center',
    backgroundColor: Colors.accentSurface,
    borderRadius: 28,
    paddingTop: 30,
    paddingBottom: 26,
    paddingHorizontal: 20,
    overflow: 'hidden',
  },
  heroDecoA: { position: 'absolute', left: -40, top: -50, width: 160, height: 160, borderRadius: 80, backgroundColor: Colors.deco, opacity: 0.8 },
  heroDecoB: { position: 'absolute', right: -30, bottom: -50, width: 130, height: 130, borderRadius: 65, backgroundColor: Colors.deco, opacity: 0.6 },
  avatarRing: { padding: 5, borderRadius: 50, backgroundColor: Colors.card, marginBottom: 14 },
  nickname: { fontSize: 24, fontWeight: '800', color: Colors.text, marginBottom: 10, letterSpacing: -0.4 },
  badgeRow: { flexDirection: 'row', gap: 8 },

  statRow: { flexDirection: 'row', gap: 12 },
  statTile: { flex: 1, backgroundColor: Colors.card, borderRadius: 20, paddingVertical: 16, alignItems: 'center', boxShadow: Shadow.card },
  statValue: { fontSize: 24, fontWeight: '800', color: Colors.text },
  statLabel: { fontSize: 13, color: Colors.textFaint, marginTop: 2 },

  modeRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12, backgroundColor: Colors.card, borderRadius: 20, paddingVertical: 14, paddingHorizontal: 18, boxShadow: Shadow.card },
  modeText: { flexShrink: 1, gap: 2 },
  modeTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  modeSub: { fontSize: 13, color: Colors.textFaint },
  switchTrack: { width: 52, height: 30, borderRadius: 15, backgroundColor: Colors.textFaint, padding: 3, flexDirection: 'row', justifyContent: 'flex-start', alignItems: 'center' },
  switchTrackOn: { backgroundColor: Colors.accent, justifyContent: 'flex-end' },
  switchKnob: { width: 24, height: 24, borderRadius: 12, backgroundColor: '#ffffff', boxShadow: '0 1px 3px rgba(0,0,0,0.3)' },

  tabRow: { flexDirection: 'row', gap: 8, marginTop: Spacing.two },
  tabPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.card },
  tabPillActive: { backgroundColor: Colors.surfaceBorder },
  tabLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  tabLabelActive: { color: Colors.onInk },

  list: { gap: 10 },
  listItem: { backgroundColor: Colors.card, borderRadius: 18, padding: 16, gap: 4, boxShadow: Shadow.card },
  listItemHover: { boxShadow: Shadow.cardHover },
  itemTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  itemMeta: { fontSize: 13, color: Colors.textFaint },
  empty: { fontSize: 14, color: Colors.textFaint, textAlign: 'center', paddingVertical: 28 },
});
