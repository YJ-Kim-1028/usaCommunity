import { SEARCH_MIN_LENGTH, normalizeSearchQuery } from '@/features/feed/posts';
import { friendlyDbError } from '@/lib/dbError';
import { supabase } from '@/lib/supabase';

// 모든 함수는 { data, error } 패턴으로 돌려준다. error는 화면에 보여 줄 수 있는 한국어 문장.

export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

const fail = (message: string): { data: null; error: string } => ({ data: null, error: message });
const GENERIC = '문제가 생겼어요. 잠시 후 다시 시도해주세요';

export type Topic = { id: string; slug: string; name: string };

export type Author = { id: string; nickname: string; mbti: string; ilju: string; photoUrl: string | null };

export type PostItem = {
  id: string;
  title: string;
  body: string;
  createdAt: string;
  topicId: string;
  author: Author;
  likeCount: number;
  commentCount: number;
};

export type CommentItem = {
  id: string;
  body: string;
  createdAt: string;
  parentId: string | null;
  author: { id: string; nickname: string; mbti: string; photoUrl: string | null };
};

const POST_SELECT =
  'id, title, body, created_at, topic_id, author:profiles!posts_author_id_fkey!inner(id, nickname, mbti, ilju, photo_url), likes(count), comments(count)';

function toAuthor(raw: any): Author {
  return { id: raw.id, nickname: raw.nickname, mbti: raw.mbti, ilju: raw.ilju, photoUrl: raw.photo_url ?? null };
}

function toPost(row: any): PostItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    topicId: row.topic_id,
    author: toAuthor(row.author),
    likeCount: row.likes?.[0]?.count ?? 0,
    commentCount: row.comments?.[0]?.count ?? 0,
  };
}

export async function fetchTopics(): Promise<ApiResult<Topic[]>> {
  const { data, error } = await supabase.from('topics').select('id, slug, name').order('sort_order');
  if (error) return fail(GENERIC);
  return { data: data ?? [], error: null };
}

// 한 번에 불러오는 글 수. 이보다 적게 돌아오면 더 불러올 글이 없다는 뜻이다.
export const POSTS_PAGE_SIZE = 20;

export async function fetchPosts(filter: {
  topicId?: string;
  mbti?: string;
  ilju?: string;
  /** 이 시각보다 오래된 글만 불러온다(다음 페이지). 처음 불러올 때는 생략한다 */
  before?: string;
}): Promise<ApiResult<PostItem[]>> {
  let query = supabase.from('posts').select(POST_SELECT).order('created_at', { ascending: false }).limit(POSTS_PAGE_SIZE);
  if (filter.before) query = query.lt('created_at', filter.before);
  if (filter.topicId) query = query.eq('topic_id', filter.topicId);
  if (filter.mbti) query = query.eq('author.mbti', filter.mbti);
  if (filter.ilju) query = query.eq('author.ilju', filter.ilju);
  const { data, error } = await query;
  if (error) return fail(GENERIC);
  return { data: (data ?? []).map(toPost), error: null };
}

export type PopularPost = { id: string; title: string; likeCount: number };

/**
 * 인기글. 정렬과 좋아요 수 세기는 DB 함수(popular_posts)가 하고, 앱은 결과만 받는다.
 * days를 주면 "최근 N일에 쓴 글"만, 안 주면 전체 기간이다. topicId를 안 주면 모든 게시판이다.
 */
export async function fetchPopularPosts(filter: {
  topicId?: string;
  days?: number;
  limit?: number;
}): Promise<ApiResult<PopularPost[]>> {
  const { data, error } = await supabase.rpc('popular_posts', {
    p_topic_id: filter.topicId ?? null,
    p_days: filter.days ?? null,
    p_limit: filter.limit ?? 2,
  });
  if (error) return fail(GENERIC);
  return {
    data: (data ?? []).map((row: any) => ({ id: row.id, title: row.title, likeCount: Number(row.like_count) })),
    error: null,
  };
}

export async function fetchPost(id: string): Promise<ApiResult<PostItem | null>> {
  const { data, error } = await supabase.from('posts').select(POST_SELECT).eq('id', id).maybeSingle();
  if (error) return fail(GENERIC);
  return { data: data ? toPost(data) : null, error: null };
}

