import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Badge } from '@/components/Badge';
import { Colors, Spacing } from '@/constants/theme';
import { countMine, fetchMyComments, fetchMyPosts, type MyComment, type MyPost } from '@/features/profile/api';
import { confirmAction } from '@/lib/dialog';
import { useSession } from '@/lib/session';
import { timeAgo } from '@/lib/time';

const TABS = ['내가 쓴 글', '댓글'] as const;

export default function Profile() {
  const router = useRouter();
  const { session, profile, signOut } = useSession();
  const userId = session?.user.id;
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

  const handleSignOut = async () => {
    if (await confirmAction('로그아웃', '로그아웃하시겠어요?', '로그아웃')) {
      // 세션이 사라지면 루트 레이아웃이 랜딩 화면으로 보낸다
      await signOut();
    }
  };

  const openPost = (id: string | null) => {
    if (id) router.push({ pathname: '/post/[id]', params: { id } });
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Pressable onPress={handleSignOut} hitSlop={12}>
          <Text style={extra.signOut}>로그아웃</Text>
        </Pressable>
      </View>

      <View style={styles.profileBlock}>
        <Svg width={76} height={76} viewBox="0 0 76 76" fill="none" style={styles.avatar}>
          <Circle cx={38} cy={38} r={36} stroke={Colors.surfaceBorder} strokeWidth={2} strokeDasharray="4 5" />
          <Circle cx={38} cy={30} r={12} stroke={Colors.surfaceBorder} strokeWidth={2} />
          <Path
            d="M14 66c5-15 17-21 24-21s19 6 24 21"
            stroke={Colors.surfaceBorder}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
        <Text style={styles.nickname}>{profile?.nickname ?? ''}</Text>
        <View style={styles.badgeRow}>
          {profile ? <Badge label={profile.mbti} /> : null}
          {profile ? <Badge label={`${profile.ilju}일주`} filled /> : null}
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            게시글 <Text style={styles.statValue}>{counts.posts}</Text>
          </Text>
          <Text style={styles.statText}>
            댓글 <Text style={styles.statValue}>{counts.comments}</Text>
          </Text>
        </View>
      </View>

      <View style={styles.tabRow}>
        {TABS.map((item) => (
          <Pressable key={item} onPress={() => setTab(item)}>
            <Text style={[styles.tabLabel, tab === item && styles.tabLabelActive]}>{item}</Text>
          </Pressable>
        ))}
      </View>

      {tab === '내가 쓴 글' ? (
        <View style={styles.list}>
          {myPosts.map((post) => (
            <Pressable key={post.id} style={styles.listItem} onPress={() => openPost(post.id)}>
              <Text style={styles.itemTitle}>{post.title}</Text>
              <Text style={styles.itemMeta}>
                {timeAgo(post.createdAt)} · 좋아요 {post.likeCount} · 댓글 {post.commentCount}
              </Text>
            </Pressable>
          ))}
          {myPosts.length === 0 ? <Text style={styles.itemMeta}>아직 작성한 글이 없어요</Text> : null}
        </View>
      ) : (
        <View style={styles.list}>
          {myComments.map((comment) => (
            <Pressable key={comment.id} style={styles.listItem} onPress={() => openPost(comment.postId)}>
              <Text style={styles.itemTitle}>{comment.body}</Text>
              <Text style={styles.itemMeta}>
                {comment.postTitle ?? '삭제된 글'} · {timeAgo(comment.createdAt)}
              </Text>
            </Pressable>
          ))}
          {myComments.length === 0 ? <Text style={styles.itemMeta}>아직 작성한 댓글이 없어요</Text> : null}
        </View>
      )}
    </ScrollView>
  );
}

const extra = StyleSheet.create({
  signOut: { color: Colors.textMuted, fontSize: 13 },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    paddingTop: Spacing.five,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: Spacing.four,
  },
  profileBlock: {
    alignItems: 'center',
    paddingVertical: 22,
    paddingHorizontal: Spacing.four,
  },
  avatar: {
    marginBottom: 12,
  },
  nickname: {
    fontSize: 19,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 22,
  },
  statText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  statValue: {
    fontWeight: '700',
    color: Colors.text,
  },
  tabRow: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.four,
    gap: 22,
    borderBottomWidth: 2,
    borderBottomColor: Colors.divider,
  },
  tabLabel: {
    fontSize: 14,
    color: Colors.textFaint,
    paddingBottom: 10,
  },
  tabLabelActive: {
    color: Colors.text,
    fontWeight: '700',
    borderBottomWidth: 3,
    borderBottomColor: Colors.surfaceBorder,
  },
  list: {
    padding: Spacing.four,
    gap: 14,
  },
  listItem: {
    gap: 3,
  },
  itemTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  itemMeta: {
    fontSize: 12,
    color: Colors.textFaint,
  },
});
