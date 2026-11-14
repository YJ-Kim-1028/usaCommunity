import { useLocalSearchParams, useRouter } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { PageHeader } from '@/components/PageHeader';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
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

const NO_OUTLINE = { outlineStyle: 'none' } as any;
const COMMENT_MAX = 500; // DB 제한(comments_body_length)과 같은 값

function HeartIcon({ color, filled }: { color: string; filled: boolean }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 24 24" fill={filled ? color : 'none'}>
      <Path
        d="M12 20s-7-4.6-9.5-9C1 8 2 4.5 6 4c2.3-.3 4 1 6 3 2-2 3.7-3.3 6-3 4 .5 5 4 3.5 7-2.5 4.4-9.5 9-9.5 9Z"
        stroke={color}
        strokeWidth={2}
        strokeLinejoin="round"
      />
    </Svg>
  );
}

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
      <ScreenFrame maxWidth={760}>
        <PageHeader
          title="게시글"
          onBack={() => router.back()}
          right={
            isMine ? (
              <Pressable onPress={handleDelete} hitSlop={12}>
                <Text style={extra.headerAction}>삭제</Text>
              </Pressable>
            ) : (
              <Pressable onPress={handleReport} hitSlop={12} accessibilityLabel="신고">
                <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                  <Path d="M5 3v18" stroke={Colors.textMuted} strokeWidth={2} strokeLinecap="round" />
                  <Path d="M5 4h11l-2 3.5L16 11H5" stroke={Colors.textMuted} strokeWidth={2} strokeLinejoin="round" />
                </Svg>
              </Pressable>
            )
          }
        />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.postCard}>
            <View style={styles.authorRow}>
              <Avatar initial={post.author.nickname[0] ?? '?'} tintIndex={tintIndexOf(post.author.nickname)} size={40} photoUrl={post.author.photoUrl} />
              <View style={styles.flex1}>
                <Text style={styles.authorName}>{post.author.nickname}</Text>
                <Text style={styles.timeAgo}>{timeAgo(post.createdAt)}</Text>
              </View>
              <View style={styles.badges}>
                <Badge label={post.author.mbti} />
                <Badge label={`${post.author.ilju}일주`} />
              </View>
            </View>

            <Text style={styles.title}>{post.title}</Text>
            <Text style={styles.content}>{post.body}</Text>

            <View style={styles.actionRow}>
              <Pressable
                onPress={handleLike}
                hitSlop={6}
                style={({ hovered }: any) => [styles.pill, liked && styles.pillLiked, hovered && styles.pillHover]}>
                <HeartIcon color={liked ? Colors.accent : Colors.textMuted} filled={liked} />
                <Text style={[styles.pillText, liked && styles.pillTextLiked]}>좋아요 {post.likeCount}</Text>
              </Pressable>
              <View style={styles.pill}>
                <Svg width={17} height={17} viewBox="0 0 24 24" fill="none">
                  <Path d="M4 5h16v11H9l-4 4V5Z" stroke={Colors.textMuted} strokeWidth={2} strokeLinejoin="round" />
                </Svg>
                <Text style={styles.pillText}>댓글 {comments.length}</Text>
              </View>
            </View>
          </View>

          <Text style={styles.commentsTitle}>댓글 {comments.length}</Text>
          <View style={styles.commentList}>
            {ordered.map(({ item, depth }) => (
              <View key={item.id} style={[styles.commentRow, depth === 1 && styles.commentReply]}>
                <Avatar initial={item.author.nickname[0] ?? '?'} tintIndex={tintIndexOf(item.author.nickname)} size={32} photoUrl={item.author.photoUrl} />
                <View style={styles.commentBubble}>
                  <View style={styles.commentAuthorRow}>
                    <Text style={styles.commentAuthor}>{item.author.nickname}</Text>
                    <Badge label={item.author.mbti} />
                    <Text style={styles.timeAgo}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  <Text style={styles.commentBody}>{item.body}</Text>
                  {depth === 0 ? (
                    <Pressable onPress={() => setReplyTo(item)} hitSlop={6}>
                      <Text style={extra.replyLink}>답글 달기</Text>
                    </Pressable>
                  ) : null}
                </View>
              </View>
            ))}
            {ordered.length === 0 ? <Text style={styles.emptyComments}>첫 댓글을 남겨보세요</Text> : null}
          </View>
        </ScrollView>

        {replyTo ? (
          <Pressable style={extra.replyBar} onPress={() => setReplyTo(null)}>
            <Text style={extra.replyBarText}>{replyTo.author.nickname}님에게 답글 · 누르면 취소</Text>
          </Pressable>
        ) : null}
        <View style={styles.commentInputRow}>
          <TextInput
            style={[styles.commentInput, NO_OUTLINE]}
            placeholder="댓글을 남겨보세요"
            maxLength={COMMENT_MAX}
            placeholderTextColor={Colors.placeholder}
            value={commentDraft}
            onChangeText={setCommentDraft}
            onSubmitEditing={handleSend}
          />
          <Pressable style={[styles.sendButton, !commentDraft.trim() && styles.sendDisabled]} onPress={handleSend} disabled={sending}>
            <Text style={styles.sendLabel}>{sending ? '…' : '전송'}</Text>
          </Pressable>
        </View>
      </ScreenFrame>
    </View>
  );
}

