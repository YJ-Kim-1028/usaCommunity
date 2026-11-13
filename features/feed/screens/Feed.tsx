import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  POSTS_PAGE_SIZE,
  fetchPopularPosts,
  fetchPosts,
  fetchTopics,
  type PopularPost,
  type PostItem,
  type Topic,
} from '@/features/feed/api';
import { appendUnique } from '@/features/feed/posts';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSession } from '@/lib/session';
import { timeAgo, tintIndexOf } from '@/lib/time';

const FILTERS = ['전체', '내 일주만', '내 MBTI만'] as const;
const PERIODS = ['이번 주', '전체'] as const;
const WEEK_DAYS = 7;

function PostCard({ post, onPress }: { post: PostItem; onPress: () => void }) {
  return (
    <Pressable style={styles.card} onPress={onPress}>
      <View style={styles.cardHeader}>
        <Avatar initial={post.author.nickname[0] ?? '?'} tintIndex={tintIndexOf(post.author.nickname)} />
        <Text style={styles.authorName}>{post.author.nickname}</Text>
        <Text style={styles.timeAgo}>· {timeAgo(post.createdAt)}</Text>
      </View>
      <View style={styles.badgeRow}>
        <Badge label={post.author.mbti} />
        <Badge label={`${post.author.ilju}일주`} />
      </View>
      <Text style={styles.postTitle}>{post.title}</Text>
      <Text style={styles.postPreview} numberOfLines={2}>
        {post.body}
      </Text>
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
  const { isWide } = useBreakpoint();
  const { profile } = useSession();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | undefined>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(FILTERS[0]);
  const [posts, setPosts] = useState<PostItem[]>([]);
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>(PERIODS[0]);
  const [popular, setPopular] = useState<PopularPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTopics().then(({ data }) => {
      if (data) {
        setTopics(data);
        setTopicId((current) => current ?? data[0]?.id);
      }
    });
  }, []);

  // 화면으로 돌아올 때마다(글쓰기 후 등) 다시 불러온다
  // 지금 고른 게시판·필터 조건
  const listFilter = {
    topicId,
    mbti: filter === '내 MBTI만' ? profile?.mbti : undefined,
    ilju: filter === '내 일주만' ? profile?.ilju : undefined,
  };

  useFocusEffect(
    useCallback(() => {
      if (!topicId) return;
      let active = true;
      setLoading(true);
      fetchPosts({
        topicId,
        mbti: filter === '내 MBTI만' ? profile?.mbti : undefined,
        ilju: filter === '내 일주만' ? profile?.ilju : undefined,
      }).then(({ data, error: err }) => {
        if (!active) return;
        setPosts(data ?? []);
        setHasMore((data?.length ?? 0) === POSTS_PAGE_SIZE); // 가득 찼으면 더 있을 수 있다
        setError(err ?? '');
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, [topicId, filter, profile?.mbti, profile?.ilju]),
  );

  // "더 보기": 지금 보이는 가장 오래된 글보다 더 오래된 글을 이어서 불러온다
  const loadMore = async () => {
    const last = posts[posts.length - 1];
    if (!last || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data, error: err } = await fetchPosts({ ...listFilter, before: last.createdAt });
    setLoadingMore(false);
    if (err || !data) {
      setError(err ?? '');
      return;
    }
    setPosts((current) => appendUnique(current, data));
    setHasMore(data.length === POSTS_PAGE_SIZE);
  };

  // 인기글은 앱에서 정렬하지 않고 DB 함수가 "이 게시판의 전체 글" 중에서 좋아요 순으로 골라 준다
  useFocusEffect(
    useCallback(() => {
      if (!topicId) return;
      let active = true;
      fetchPopularPosts({ topicId, days: period === '이번 주' ? WEEK_DAYS : undefined, limit: 2 }).then(({ data }) => {
        if (active) setPopular(data ?? []);
      });
      return () => {
        active = false;
      };
    }, [topicId, period]),
  );

  const openPost = (id: string) => router.push({ pathname: '/post/[id]', params: { id } });

  const popularBlock = (
    <View style={styles.popularSection}>
      <View style={extra.popularHeader}>
        <Text style={styles.popularLabel}>지금 인기있는 글</Text>
        <View style={extra.periodRow}>
          {PERIODS.map((item) => (
            <Pressable key={item} onPress={() => setPeriod(item)} hitSlop={6}>
              <Text style={[extra.periodLabel, period === item && extra.periodLabelActive]}>{item}</Text>
            </Pressable>
          ))}
        </View>
      </View>
      {popular.length > 0 ? (
        <View style={[styles.popularRow, isWide && extra.popularColumn]}>
          {popular.map((post, index) => (
            <Pressable key={post.id} style={[styles.popularCard, isWide && extra.popularCardWide]} onPress={() => openPost(post.id)}>
              <Text style={styles.popularRank}>{index + 1}위</Text>
              <Text style={styles.popularTitle} numberOfLines={1}>
                {post.title}
              </Text>
            </Pressable>
          ))}
        </View>
      ) : (
        <Text style={extra.popularEmpty}>
          {period === '이번 주' ? '이번 주에는 아직 인기글이 없어요' : '아직 인기글이 없어요'}
        </Text>
      )}
    </View>
  );

  return (
    <View style={[styles.screen, isWide && extra.row]}>
      <View style={extra.main}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <PostCard post={item} onPress={() => openPost(item.id)} />}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={extra.status} color={Colors.surfaceBorder} />
          ) : (
            <Text style={[extra.status, extra.statusText]}>
              {error || '아직 글이 없어요. 첫 글을 남겨보세요'}
            </Text>
          )
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable style={extra.moreButton} onPress={loadMore} disabled={loadingMore}>
              <Text style={extra.moreLabel}>{loadingMore ? '불러오는 중…' : '더 보기'}</Text>
            </Pressable>
          ) : null
        }
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

            {isWide ? null : popularBlock}

            <View style={styles.topicRow}>
              {topics.map((item) => (
                <Pressable key={item.id} onPress={() => setTopicId(item.id)}>
                  <Text style={[styles.topicLabel, topicId === item.id && styles.topicLabelActive]}>{item.name}</Text>
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

      <Pressable style={styles.fab} onPress={() => router.push('/post/new')}>
        <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
          <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
        </Svg>
      </Pressable>
      </View>
      {isWide && popularBlock ? <View style={extra.side}>{popularBlock}</View> : null}
    </View>
  );
}

const extra = StyleSheet.create({
  moreButton: {
    alignSelf: 'center',
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 22,
    paddingVertical: 9,
    marginTop: 4,
  },
  moreLabel: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  popularHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  periodRow: { flexDirection: 'row', gap: 12, paddingTop: 1 },
  periodLabel: { fontSize: 12, color: Colors.textFaint },
  periodLabelActive: { color: Colors.accent, fontWeight: '700' },
  popularEmpty: { fontSize: 12, color: Colors.textFaint },
  popularColumn: { flexDirection: 'column' },
  popularCardWide: { flex: 0, alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.four },
  main: { flex: 1, maxWidth: 680, alignSelf: 'stretch' },
  side: { width: 280, paddingTop: 72, paddingRight: Spacing.four },
  status: { marginTop: 40 },
  statusText: { textAlign: 'center', color: Colors.textFaint },
});

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
