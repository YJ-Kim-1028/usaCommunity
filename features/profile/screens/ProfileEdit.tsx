import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Avatar } from '@/components/Avatar';
import { PageHeader } from '@/components/PageHeader';
import { PrimaryButton } from '@/components/PrimaryButton';
import { ScreenFrame } from '@/components/ScreenFrame';
import { MBTI_TYPES } from '@/constants/mbti';
import { Colors, Radius, Shadow, Spacing } from '@/constants/theme';
import { updateMyProfile } from '@/features/profile/api';
import { NICKNAME_MAX, profileEditSchema } from '@/features/profile/schema';
import { removeAvatar, uploadAvatar } from '@/lib/avatar';
import { confirmAction, notify } from '@/lib/dialog';
import { useSession } from '@/lib/session';
import { tintIndexOf } from '@/lib/time';

const NO_OUTLINE = { outlineStyle: 'none' } as any;

export default function ProfileEdit() {
  const router = useRouter();
  const { session, profile, refreshProfile } = useSession();
  const [nickname, setNickname] = useState(profile?.nickname ?? '');
  const [mbti, setMbti] = useState<string>(profile?.mbti ?? '');
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);

  const unchanged = nickname.trim() === profile?.nickname && mbti === profile?.mbti;

  // 사진은 고르면 바로 올라가고, 지우면 바로 지워진다(닉네임·MBTI의 "저장하기"와 따로 동작한다)
  const handleChangePhoto = async () => {
    if (!session || photoBusy) return;
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      notify('사진을 고르려면 사진 접근을 허용해주세요');
      return;
    }
    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 1, // 여기서는 원본 화질로 두고, 올리기 직전에 uploadAvatar가 512px로 줄인다
    });
    if (picked.canceled || !picked.assets[0]) return;

    setPhotoBusy(true);
    const result = await uploadAvatar(session.user.id, picked.assets[0].uri);
    if (result.ok) await refreshProfile();
    setPhotoBusy(false);
    notify(result.ok ? '프로필 사진을 바꿨어요' : result.message);
  };

  const handleRemovePhoto = async () => {
    if (!session || photoBusy || !profile?.photoUrl) return;
    if (!(await confirmAction('사진 지우기', '프로필 사진을 지우시겠어요?', '지우기'))) return;
    setPhotoBusy(true);
    const result = await removeAvatar(session.user.id);
    if (result.ok) await refreshProfile();
    setPhotoBusy(false);
    notify(result.ok ? '프로필 사진을 지웠어요' : result.message);
  };

  const handleSave = async () => {
    if (!session) return;
    const parsed = profileEditSchema.safeParse({ nickname, mbti });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? '입력을 확인해주세요');
      return;
    }
    setError('');
    setSaving(true);
    const result = await updateMyProfile(session.user.id, parsed.data);
    if (result.data === null) {
      setSaving(false);
      setError(result.error);
      return;
    }
    await refreshProfile(); // 마이·사이드바·피드에 바뀐 이름과 MBTI가 바로 보이게 한다
    setSaving(false);
    router.back();
  };

  return (
    <View style={styles.screen}>
      <ScreenFrame maxWidth={760}>
        <PageHeader title="내 정보 수정" onBack={() => router.back()} />

        <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <Text style={styles.label}>프로필 사진</Text>
            <View style={styles.photoRow}>
              <Avatar
                size={72}
                initial={profile?.nickname?.[0] ?? '?'}
                tintIndex={tintIndexOf(profile?.nickname ?? '')}
                photoUrl={profile?.photoUrl}
              />
              <View style={styles.photoButtons}>
                <Pressable
                  style={({ hovered }: any) => [styles.photoButton, hovered && styles.photoButtonHover, photoBusy && styles.disabled]}
                  onPress={handleChangePhoto}
                  disabled={photoBusy}>
                  <Text style={styles.photoButtonLabel}>{photoBusy ? '처리 중…' : profile?.photoUrl ? '사진 바꾸기' : '사진 올리기'}</Text>
                </Pressable>
                {profile?.photoUrl ? (
                  <Pressable
                    style={({ hovered }: any) => [styles.photoButton, hovered && styles.photoButtonHover, photoBusy && styles.disabled]}
                    onPress={handleRemovePhoto}
                    disabled={photoBusy}>
                    <Text style={styles.photoRemoveLabel}>사진 지우기</Text>
                  </Pressable>
                ) : null}
              </View>
            </View>
            <Text style={styles.hint}>JPEG, PNG, WebP 사진을 올릴 수 있어요. 올릴 때 자동으로 작게 줄여요.</Text>

            <View style={styles.labelRow}>
              <Text style={styles.label}>닉네임</Text>
              <Text style={styles.counter}>
                {nickname.length}/{NICKNAME_MAX}
              </Text>
            </View>
            <TextInput
              style={[styles.field, NO_OUTLINE]}
              placeholder="닉네임 (2~12자)"
              placeholderTextColor={Colors.placeholder}
              value={nickname}
              onChangeText={setNickname}
              maxLength={NICKNAME_MAX}
              accessibilityLabel="닉네임"
            />

            <Text style={styles.label}>MBTI</Text>
            <View style={styles.grid}>
              {MBTI_TYPES.map((type) => (
                <Pressable
                  key={type}
                  style={[styles.cell, mbti === type && styles.cellActive]}
                  onPress={() => setMbti(type)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: mbti === type }}>
                  <Text style={[styles.cellLabel, mbti === type && styles.cellLabelActive]}>{type}</Text>
                </Pressable>
              ))}
            </View>

            <Text style={styles.hint}>일주는 생년월일로 정해져서 여기서는 바꿀 수 없어요.</Text>
            {error ? <Text style={styles.error}>{error}</Text> : null}
          </View>
        </ScrollView>

        <View style={styles.footer}>
          <PrimaryButton label={saving ? '저장하는 중…' : '저장하기'} onPress={handleSave} disabled={saving || unchanged} />
        </View>
      </ScreenFrame>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.background },
  body: { paddingHorizontal: 16, paddingBottom: 16 },
  card: { backgroundColor: Colors.card, borderRadius: 24, padding: 22, gap: 10, boxShadow: Shadow.card },
  photoRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  photoButtons: { gap: 8, alignItems: 'flex-start' },
  photoButton: { backgroundColor: Colors.background, borderRadius: Radius.pill, paddingHorizontal: 16, paddingVertical: 9 },
  photoButtonHover: { backgroundColor: Colors.hover },
  photoButtonLabel: { fontSize: 14, fontWeight: '700', color: Colors.text },
  photoRemoveLabel: { fontSize: 14, fontWeight: '700', color: Colors.danger },
  disabled: { opacity: 0.5 },
  labelRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', marginTop: Spacing.two },
  label: { fontSize: 14, fontWeight: '700', color: Colors.text, marginTop: Spacing.two },
  counter: { fontSize: 12, color: Colors.textFaint },
  field: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: Colors.text,
  },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  cell: {
    width: '22.5%',
    minHeight: 48,
    borderRadius: Radius.large,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cellActive: { backgroundColor: Colors.surfaceBorder },
  cellLabel: { fontSize: 14, fontWeight: '600', color: Colors.textMuted },
  cellLabelActive: { color: Colors.onInk, fontWeight: '700' },
  hint: { fontSize: 12, color: Colors.textFaint, marginTop: Spacing.two },
  error: { color: Colors.danger, fontSize: 13, fontWeight: '600' },
  footer: { paddingHorizontal: 16, paddingVertical: 14 },
});
