import { useFocusEffect, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import {
  POSTS_PAGE_SIZE,
  fetchPopularPosts,
  fetchPosts,
  fetchTopics,
  type PopularPost,
  type PostItem,
  type Topic,
} from '@/features/feed/api';
import { HeartIcon, PostCard } from '@/features/feed/components/PostCard';
import { SearchBox } from '@/features/feed/components/SearchBox';
import { appendUnique } from '@/features/feed/posts';
import { useBreakpoint } from '@/hooks/useBreakpoint';
import { useSession } from '@/lib/session';
import { tintIndexOf } from '@/lib/time';

const FILTERS = ['전체', '내 일주만', '내 MBTI만'] as const;
const WEEK_DAYS = 7;
const POPULAR_COUNT = 6;

// 게시판마다 배너 색과 한 줄 소개를 다르게 준다(slug 기준, 없는 게시판은 기본값)
const TOPIC_LOOK: Record<string, { bg: string; deco: string; sub: string }> = {
  free: { bg: Colors.lavender, deco: Colors.lavenderDeco, sub: '아무 이야기나 편하게 나눠요' },
  love: { bg: Colors.pink, deco: Colors.pinkDeco, sub: '연애와 고민을 함께 나눠요' },
  info: { bg: Colors.sky, deco: Colors.skyDeco, sub: '알아두면 좋은 이야기를 모아요' },
  humor: { bg: Colors.yellow, deco: Colors.yellowDeco, sub: '웃음이 필요할 때 들러 보세요' },
  entertainment: { bg: Colors.peach, deco: Colors.peachDeco, sub: '연예인과 TV 프로그램 이야기를 나눠요' },
};
const DEFAULT_LOOK = { bg: Colors.periwinkle, deco: Colors.periwinkleDeco, sub: 'MBTI와 일주로 나누는 이야기' };

export default function Feed() {
  const router = useRouter();
  const { width, nav } = useBreakpoint();
  const { profile } = useSession();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | undefined>();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>(FILTERS[0]);
  const [posts, setPosts] = useState<PostItem[]>([]);
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

  // 인기글은 앱에서 정렬하지 않고 DB 함수가 "이 게시판의 최근 7일 글" 중에서 좋아요 순으로 골라 준다
  useFocusEffect(
    useCallback(() => {
      if (!topicId) return;
      let active = true;
      fetchPopularPosts({ topicId, days: WEEK_DAYS, limit: POPULAR_COUNT }).then(
        ({ data }) => {
          if (active) setPopular(data ?? []);
        },
      );
      return () => {
        active = false;
      };
    }, [topicId]),
  );

  const openPost = (id: string) => router.push({ pathname: '/post/[id]', params: { id } });
  const openWrite = () => router.push('/post/new');

  const topic = topics.find((item) => item.id === topicId);
  const look = (topic && TOPIC_LOOK[topic.slug]) || DEFAULT_LOOK;
  const pad = width >= RAIL_PAD_BREAKPOINT ? 28 : Spacing.three;

  const header = (
    <View>
      {/* 좁은 화면에서는 아래 탭에 로고가 없어서 위쪽에 로고를 둔다(넓은 화면은 사이드바에 있음) */}
      {nav === 'bottom' ? (
        <View style={styles.headerRow}>
          <Text style={styles.logo}>아브라카다브라</Text>
        </View>
      ) : null}

      {/* 검색창: 여기서 입력하고 검색하면 결과 화면이 따로 열린다 */}
      <SearchBox onSearch={(query) => router.push({ pathname: '/search', params: { q: query } })} />

      {/* 게시판 소개 배너: 게시판마다 색이 다르다 */}
      <View style={[styles.hero, { backgroundColor: look.bg }]}>
        <View style={[styles.heroDecoA, { backgroundColor: look.deco }]} />
        <View style={[styles.heroDecoB, { backgroundColor: look.deco }]} />
        <Text style={styles.heroTitle}>{topic?.name ?? '게시판'}</Text>
        <Text style={styles.heroSub}>{look.sub}</Text>
      </View>

      {/* 글쓰기 입구 */}
      <Pressable
        style={({ hovered }: any) => [styles.composer, hovered && styles.cardHover]}
        onPress={openWrite}
        accessibilityLabel="글쓰기">
        <Avatar size={36} initial={profile?.nickname?.[0] ?? '?'} tintIndex={tintIndexOf(profile?.nickname ?? '')} photoUrl={profile?.photoUrl} />
        <Text style={styles.composerHint}>어떤 이야기를 나눠 볼까요?</Text>
        <View style={styles.composerButton}>
          <Text style={styles.composerButtonLabel}>글쓰기</Text>
        </View>
      </Pressable>

      {/* 지금 인기 있는 글: 가로로 넘겨 보는 카드 */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>이번 주 인기 있는 글</Text>
      </View>
      {popular.length > 0 ? (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{ marginHorizontal: -pad }}
          contentContainerStyle={[styles.trendingRow, { paddingHorizontal: pad }]}>
          {popular.map((post, index) => (
            <Pressable
              key={post.id}
              style={({ hovered }: any) => [styles.trendingCard, hovered && styles.cardHover]}
              onPress={() => openPost(post.id)}>
              <View style={styles.rankBadge}>
                <Text style={styles.rankText}>{index + 1}</Text>
              </View>
              <Text style={styles.trendingTitle} numberOfLines={2}>
                {post.title}
              </Text>
              <View style={styles.statItem}>
                <HeartIcon color={Colors.accent} size={14} />
                <Text style={styles.trendingLikes}>{post.likeCount}</Text>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      ) : (
        <Text style={styles.popularEmpty}>
          이번 주에는 아직 인기글이 없어요
        </Text>
      )}

      {/* 게시판 고르기 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.topicScroll} contentContainerStyle={styles.topicRow}>
        {topics.map((item) => (
          <Pressable
            key={item.id}
            onPress={() => setTopicId(item.id)}
            style={[styles.topicPill, topicId === item.id && styles.topicPillActive]}>
            <Text style={[styles.topicLabel, topicId === item.id && styles.topicLabelActive]}>{item.name}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.filterRow}>
        {FILTERS.map((item) => (
          <Pressable key={item} onPress={() => setFilter(item)} style={styles.filterItem}>
            <Text style={[styles.filterLabel, filter === item && styles.filterLabelActive]}>{item}</Text>
            {filter === item ? <View style={styles.filterDot} /> : null}
          </Pressable>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.screen}>
      <FlatList
        data={posts}
        keyExtractor={(item) => item.id}
        style={styles.list}
        contentContainerStyle={[styles.listContent, { paddingHorizontal: pad }]}
        renderItem={({ item }) => <PostCard post={item} onPress={() => openPost(item.id)} />}
        ListHeaderComponent={header}
        ListEmptyComponent={
          loading ? (
            <ActivityIndicator style={styles.status} color={Colors.surfaceBorder} />
          ) : (
            <Text style={[styles.status, styles.statusText]}>{error || '아직 글이 없어요. 첫 글을 남겨보세요'}</Text>
          )
        }
        ListFooterComponent={
          hasMore ? (
            <Pressable style={styles.moreButton} onPress={loadMore} disabled={loadingMore}>
              <Text style={styles.moreLabel}>{loadingMore ? '불러오는 중…' : '더 보기'}</Text>
            </Pressable>
          ) : null
        }
      />

      {/* 좁은 화면에서만 떠 있는 글쓰기 버튼(넓은 화면은 사이드바·레일에 글쓰기가 있음) */}
      {nav === 'bottom' ? (
        <Pressable style={styles.fab} onPress={openWrite} accessibilityLabel="글쓰기">
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path d="M12 5v14M5 12h14" stroke={Colors.onInk} strokeWidth={2.4} strokeLinecap="round" />
          </Svg>
        </Pressable>
      ) : null}
    </View>
  );
}

const RAIL_PAD_BREAKPOINT = 720;

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  list: { flex: 1 },
  // 본문은 항상 가운데 정렬하고 폭을 제한한다
  listContent: { width: '100%', maxWidth: 760, alignSelf: 'center', paddingTop: 20, paddingBottom: 120 },

  headerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  logo: { fontSize: 22, fontWeight: '800', color: Colors.text },


  hero: { borderRadius: 24, paddingVertical: 26, paddingHorizontal: 24, marginBottom: 16, overflow: 'hidden' },
  heroDecoA: { position: 'absolute', right: -30, top: -40, width: 150, height: 150, borderRadius: 75, opacity: 0.8 },
  heroDecoB: { position: 'absolute', right: 70, bottom: -50, width: 90, height: 90, borderRadius: 45, opacity: 0.6 },
  heroTitle: { fontSize: 30, fontWeight: '800', color: Colors.text, letterSpacing: -0.5 },
  heroSub: { fontSize: 14, color: Colors.textMuted, marginTop: 6 },

  composer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: Colors.card,
    borderRadius: 20,
    paddingVertical: 12,
    paddingLeft: 14,
    paddingRight: 12,
    marginBottom: 24,
    boxShadow: Shadow.card,
  },
  composerHint: { flex: 1, fontSize: 15, color: Colors.textFaint },
  composerButton: { backgroundColor: Colors.surfaceBorder, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  composerButtonLabel: { color: Colors.onInk, fontSize: 14, fontWeight: '700' },

  sectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: '800', color: Colors.text },
  popularEmpty: { fontSize: 13, color: Colors.textFaint, marginBottom: 20 },

  trendingRow: { gap: 12, paddingBottom: 8, paddingTop: 2 },
  trendingCard: {
    width: 236,
    backgroundColor: Colors.card,
    borderRadius: 20,
    padding: 16,
    gap: 10,
    boxShadow: Shadow.card,
  },
  rankBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accentSurface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rankText: { fontSize: 14, fontWeight: '800', color: Colors.accent },
  trendingTitle: { fontSize: 15, fontWeight: '700', color: Colors.text, lineHeight: 21, minHeight: 42 },
  trendingLikes: { fontSize: 13, color: Colors.accent, fontWeight: '700' },

  topicScroll: { marginTop: 22, marginBottom: 14, flexGrow: 0 },
  topicRow: { gap: 8 },
  topicPill: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.card },
  topicPillActive: { backgroundColor: Colors.surfaceBorder },
  topicLabel: { fontSize: 14, color: Colors.textMuted, fontWeight: '600' },
  topicLabelActive: { color: Colors.onInk },

  filterRow: { flexDirection: 'row', gap: 18, marginBottom: 14, paddingHorizontal: 2 },
  filterItem: { alignItems: 'center', paddingVertical: 4 },
  filterLabel: { fontSize: 14, color: Colors.textFaint },
  filterLabelActive: { color: Colors.text, fontWeight: '700' },
  filterDot: { width: 5, height: 5, borderRadius: 3, backgroundColor: Colors.accent, marginTop: 4 },

  cardHover: { boxShadow: Shadow.cardHover },
  statItem: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  moreButton: {
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 26,
    paddingVertical: 12,
    marginTop: 4,
    boxShadow: Shadow.card,
  },
  moreLabel: { fontSize: 14, color: Colors.text, fontWeight: '700' },
  status: { marginTop: 40 },
  statusText: { textAlign: 'center', color: Colors.textFaint },

  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 6px 20px rgba(23,20,31,0.28)',
  },
});
