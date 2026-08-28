import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Colors } from '@/constants/theme';

type StepHeaderProps = {
  step: number;
  total: number;
  onBack?: () => void;
};

export function StepHeader({ step, total, onBack }: StepHeaderProps) {
  return (
    <View style={styles.row}>
      {onBack ? (
        <Pressable onPress={onBack} hitSlop={12}>
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
      ) : null}
      <View style={styles.track}>
        {Array.from({ length: total }).map((_, index) => (
          <View key={index} style={[styles.segment, index < step && styles.segmentFilled]} />
        ))}
      </View>
      <Text style={styles.counter}>
        {step} / {total}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  track: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
  },
  segment: {
    height: 6,
    flex: 1,
    backgroundColor: Colors.divider,
    borderRadius: 3,
  },
  segmentFilled: {
    backgroundColor: Colors.surfaceBorder,
  },
  counter: {
    fontSize: 14,
    color: Colors.textFaint,
  },
});
