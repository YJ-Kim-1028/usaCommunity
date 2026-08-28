import { Component, type ErrorInfo, type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { Colors } from '@/constants/theme';
import { PrimaryButton } from '@/components/PrimaryButton';

type Props = { children: ReactNode };
type State = { hasError: boolean };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    // TODO: platform/monitoring.ts 연동 시 여기서 크래시 리포팅 서비스로 전달
    console.error('ErrorBoundary caught an error', error, info);
  }

  reset = () => this.setState({ hasError: false });

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>문제가 발생했어요</Text>
          <Text style={styles.body}>화면을 불러오는 중 오류가 났어요. 다시 시도해주세요.</Text>
          <PrimaryButton label="다시 시도" onPress={this.reset} />
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    gap: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  body: {
    fontSize: 14,
    color: Colors.textFaint,
    textAlign: 'center',
    marginBottom: 12,
  },
});
