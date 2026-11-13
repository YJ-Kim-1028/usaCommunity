import { supabase } from '@/lib/supabase';

// 프로필 화면이 쓰는 API.
// 피드 도메인의 api.ts를 직접 가져다 쓰면 도메인 간 import 금지 규칙을 어기게 되므로,
// "내가 쓴 글/댓글" 조회는 프로필 도메인이 직접 가진다.
// 모든 함수는 { data, error } 패턴으로 돌려주고, error는 화면에 보여 줄 수 있는 한국어 문장이다.

export type ProfileApiResult<T> = { data: T; error: null } | { data: null; error: string };

const fail = (message: string): { data: null; error: string } => ({ data: null, error: message });
const GENERIC = '문제가 생겼어요. 잠시 후 다시 시도해주세요';

export type MyPost = {
  id: string;
  title: string;
  createdAt: string;
  likeCount: number;
  commentCount: number;
};

export type MyComment = {
  id: string;
  body: string;
  createdAt: string;
  postId: string | null;
  postTitle: string | null;
};

export async function fetchMyPosts(userId: string): Promise<ProfileApiResult<MyPost[]>> {
  const { data, error } = await supabase
    .from('posts')
    .select('id, title, created_at, likes(count), comments(count)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return fail(GENERIC);
  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
      likeCount: row.likes?.[0]?.count ?? 0,
      commentCount: row.comments?.[0]?.count ?? 0,
    })),
    error: null,
  };
}

export async function fetchMyComments(userId: string): Promise<ProfileApiResult<MyComment[]>> {
  const { data, error } = await supabase
    .from('comments')
    .select('id, body, created_at, post:posts(id, title)')
    .eq('author_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) return fail(GENERIC);
  return {
    data: (data ?? []).map((row: any) => ({
      id: row.id,
      body: row.body,
      createdAt: row.created_at,
      postId: row.post?.id ?? null,
      postTitle: row.post?.title ?? null,
    })),
    error: null,
  };
}

export async function countMine(userId: string): Promise<{ posts: number; comments: number }> {
  const [p, c] = await Promise.all([
    supabase.from('posts').select('id', { count: 'exact', head: true }).eq('author_id', userId),
    supabase.from('comments').select('id', { count: 'exact', head: true }).eq('author_id', userId),
  ]);
  return { posts: p.count ?? 0, comments: c.count ?? 0 };
}
