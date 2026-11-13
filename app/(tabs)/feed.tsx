import { ScreenFrame } from '@/components/ScreenFrame';
import Feed from '@/features/feed/screens/Feed';

export default function FeedRoute() {
  return (
    <ScreenFrame maxWidth={1040}>
      <Feed />
    </ScreenFrame>
  );
}
