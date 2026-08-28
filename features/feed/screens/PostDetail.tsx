import { useLocalSearchParams, useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Avatar } from '@/components/Avatar';
import { Badge } from '@/components/Badge';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { commentsByPostId, posts } from '@/features/feed/mockData';

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [commentDraft, setCommentDraft] = useState('');

  const post = posts.find((item) => item.id === id);
  const comments = commentsByPostId[id ?? ''] ?? [];

  if (!post) {
    return (
      <View style={styles.emptyState}>
        <Text style={styles.emptyText}>게시글을 찾을 수 없어요</Text>
      </View>
    );
  }

  const handleReport = () => {
    Alert.alert('신고하기', '이 게시글을 신고하시겠어요?', [
      { text: '취소', style: 'cancel' },
      { text: '신고', style: 'destructive', onPress: () => Alert.alert('신고가 접수됐어요') },
    ]);
  };

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
        <Text style={styles.headerTitle}>자유게시판</Text>
        <Pressable onPress={handleReport} hitSlop={12}>
          <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
            <Path d="M5 3v18" stroke={Colors.surfaceBorder} strokeWidth={2} strokeLinecap="round" />
            <Path d="M5 4h11l-2 3.5L16 11H5" stroke={Colors.surfaceBorder} strokeWidth={2} strokeLinejoin="round" />
          </Svg>
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.authorRow}>
          <Avatar initial={post.avatarInitial} tintIndex={post.avatarTintIndex} size={30} />
          <View style={styles.flex1}>
            <Text style={styles.authorName}>{post.author}</Text>
            <View style={styles.authorMetaRow}>
              <Badge label={post.mbti} />
              <Badge label={post.iljuLabel} />
              <Text style={styles.timeAgo}>{post.timeAgo}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.title}>{post.title}</Text>
        <Text style={styles.content}>{post.body ?? post.preview}</Text>

        <View style={styles.statsRow}>
          <Text style={styles.statText}>좋아요 {post.likeCount}</Text>
          <Text style={styles.statText}>댓글 {post.commentCount}</Text>
        </View>

        <View style={styles.commentList}>
          {comments.map((comment) => (
            <View key={comment.id} style={[styles.commentRow, comment.depth === 1 && styles.commentReply]}>
              <Avatar initial={comment.author[0]} size={26} />
              <View style={styles.flex1}>
                <View style={styles.commentAuthorRow}>
                  <Text style={styles.commentAuthor}>{comment.author}</Text>
                  {comment.mbti ? <Badge label={comment.mbti} /> : null}
                </View>
                <Text style={styles.commentBody}>{comment.body}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.commentInputRow}>
        <TextInput
          style={styles.commentInput}
          placeholder="댓글을 남겨보세요"
          placeholderTextColor={Colors.placeholder}
          value={commentDraft}
          onChangeText={setCommentDraft}
        />
        <Pressable style={styles.sendButton} onPress={() => setCommentDraft('')}>
          <Text style={styles.sendLabel}>전송</Text>
        </Pressable>
      </View>
    </View>
  );
}

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
