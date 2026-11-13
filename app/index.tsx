import { ScreenFrame } from '@/components/ScreenFrame';
import Welcome from '@/features/auth/screens/Welcome';

export default function Index() {
  return (
    <ScreenFrame maxWidth={480}>
      <Welcome />
    </ScreenFrame>
  );
}
