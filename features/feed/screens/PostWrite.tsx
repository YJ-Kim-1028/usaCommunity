import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/PrimaryButton';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { createPost, fetchTopics, type Topic } from '@/features/feed/api';
import { useSession } from '@/lib/session';

const TITLE_MAX = 60;

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
        <Text style={styles.headerTitle}>글쓰기</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
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

        <Text style={styles.label}>제목</Text>
        <TextInput
          style={styles.field}
          placeholder="제목을 입력하세요"
          placeholderTextColor={Colors.placeholder}
          value={title}
          onChangeText={setTitle}
          maxLength={TITLE_MAX}
        />

        <Text style={styles.label}>내용</Text>
        <TextInput
          style={[styles.field, styles.bodyField]}
          placeholder="이야기를 남겨보세요"
          placeholderTextColor={Colors.placeholder}
          value={body}
          onChangeText={setBody}
          multiline
          textAlignVertical="top"
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
      </ScrollView>

      <View style={styles.footer}>
        <PrimaryButton label={submitting ? '올리는 중…' : '올리기'} onPress={handleSubmit} disabled={submitting} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.five,
    paddingBottom: Spacing.three,
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: Colors.text },
  headerSpacer: { width: 22 },
  body: { padding: Spacing.four, gap: 8 },
  label: { fontSize: 13, fontWeight: '600', color: Colors.textMuted, marginTop: Spacing.three },
  topicRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: Radius.medium,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
  },
  chipActive: { backgroundColor: Colors.surfaceBorder },
  chipLabel: { fontSize: 13, color: Colors.text },
  chipLabelActive: { color: '#fff' },
  field: {
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.text,
  },
  bodyField: { minHeight: 200 },
  error: { color: Colors.accent, fontSize: 13, marginTop: Spacing.two },
  footer: { padding: Spacing.four },
});
