import { Image } from 'expo-image';
import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type AvatarProps = {
  initial: string;
  size?: number;
  tintIndex?: number;
  /** 프로필 사진 주소. 없거나 불러오지 못하면 이니셜을 보여 준다 */
  photoUrl?: string | null;
};

export function Avatar({ initial, size = 22, tintIndex = 0, photoUrl }: AvatarProps) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [photoUrl]); // 주소가 바뀌면(사진을 바꾸면) 다시 시도한다

  const round = { width: size, height: size, borderRadius: size / 2 };

  if (photoUrl && !failed) {
    return (
      <Image
        source={{ uri: photoUrl }}
        style={[styles.photo, round]}
        contentFit="cover"
        onError={() => setFailed(true)}
        accessibilityLabel="프로필 사진"
      />
    );
  }

  const tint = Colors.avatarTints[tintIndex % Colors.avatarTints.length];
  return (
    <View style={[styles.circle, round, { backgroundColor: tint }]}>
      <Text style={[styles.initial, { fontSize: size * 0.5 }]}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  photo: {
    flexShrink: 0,
    backgroundColor: Colors.hover,
  },
  initial: {
    fontWeight: '700',
    color: Colors.text,
  },
});
