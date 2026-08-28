import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';

type AvatarProps = {
  initial: string;
  size?: number;
  tintIndex?: number;
};

export function Avatar({ initial, size = 22, tintIndex = 0 }: AvatarProps) {
  const tint = Colors.avatarTints[tintIndex % Colors.avatarTints.length];
  return (
    <View style={[styles.circle, { width: size, height: size, borderRadius: size / 2, backgroundColor: tint }]}>
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
  initial: {
    fontWeight: '700',
    color: Colors.text,
  },
});
