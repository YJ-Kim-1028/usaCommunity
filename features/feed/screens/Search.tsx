import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';

import { PageHeader } from '@/components/PageHeader';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Colors, Radius, Shadow } from '@/constants/theme';
import { POSTS_PAGE_SIZE, searchPosts, type PostItem } from '@/features/feed/api';
import { PostCard } from '@/features/feed/components/PostCard';
import { SEARCH_MIN_LENGTH, appendUnique, normalizeSearchQuery } from '@/features/feed/posts';

/**
 * 검색 결과 화면. 검색어는 홈 화면의 검색창에서 입력하고, 이 화면은 결과만 보여 준다.
 * 검색어는 주소의 q 값(/search?q=...)으로 받는다.
 */
export default function Search() {
  const router = useRouter();
  const { q } = useLocalSearchParams<{ q?: string }>();
  const query = normalizeSearchQuery(q ?? '');

  const [results, setResults] = useState<PostItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (query.length < SEARCH_MIN_LENGTH) {
      setResults([]);
      setHasMore(false);
      setLoading(false);
      return;
    }
    let active = true; // 더 늦게 도착한 이전 검색 결과가 최신 결과를 덮어쓰지 않게 한다
    setLoading(true);
    searchPosts(query).then(({ data, error: err }) => {
      if (!active) return;
      setResults(data ?? []);
      setHasMore((data?.length ?? 0) === POSTS_PAGE_SIZE);
      setError(err ?? '');
      setLoading(false);
    });
    return () => {
      active = false;
    };
  }, [query]);

  const loadMore = async () => {
    const last = results[results.length - 1];
    if (!last || loadingMore || !hasMore) return;
    setLoadingMore(true);
    const { data, error: err } = await searchPosts(query, last.createdAt);
    setLoadingMore(false);
    if (err || !data) {
      setError(err ?? '');
      return;
    }
    setResults((current) => appendUnique(current, data));
    setHasMore(data.length === POSTS_PAGE_SIZE);
  };

  const message = error || (query.length < SEARCH_MIN_LENGTH ? '검색어를 확인해 주세요' : `"${query}"에 대한 결과가 없어요`);

  return (
    <View style={styles.screen}>
      <ScreenFrame maxWidth={760}>
        <PageHeader title="검색 결과" onBack={() => router.back()} />

        <View style={styles.summary}>
          <Text style={styles.queryLabel} numberOfLines={1}>
            “{query}”
          </Text>
          {!loading && !error && results.length > 0 ? (
            <Text style={styles.count}>
              {results.length}
              {hasMore ? '+' : ''}개
            </Text>
          ) : null}
        </View>

        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <PostCard post={item} onPress={() => router.push({ pathname: '/post/[id]', params: { id: item.id } })} />
          )}
          ListEmptyComponent={
            loading ? (
              <ActivityIndicator style={styles.status} color={Colors.surfaceBorder} />
            ) : (
              <Text style={[styles.status, styles.statusText]}>{message}</Text>
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
      </ScreenFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  summary: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: 12,
    paddingHorizontal: 20,
    paddingBottom: 12,
  },
  queryLabel: { flexShrink: 1, fontSize: 20, fontWeight: '800', color: Colors.text, letterSpacing: -0.3 },
  count: { fontSize: 13, fontWeight: '600', color: Colors.textFaint },
  list: { paddingHorizontal: 16, paddingBottom: 48 },
  status: { marginTop: 48 },
  statusText: { textAlign: 'center', color: Colors.textFaint, lineHeight: 24 },
  moreButton: {
    alignSelf: 'center',
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    paddingHorizontal: 26,
    paddingVertical: 12,
    boxShadow: Shadow.card,
  },
  moreLabel: { fontSize: 14, color: Colors.text, fontWeight: '700' },
});
