import { useRouter } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { posts, type Post } from '@/features/feed/mockData';

const TOPICS = ['자유', '연애·고민', '정보', '유머', '연예'];
const FILTERS = ['전체', '내 일주만', '내 MBTI만'];

function PostCard({ post, onPress }: { post: Post; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Avatar initial={post.avatarInitial} tintIndex={post.avatarTintIndex} />
        <Text style={styles.authorName}>{post.author}</Text>
        <Text style={styles.timeAgo}>· {post.timeAgo}</Text>
      </View>
      <View style={styles.badgeRow}>
        <Badge label={post.mbti} />
        <Badge label={post.iljuLabel} />
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postPreview}>{post.preview}</Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path
              d="M12 20s-7-4.6-9.5-9C1 8 2 4.5 6 4c2.3-.3 4 1 6 3 2-2 3.7-3.3 6-3 4 .5 5 4 3.5 7-2.5 4.4-9.5 9-9.5 9Z"
              stroke={Colors.textMuted}
              strokeWidth={2}
              strokeLinejoin="round"
            />
          </Svg>
          <Text style={styles.statText}>{post.likeCount}</Text>
        </View>
        <View style={styles.statItem}>
          <Svg width={15} height={15} viewBox="0 0 24 24" fill="none">
            <Path d="M4 5h16v11H9l-4 4V5Z" stroke={Colors.textMuted} strokeWidth={2} strokeLinejoin="round" />
          </Svg>
          <Text style={styles.statText}>{post.commentCount}</Text>
        </View>
      </View>
    </Pressable>
  );
}

export default function Feed() {
  const router = useRouter();
  const [topic, setTopic] = useState(TOPICS[0]);
  const [filter, setFilter] = useState(FILTERS[0]);

  const popular = [...posts].sort((a, b) => b.likeCount - a.likeCount).slice(0, 2);

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <PostCard post={item} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })} />
        )}
        ListHeaderComponent={
          <View>
            <View style={styles.headerRow}>
              <Text style={styles.logo}>유사과학</Text>
              <View style={styles.headerIcons}>
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path
                    d="M12 3a5 5 0 0 0-5 5v3.5c0 .8-.3 1.6-.9 2.2L5 15h14l-1.1-1.3c-.6-.6-.9-1.4-.9-2.2V8a5 5 0 0 0-5-5Z"
                    stroke={Colors.text}
                    strokeWidth={2}
                    strokeLinejoin="round"
                  />
                </Svg>
              </View>
            </View>

            <View style={styles.popularSection}>
              <Text style={styles.popularLabel}>지금 인기있는 글</Text>
              <View style={styles.popularRow}>
                {popular.map((post, index) => (
                  <Pressable
                    key={post.id}
                    style={styles.popularCard}
                    onPress={() => router.push({ pathname: '/post/[id]', params: { id: post.id } })}>
                    <Text style={styles.popularRank}>{index + 1}위</Text>
                    <Text style={styles.popularTitle} numberOfLines={1}>
                      {post.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            <View style={styles.topicRow}>
              {TOPICS.map((item) => (
                <Pressable key={item} onPress={() => setTopic(item)}>
                  <Text style={[styles.topicLabel, topic === item && styles.topicLabelActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.filterRow}>
              {FILTERS.map((item) => (
                <Pressable
                  key={item}
                  style={[styles.filterChip, filter === item && styles.filterChipActive]}
                  onPress={() => setFilter(item)}>
                  <Text style={[styles.filterLabel, filter === item && styles.filterLabelActive]}>{item}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        }
      />

      <Pressable style={styles.fab} onPress={() => {}}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  listContent: {
    padding: Spacing.four,
    paddingBottom: 100,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.three,
  },
  logo: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
  },
  headerIcons: {
    flexDirection: 'row',
    gap: 14,
  },
  popularSection: {
    marginBottom: Spacing.three,
  },
  popularLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 8,
  },
  popularRow: {
    flexDirection: 'row',
    gap: 8,
  },
  popularCard: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.accent,
    backgroundColor: Colors.accentSurface,
    borderRadius: Radius.medium,
    paddingVertical: 9,
    paddingHorizontal: 11,
  },
  popularRank: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.accent,
    marginBottom: 2,
  },
  popularTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.text,
  },
  topicRow: {
    flexDirection: 'row',
    gap: 14,
    marginBottom: Spacing.two,
  },
  topicLabel: {
    fontSize: 15,
    color: Colors.textFaint,
    paddingBottom: 6,
  },
  topicLabelActive: {
    color: Colors.text,
    fontWeight: '700',
    borderBottomWidth: 3,
    borderBottomColor: Colors.surfaceBorder,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: Spacing.three,
  },
  filterChip: {
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  filterChipActive: {
    backgroundColor: Colors.surfaceBorder,
  },
  filterLabel: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  filterLabelActive: {
    color: '#ffffff',
  },
  card: {
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.large,
    padding: 14,
    marginBottom: Spacing.three,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    marginBottom: 6,
  },
  authorName: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  timeAgo: {
    fontSize: 12,
    color: Colors.textFaint,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 8,
  },
  postTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  postPreview: {
    fontSize: 13,
    color: '#7a7a7a',
    marginBottom: 10,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 14,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 12,
    color: Colors.textMuted,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 24,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
});
