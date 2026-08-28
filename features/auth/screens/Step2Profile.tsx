import * as ImagePicker from 'expo-image-picker';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';

import { PrimaryButton } from '@/components/PrimaryButton';
import { StepHeader } from '@/components/StepHeader';
import { Colors, Radius, Spacing } from '@/constants/theme';
import { useOnboarding } from '@/features/auth/hooks/useOnboarding';
import { profileSchema } from '@/features/auth/schema';

export default function Step2Profile() {
  const router = useRouter();
  const { data, update } = useOnboarding();
  const [error, setError] = useState<string | null>(null);

  const pickPhoto = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (!result.canceled && result.assets[0]) {
      update({ photoUri: result.assets[0].uri });
    }
  };

  const handleNext = () => {
    const result = profileSchema.safeParse({
      nickname: data.nickname,
      gender: data.gender ?? undefined,
      birthYear: data.birthYear,
      birthMonth: data.birthMonth,
      birthDay: data.birthDay,
      birthHour: data.birthHour,
      birthMinute: data.birthMinute,
      photoUri: data.photoUri ?? undefined,
    });

    if (!result.success) {
      setError(result.error.issues[0]?.message ?? '입력값을 확인해주세요');
      return;
    }

    setError(null);
    router.push('/(auth)/step-3');
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <StepHeader step={2} total={4} onBack={() => router.back()} />

      <Text style={styles.title}>프로필을 알려주세요</Text>
      <Text style={styles.subtitle}>일주 계산과 커뮤니티 뱃지에 쓰여요</Text>

      <Pressable style={styles.photoPicker} onPress={pickPhoto}>
        <View style={styles.photoCircle}>
          {data.photoUri ? (
            <Image source={{ uri: data.photoUri }} style={styles.photoImage} />
          ) : (
            <Svg width={84} height={84} viewBox="0 0 84 84" fill="none">
              <Circle cx={42} cy={42} r={40} stroke={Colors.textFaint} strokeWidth={2} strokeDasharray="4 5" />
              <Circle cx={42} cy={34} r={13} stroke={Colors.textFaint} strokeWidth={2} />
              <Path
                d="M16 72c5-16 19-23 26-23s21 7 26 23"
                stroke={Colors.textFaint}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          )}
          <View style={styles.plusBadge}>
            <Svg width={14} height={14} viewBox="0 0 24 24" fill="none">
              <Path d="M12 5v14M5 12h14" stroke="#fff" strokeWidth={2.4} strokeLinecap="round" />
            </Svg>
          </View>
        </View>
        <Text style={styles.photoLabel}>
          프로필 사진 추가 <Text style={styles.required}>(선택)</Text>
        </Text>
      </Pressable>

      <Text style={styles.label}>닉네임</Text>
      <TextInput
        style={styles.fieldBox}
        placeholder="닉네임 입력"
        placeholderTextColor={Colors.placeholder}
        value={data.nickname}
        onChangeText={(text) => update({ nickname: text })}
      />

      <Text style={styles.label}>성별</Text>
      <View style={styles.genderRow}>
        <Pressable
          style={[styles.genderOption, data.gender === 'female' && styles.genderSelected]}
          onPress={() => update({ gender: 'female' })}>
          <Text style={[styles.genderLabel, data.gender === 'female' && styles.genderLabelSelected]}>여성</Text>
        </Pressable>
        <Pressable
          style={[styles.genderOption, data.gender === 'male' && styles.genderSelected]}
          onPress={() => update({ gender: 'male' })}>
          <Text style={[styles.genderLabel, data.gender === 'male' && styles.genderLabelSelected]}>남성</Text>
        </Pressable>
      </View>

      <Text style={styles.label}>생년월일</Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.fieldBox, styles.centerText, { flex: 1.3 }]}
          placeholder="YYYY"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          maxLength={4}
          value={data.birthYear}
          onChangeText={(text) => update({ birthYear: text })}
        />
        <TextInput
          style={[styles.fieldBox, styles.centerText, styles.flex1]}
          placeholder="MM"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          value={data.birthMonth}
          onChangeText={(text) => update({ birthMonth: text })}
        />
        <TextInput
          style={[styles.fieldBox, styles.centerText, styles.flex1]}
          placeholder="DD"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          value={data.birthDay}
          onChangeText={(text) => update({ birthDay: text })}
        />
      </View>

      <Text style={styles.label}>
        태어난 시간 <Text style={styles.required}>(선택하면 정확도 향상)</Text>
      </Text>
      <View style={styles.row}>
        <TextInput
          style={[styles.fieldBox, styles.centerText, styles.flex1]}
          placeholder="HH"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          value={data.birthHour}
          onChangeText={(text) => update({ birthHour: text })}
        />
        <TextInput
          style={[styles.fieldBox, styles.centerText, styles.flex1]}
          placeholder="MM"
          placeholderTextColor={Colors.placeholder}
          keyboardType="number-pad"
          maxLength={2}
          value={data.birthMinute}
          onChangeText={(text) => update({ birthMinute: text })}
        />
      </View>
      <Text style={styles.hint}>시간을 모르면 일주 정확도가 다소 낮아질 수 있어요</Text>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <PrimaryButton label="다음" onPress={handleNext} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: Colors.background,
    padding: Spacing.four,
    paddingTop: Spacing.five,
    gap: Spacing.two,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.text,
    marginTop: Spacing.three,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textFaint,
    marginBottom: Spacing.two,
  },
  photoPicker: {
    alignItems: 'center',
    marginVertical: Spacing.two,
  },
  photoCircle: {
    width: 84,
    height: 84,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoImage: {
    width: 84,
    height: 84,
    borderRadius: 42,
  },
  plusBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.surfaceBorder,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  photoLabel: {
    fontSize: 13,
    color: Colors.textFaint,
    marginTop: 8,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
  },
  fieldBox: {
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.medium,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 14,
    color: Colors.text,
    minHeight: 48,
  },
  centerText: {
    textAlign: 'center',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex1: {
    flex: 1,
  },
  genderRow: {
    flexDirection: 'row',
    gap: 10,
  },
  genderOption: {
    flex: 1,
    borderWidth: 2,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.medium,
    paddingVertical: 13,
    alignItems: 'center',
  },
  genderSelected: {
    backgroundColor: Colors.surfaceBorder,
  },
  genderLabel: {
    fontSize: 14,
    color: Colors.text,
  },
  genderLabelSelected: {
    color: '#ffffff',
  },
  required: {
    color: Colors.textFaint,
    fontWeight: '400',
  },
  hint: {
    fontSize: 12,
    color: Colors.textFaint,
    marginBottom: Spacing.two,
  },
  error: {
    color: Colors.accent,
    fontSize: 13,
  },
});