export async function createPost(input: {
  userId: string;
  topicId: string;
  title: string;
  body: string;
}): Promise<ApiResult<string>> {
  const { data, error } = await supabase
    .from('posts')
    .insert({ author_id: input.userId, topic_id: input.topicId, title: input.title.trim(), body: input.body.trim() })
    .select('id')
    .single();
  if (error) return fail(friendlyDbError(error, '글을 저장하지 못했어요. 잠시 후 다시 시도해주세요'));
  return { data: data.id, error: null };
}

/**
 * 삭제는 실제 DELETE가 아니라 deleted_at 표시(soft delete)다. 신고 기록을 남기기 위함이다.
 * UPDATE로는 읽기 정책(deleted_at is null)에 막혀서, 본인 확인을 하는 DB 함수(rpc)로 처리한다.
 */
export async function deletePost(id: string): Promise<ApiResult<true>> {
  const { error } = await supabase.rpc('soft_delete_post', { p_id: id });
  if (error) return fail(GENERIC);
  return { data: true, error: null };
}

export async function fetchComments(postId: string): Promise<ApiResult<CommentItem[]>> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, parent_comment_id, author:profiles!comments_author_id_fkey(id, nickname, mbti, photo_url)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) return fail(GENERIC);
  const items: CommentItem[] = (data ?? []).map((row: any) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    parentId: row.parent_comment_id,
    author: { id: row.author.id, nickname: row.author.nickname, mbti: row.author.mbti, photoUrl: row.author.photo_url ?? null },
  }));
  return { data: items, error: null };
}

export async function createComment(input: {
  userId: string;
  postId: string;
  body: string;
  parentId?: string | null;
}): Promise<ApiResult<true>> {
  const { error } = await supabase.from('comments').insert({
    author_id: input.userId,
    post_id: input.postId,
    parent_comment_id: input.parentId ?? null,
    body: input.body.trim(),
  });
  if (error) return fail(friendlyDbError(error, '댓글을 저장하지 못했어요. 잠시 후 다시 시도해주세요'));
  return { data: true, error: null };
}

export async function isLiked(postId: string, userId: string): Promise<boolean> {
  const { data } = await supabase.from('likes').select('post_id').eq('post_id', postId).eq('user_id', userId).maybeSingle();
  return !!data;
}

export async function setLike(postId: string, userId: string, liked: boolean): Promise<ApiResult<true>> {
  const { error } = liked
    ? await supabase.from('likes').insert({ post_id: postId, user_id: userId })
    : await supabase.from('likes').delete().eq('post_id', postId).eq('user_id', userId);
  if (error) return fail(GENERIC);
  return { data: true, error: null };
}

export async function reportPost(postId: string, reporterId: string, reason: string): Promise<ApiResult<true>> {
  const { error } = await supabase.from('reports').insert({ reporter_id: reporterId, post_id: postId, reason });
  if (error) return fail(friendlyDbError(error, '신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요'));
  return { data: true, error: null };
}

/**
 * 글 검색(제목·본문). 검색어를 문자열로 이어 붙이지 않고 DB 함수(search_posts)에 매개변수로 넘긴다.
 * 2글자 미만이면 서버에 묻지 않고 빈 결과를 돌려준다. before를 주면 그보다 오래된 글을 이어서 가져온다.
 */
export async function searchPosts(query: string, before?: string): Promise<ApiResult<PostItem[]>> {
  const q = normalizeSearchQuery(query);
  if (q.length < SEARCH_MIN_LENGTH) return { data: [], error: null };
  const { data, error } = await supabase.rpc('search_posts', {
    p_query: q,
    p_limit: POSTS_PAGE_SIZE,
    p_before: before ?? null,
  });
  if (error) return fail(GENERIC);
  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      body: row.body,
      createdAt: row.created_at,
      topicId: row.topic_id,
      author: { id: row.author_id, nickname: row.nickname, mbti: row.mbti, ilju: row.ilju, photoUrl: row.photo_url ?? null },
      likeCount: Number(row.like_count),
      commentCount: Number(row.comment_count),
    })),
    error: null,
  };
}
