import { StyleSheet, Text, View, type ViewStyle } from 'react-native';

import { Colors, Radius } from '@/constants/theme';

type BadgeProps = {
  label: string;
  filled?: boolean;
  style?: ViewStyle;
};

export function Badge({ label, filled = false, style }: BadgeProps) {
  return (
    <View style={[styles.badge, filled && styles.badgeFilled, style]}>
      <Text style={[styles.label, filled && styles.labelFilled]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    borderWidth: 1.5,
    borderColor: Colors.surfaceBorder,
    borderRadius: Radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  badgeFilled: {
    backgroundColor: Colors.surfaceBorder,
  },
  label: {
    fontSize: 12,
    color: Colors.text,
  },
  labelFilled: {
    color: '#ffffff',
  },
});
