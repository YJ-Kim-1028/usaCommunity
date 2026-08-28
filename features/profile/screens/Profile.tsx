import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Badge } from '@/components/Badge';
import { Colors, Spacing } from '@/constants/theme';
import { posts } from '@/features/feed/mockData';

const TABS = ['내가 쓴 글', '댓글'] as const;

// TODO: Supabase 연동 후 실제 로그인 유저 프로필로 교체
const mockUser = {
  nickname: '달빛여행자',
  mbti: 'INFP',
  iljuLabel: '병오일주',
  postCount: 12,
  commentCount: 37,
};

export default function Profile() {
  const [tab, setTab] = useState<(typeof TABS)[number]>(TABS[0]);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
          <Circle cx={12} cy={12} r={3} stroke={Colors.surfaceBorder} strokeWidth={2} />
          <Path
            d="M12 3v2M12 19v2M4 12H2M22 12h-2M5.6 5.6 4.2 4.2M19.8 19.8l-1.4-1.4M5.6 18.4 4.2 19.8M19.8 4.2l-1.4 1.4"
            stroke={Colors.surfaceBorder}
            strokeWidth={2}
            strokeLinecap="round"
          />
        </Svg>
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
        <Text style={styles.nickname}>{mockUser.nickname}</Text>
        <View style={styles.badgeRow}>
          <Badge label={mockUser.mbti} />
          <Badge label={mockUser.iljuLabel} filled />
        </View>
        <View style={styles.statsRow}>
          <Text style={styles.statText}>
            게시글 <Text style={styles.statValue}>{mockUser.postCount}</Text>
          </Text>
          <Text style={styles.statText}>
            댓글 <Text style={styles.statValue}>{mockUser.commentCount}</Text>
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
          {posts.map((post) => (
            <View key={post.id} style={styles.listItem}>
              <Text style={styles.itemTitle}>{post.title}</Text>
              <Text style={styles.itemMeta}>
                자유 · {post.timeAgo} · 댓글 {post.commentCount}
              </Text>
            </View>
          ))}
        </View>
      ) : (
        <View style={styles.list}>
          <Text style={styles.itemMeta}>아직 작성한 댓글이 없어요</Text>
        </View>
      )}
    </ScrollView>
  );
}

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
