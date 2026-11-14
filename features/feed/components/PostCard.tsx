import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Colors, Radius, Shadow } from '@/constants/theme';
import type { PostItem } from '@/features/feed/api';
import { timeAgo, tintIndexOf } from '@/lib/time';

export function HeartIcon({ color = Colors.textMuted, size = 15 }: { color?: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 20s-7-4.6-9.5-9C1 8 2 4.5 6 4c2.3-.3 4 1 6 3 2-2 3.7-3.3 6-3 4 .5 5 4 3.5 7-2.5 4.4-9.5 9-9.5 9Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

/** 글 한 장 카드. 피드와 검색 결과가 같이 쓴다 */
export function PostCard({ post, onPress }: { post: PostItem; onPress: () => void }) {
  return (
    <Pressable
      style={({ pressed, hovered }: any) => [styles.card, hovered && styles.cardHover, pressed && styles.cardPressed]}
      onPress={onPress}>
      <View style={styles.cardHeader}>
        <Avatar size={36} initial={post.author.nickname[0] ?? '?'} tintIndex={tintIndexOf(post.author.nickname)} photoUrl={post.author.photoUrl} />
        <View style={styles.authorBlock}>
          <Text style={styles.authorName}>{post.author.nickname}</Text>
          <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
        </View>
        <View style={styles.badgeRow}>
          <Badge label={post.author.mbti} />
          <Badge label={`${post.author.ilju}일주`} />
        </View>
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postPreview} numberOfLines={2}>
        {post.body}
      </Text>
      <View style={styles.statsRow}>
        <View style={styles.statItem}>
          <HeartIcon />
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

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.card,
    borderRadius: 22,
    padding: 20,
    marginBottom: 14,
    boxShadow: Shadow.card,
  },
  cardHover: { boxShadow: Shadow.cardHover },
  cardPressed: { opacity: 0.92 },
  cardHeader: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 14 },
  authorBlock: { flex: 1, flexShrink: 1 },
  authorName: { fontSize: 14, fontWeight: '700', color: Colors.text },
  timeAgo: { fontSize: 12, color: Colors.textFaint, marginTop: 1 },
  badgeRow: { flexDirection: 'row', gap: 6, flexShrink: 0 },
  postTitle: { fontSize: 18, fontWeight: '800', color: Colors.text, marginBottom: 8, letterSpacing: -0.2, lineHeight: 25 },
  postPreview: { fontSize: 15, lineHeight: 23, color: Colors.textMuted, marginBottom: 16 },
  statsRow: { flexDirection: 'row', gap: 18 },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  statText: { fontSize: 13, color: Colors.textMuted, fontWeight: '600' },
});
