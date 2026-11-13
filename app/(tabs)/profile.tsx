import { ScreenFrame } from '@/components/ScreenFrame';
import Profile from '@/features/profile/screens/Profile';

export default function ProfileRoute() {
  return (
    <ScreenFrame maxWidth={640}>
      <Profile />
    </ScreenFrame>
  );
}
