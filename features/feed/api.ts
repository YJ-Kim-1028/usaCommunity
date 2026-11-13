import { supabase } from '@/lib/supabase';

// 모든 함수는 { data, error } 패턴으로 돌려준다. error는 화면에 보여 줄 수 있는 한국어 문장.

export type ApiResult<T> = { data: T; error: null } | { data: null; error: string };

const fail = (message: string): { data: null; error: string } => ({ data: null, error: message });
const GENERIC = '문제가 생겼어요. 잠시 후 다시 시도해주세요';

export type Topic = { id: string; slug: string; name: string };

export type Author = { id: string; nickname: string; mbti: string; ilju: string };

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
  author: { id: string; nickname: string; mbti: string };
};

const POST_SELECT =
  'id, title, body, created_at, topic_id, author:profiles!posts_author_id_fkey!inner(id, nickname, mbti, ilju), likes(count), comments(count)';

function toPost(row: any): PostItem {
  return {
    id: row.id,
    title: row.title,
    body: row.body,
    createdAt: row.created_at,
    topicId: row.topic_id,
    author: row.author,
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
  if (error) return fail('글을 저장하지 못했어요. 잠시 후 다시 시도해주세요');
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
    .select('id, body, created_at, parent_comment_id, author:profiles!comments_author_id_fkey(id, nickname, mbti)')
    .eq('post_id', postId)
    .order('created_at', { ascending: true });
  if (error) return fail(GENERIC);
  const items: CommentItem[] = (data ?? []).map((row: any) => ({
    id: row.id,
    body: row.body,
    createdAt: row.created_at,
    parentId: row.parent_comment_id,
    author: row.author,
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
  if (error) return fail('댓글을 저장하지 못했어요. 잠시 후 다시 시도해주세요');
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
  if (error) return fail('신고를 접수하지 못했어요. 잠시 후 다시 시도해주세요');
  return { data: true, error: null };
}
