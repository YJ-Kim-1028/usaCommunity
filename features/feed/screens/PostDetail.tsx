import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Colors, Radius, Spacing } from '@/constants/theme';
import {
  createComment,
  deletePost,
  fetchComments,
  fetchPost,
  isLiked,
  reportPost,
  setLike,
  type CommentItem,
  type PostItem,
} from '@/features/feed/api';
import { confirmAction, notify } from '@/lib/dialog';
import { useSession } from '@/lib/session';
import { timeAgo, tintIndexOf } from '@/lib/time';

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { session } = useSession();
  const userId = session?.user.id;

  const [post, setPost] = useState<PostItem | null>(null);
  const [comments, setComments] = useState<CommentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [liked, setLiked] = useState(false);
  const [commentDraft, setCommentDraft] = useState('');
  const [replyTo, setReplyTo] = useState<CommentItem | null>(null);
  const [sending, setSending] = useState(false);

  const load = useCallback(async () => {
    if (!id) return;
    const [p, c] = await Promise.all([fetchPost(id), fetchComments(id)]);
    setPost(p.data ?? null);
    setComments(c.data ?? []);
    if (userId) setLiked(await isLiked(id, userId));
    setLoading(false);
  }, [id, userId]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <View style={styles.emptyState}>
        <ActivityIndicator color={Colors.surfaceBorder} />
      </View>
    );
  }

  if (!post || !userId) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>게시글을 찾을 수 없어요</Text>
        <Pressable onPress={() => router.back()} style={extra.backLink}>
          <Text style={styles.emptyText}>돌아가기</Text>
        </Pressable>
      </View>
    );
  }

  const isMine = post.author.id === userId;

  const handleReport = async () => {
    if (!(await confirmAction('신고하기', '이 게시글을 신고하시겠어요?', '신고'))) return;
    const { error } = await reportPost(post.id, userId, '부적절한 게시글');
    notify(error ?? '신고가 접수됐어요');
  };

  const handleDelete = async () => {
    if (!(await confirmAction('삭제하기', '이 글을 삭제하시겠어요?', '삭제'))) return;
    const { error } = await deletePost(post.id);
    if (error) {
      notify(error);
      return;
    }
    router.back();
  };

  const handleLike = async () => {
    const next = !liked;
    const before = post;
    setLiked(next); // 먼저 화면에 반영하고, 실패하면 되돌린다
    setPost({ ...post, likeCount: post.likeCount + (next ? 1 : -1) });
    const { error } = await setLike(post.id, userId, next);
    if (error) {
      setLiked(!next);
      setPost(before);
      notify(error);
    }
  };

  const handleSend = async () => {
    if (!commentDraft.trim() || sending) return;
    setSending(true);
    const { error } = await createComment({
      userId,
      postId: post.id,
      body: commentDraft,
      parentId: replyTo?.id ?? null,
    });
    setSending(false);
    if (error) {
      notify(error);
      return;
    }
    setCommentDraft('');
    setReplyTo(null);
    await load();
  };

  // 대댓글은 부모 댓글 바로 아래에 붙여 보여 준다(깊이 1단계까지)
  const roots = comments.filter((c) => !c.parentId);
  const ordered = roots.flatMap((root) => [
    { item: root, depth: 0 as const },
    ...comments.filter((c) => c.parentId === root.id).map((item) => ({ item, depth: 1 as const })),
  ]);

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} hitSlop={12}>
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
            <Path
              d="M15 5l-7 7 7 7"
              stroke={Colors.surfaceBorder}
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </Pressable>
        <Text style={styles.headerTitle}>게시글</Text>
        {isMine ? (
          <Pressable onPress={handleDelete} hitSlop={12}>
            <Text style={extra.headerAction}>삭제</Text>
          </Pressable>
        ) : (
          <Pressable onPress={handleReport} hitSlop={12}>
            <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
              <Path d="M5 3v18" stroke={Colors.surfaceBorder} strokeWidth={2} strokeLinecap="round" />
              <Path d="M5 4h11l-2 3.5L16 11H5" stroke={Colors.surfaceBorder} strokeWidth={2} strokeLinejoin="round" />
            </Svg>
          </Pressable>
        )}
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.authorRow}>
          <Avatar initial={post.author.nickname[0] ?? '?'} tintIndex={tintIndexOf(post.author.nickname)} size={30} />
          <View style={styles.flex1}>
            <Text style={styles.authorName}>{post.author.nickname}</Text>
            <View style={styles.authorMetaRow}>
              <Badge label={post.author.mbti} />
              <Badge label={`${post.author.ilju}일주`} />
              <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.content}>{post.body}</Text>

        <View style={styles.statsRow}>
          <Pressable onPress={handleLike} hitSlop={8}>
            <Text style={[styles.statText, liked && extra.liked]}>
              {liked ? '♥' : '♡'} 좋아요 {post.likeCount}
            </Text>
          </Pressable>
          <Text style={styles.statText}>댓글 {comments.length}</Text>
        </View>

        <View style={styles.commentList}>
          {ordered.map(({ item, depth }) => (
            <View key={item.id} style={[styles.commentRow, depth === 1 && styles.commentReply]}>
              <Avatar initial={item.author.nickname[0] ?? '?'} tintIndex={tintIndexOf(item.author.nickname)} size={26} />
              <View style={styles.flex1}>
                <View style={styles.commentAuthorRow}>
                  <Text style={styles.commentAuthor}>{item.author.nickname}</Text>
                  <Badge label={item.author.mbti} />
                  <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
                </View>
                <Text style={styles.commentBody}>{item.body}</Text>
                {depth === 0 ? (
                  <Pressable onPress={() => setReplyTo(item)} hitSlop={6}>
                    <Text style={extra.replyLink}>답글</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
          ))}
          {ordered.length === 0 ? <Text style={styles.emptyText}>첫 댓글을 남겨보세요</Text> : null}
        </View>
      </ScrollView>

      {replyTo ? (
        <Pressable style={extra.replyBar} onPress={() => setReplyTo(null)}>
          <Text style={extra.replyBarText}>{replyTo.author.nickname}님에게 답글 · 누르면 취소</Text>
        </Pressable>
      ) : null}
      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글을 남겨보세요"
          placeholderTextColor={Colors.placeholder}
          value={commentDraft}
          onChangeText={setCommentDraft}
          onSubmitEditing={handleSend}
        />
        <Pressable style={styles.sendButton} onPress={handleSend} disabled={sending}>
          <Text style={styles.sendLabel}>{sending ? '…' : '전송'}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const extra = StyleSheet.create({
  backLink: { marginTop: Spacing.three },
  headerAction: { color: Colors.accent, fontSize: 14 },
  liked: { color: Colors.accent },
  replyLink: { color: Colors.textMuted, fontSize: 12, marginTop: 4 },
  replyBar: { paddingHorizontal: Spacing.four, paddingVertical: 8, backgroundColor: Colors.background },
  replyBarText: { color: Colors.textMuted, fontSize: 12 },
});

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.background,
  },
  emptyText: {
    color: Colors.textFaint,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
    borderBottomWidth: 2,
    borderBottomColor: Colors.divider,
  },
  headerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    padding: Spacing.four,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 10,
  },
  flex1: {
    flex: 1,
  },
  authorName: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.text,
  },
  authorMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timeAgo: {
    fontSize: 11,
    color: Colors.textFaint,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 10,
  },
  content: {
    fontSize: 14,
    color: '#4a4a4a',
    lineHeight: 21,
    marginBottom: Spacing.three,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    paddingBottom: Spacing.three,
    borderBottomWidth: 2,
    borderBottomColor: Colors.divider,
    marginBottom: Spacing.three,
  },
  statText: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  commentList: {
    gap: 14,
  },
  commentRow: {
    flexDirection: 'row',
    gap: 8,
  },
  commentReply: {
    paddingLeft: 34,
  },
  commentAuthorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.text,
  },
  commentBody: {
    fontSize: 13,
    color: '#4a4a4a',
  },
  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: Spacing.four,
    paddingVertical: 14,
    borderTopWidth: 2,
    borderTopColor: Colors.divider,
  },
  commentInput: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 13,
    color: Colors.text,
  },
  sendButton: {
    backgroundColor: Colors.surfaceBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  sendLabel: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
