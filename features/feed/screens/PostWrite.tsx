import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { PageHeader } from '@/components/PageHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { createPost, fetchTopics, type Topic } from '@/features/feed/api';
import { useSession } from '@/lib/session';

const TITLE_MAX = 60;
const BODY_MAX = 5000; // DB 제한(posts_body_length)과 같은 값
const NO_OUTLINE = { outlineStyle: 'none' } as any;

export default function PostWrite() {
  const router = useRouter();
  const { session } = useSession();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [topicId, setTopicId] = useState<string | undefined>();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchTopics().then(({ data }) => {
      if (data) {
        setTopics(data);
        setTopicId(data[0]?.id);
      }
    });
  }, []);

  const handleSubmit = async () => {
    if (!session || !topicId) return;
    if (!title.trim()) {
      setError('제목을 입력해주세요');
      return;
    }
    if (!body.trim()) {
      setError('내용을 입력해주세요');
      return;
    }
    setError('');
    setSubmitting(true);
    const result = await createPost({ userId: session.user.id, topicId, title, body });
    setSubmitting(false);
    if (result.data === null) {
      setError(result.error);
      return;
    }
    router.replace({ pathname: '/post/[id]', params: { id: result.data } });
  };

  return (
    <View style={styles.screen}>
      <ScreenFrame maxWidth={760}>
        <PageHeader title="글쓰기" onBack={() => router.back()} />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>게시판</Text>
            <View style={styles.topicRow}>
              {topics.map((topic) => (
                <Pressable
                  key={topic.id}
                  style={[styles.chip, topicId === topic.id && styles.chipActive]}
                  onPress={() => setTopicId(topic.id)}>
                  <Text style={[styles.chipLabel, topicId === topic.id && styles.chipLabelActive]}>{topic.name}</Text>
                </Pressable>
              ))}
            </View>

            <View style={styles.labelRow}>
              <Text style={styles.label}>제목</Text>
              <Text style={styles.counter}>
                {title.length}/{TITLE_MAX}
              </Text>
            </View>
            <TextInput
              style={[styles.field, NO_OUTLINE]}
              placeholder="제목을 입력하세요"
              placeholderTextColor={Colors.placeholder}
              value={title}
              onChangeText={setTitle}
              maxLength={TITLE_MAX}
            />

            <View style={styles.labelRow}>
              <Text style={styles.label}>내용</Text>
              <Text style={styles.counter}>
                {body.length}/{BODY_MAX}
              </Text>
            </View>
            <TextInput
              style={[styles.field, styles.bodyField, NO_OUTLINE]}
              placeholder="이야기를 남겨보세요"
              placeholderTextColor={Colors.placeholder}
              value={body}
              onChangeText={setBody}
              maxLength={BODY_MAX}
              multiline
              textAlignVertical="top"
            />

            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={submitting ? '올리는 중…' : '올리기'} onPress={handleSubmit} disabled={submitting} />
        </View>
      </ScreenFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 24, padding: 22, gap: 10, boxShadow: Shadow.card },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.two },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: Spacing.two },
  counter: { fontSize: 12, color: Colors.textFaint },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 16, paddingVertical: 9, borderRadius: Radius.pill, backgroundColor: Colors.background },
  chipActive: { backgroundColor: Colors.surfaceBorder },
  chipLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  chipLabelActive: { color: Colors.onInk },
  field: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  bodyField: { minHeight: 220, lineHeight: 24 },
  error: { color: Colors.danger, fontSize: 13, fontWeight: '600', marginTop: Spacing.two },
  footer: { paddingHorizontal: 16, paddingVertical: 14 },
});