const extra = StyleSheet.create({
  backLink: { marginTop: Spacing.three },
  headerAction: { color: Colors.accent, fontSize: 14, fontWeight: '700' },
  replyLink: { color: Colors.textMuted, fontSize: 12, marginTop: 6, fontWeight: '600' },
  replyBar: { paddingHorizontal: Spacing.four, paddingVertical: 8, backgroundColor: Colors.accentSurface },
  replyBarText: { color: Colors.accent, fontSize: 12, fontWeight: '600' },
});

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  emptyState: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.background },
  emptyText: { color: Colors.textFaint },
  body: { paddingHorizontal: 16, paddingBottom: 24, gap: 12 },
  flex1: { flex: 1 },

  postCard: {
    backgroundColor: Colors.card,
    borderRadius: 24,
    padding: 22,
    boxShadow: Shadow.card,
  },
  authorRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 },
  authorName: { fontSize: 15, fontWeight: '700', color: Colors.text },
  badges: { flexDirection: 'row', gap: 6 },
  timeAgo: { fontSize: 12, color: Colors.textFaint, marginTop: 1 },
  title: { fontSize: 22, fontWeight: '800', color: Colors.text, marginBottom: 12, lineHeight: 30, letterSpacing: -0.3 },
  content: { fontSize: 16, color: Colors.bodyText, lineHeight: 27, marginBottom: 22 },
  actionRow: { flexDirection: 'row', gap: 8 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  pillLiked: { backgroundColor: Colors.accentSurface },
  pillHover: { backgroundColor: Colors.hover },
  pillText: { fontSize: 13, fontWeight: '600', color: Colors.textMuted },
  pillTextLiked: { color: Colors.accent },

  commentsTitle: { fontSize: 17, fontWeight: '800', color: Colors.text, marginTop: 12, paddingHorizontal: 4 },
  commentList: { gap: 10 },
  commentRow: { flexDirection: 'row', gap: 10, alignItems: 'flex-start' },
  commentReply: { paddingLeft: 40 },
  commentBubble: {
    flex: 1,
    backgroundColor: Colors.card,
    borderRadius: 18,
    paddingVertical: 12,
    paddingHorizontal: 16,
    boxShadow: Shadow.card,
  },
  commentAuthorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  commentAuthor: { fontSize: 13, fontWeight: '700', color: Colors.text },
  commentBody: { fontSize: 14, color: Colors.bodyText, lineHeight: 21 },
  emptyComments: { color: Colors.textFaint, fontSize: 14, paddingHorizontal: 4 },

  commentInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: Colors.card,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  commentInput: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: Radius.pill,
    paddingHorizontal: 18,
    paddingVertical: 12,
    fontSize: 14,
    color: Colors.text,
  },
  sendButton: { backgroundColor: Colors.surfaceBorder, borderRadius: Radius.pill, paddingHorizontal: 20, paddingVertical: 12 },
  sendDisabled: { opacity: 0.45 },
  sendLabel: { color: Colors.onInk, fontSize: 14, fontWeight: '700' },
});
