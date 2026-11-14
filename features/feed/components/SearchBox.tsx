import { useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { Colors, Radius, Shadow } from '@/constants/theme';
import { SEARCH_MIN_LENGTH, normalizeSearchQuery } from '@/features/feed/posts';

const NO_OUTLINE = { outlineStyle: 'none' } as any;
const QUERY_MAX = 50;

/**
 * 홈 화면에 있는 검색창. 여기서 검색어를 입력하고 검색(엔터 또는 버튼)하면 결과 화면이 따로 열린다.
 * 글자를 칠 때마다 홈 화면 전체가 다시 그려지지 않도록, 입력 중인 글자는 이 부품 안에서만 관리한다.
 */
export function SearchBox({ onSearch }: { onSearch: (query: string) => void }) {
  const [text, setText] = useState('');
  const [hint, setHint] = useState('');

  const submit = () => {
    const query = normalizeSearchQuery(text);
    if (query.length < SEARCH_MIN_LENGTH) {
      setHint(`${SEARCH_MIN_LENGTH}글자 이상 입력해 주세요`);
      return;
    }
    setHint('');
    onSearch(query);
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.pill}>
        <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
          <Circle cx={11} cy={11} r={7} stroke={Colors.textFaint} strokeWidth={2} />
          <Path d="M20 20l-4-4" stroke={Colors.textFaint} strokeWidth={2} strokeLinecap="round" />
        </Svg>
        <TextInput
          style={[styles.input, NO_OUTLINE]}
          placeholder="글 제목이나 내용 검색"
          placeholderTextColor={Colors.placeholder}
          value={text}
          onChangeText={(value) => {
            setText(value);
            setHint('');
          }}
          onSubmitEditing={submit}
          returnKeyType="search"
          maxLength={QUERY_MAX}
          accessibilityLabel="글 검색"
        />
        {text ? (
          <Pressable onPress={submit} hitSlop={8} style={styles.button} accessibilityLabel="검색하기">
            <Text style={styles.buttonLabel}>검색</Text>
          </Pressable>
        ) : null}
      </View>
      {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: Colors.card,
    borderRadius: Radius.pill,
    paddingVertical: 4,
    paddingLeft: 18,
    paddingRight: 8,
    boxShadow: Shadow.card,
  },
  input: { flex: 1, fontSize: 15, color: Colors.text, paddingVertical: 10 },
  button: { backgroundColor: Colors.surfaceBorder, borderRadius: Radius.pill, paddingHorizontal: 14, paddingVertical: 8 },
  buttonLabel: { fontSize: 13, fontWeight: '700', color: Colors.onInk },
  hint: { fontSize: 12, color: Colors.danger, marginTop: 6, marginLeft: 18 },
});
