import { ScreenFrame } from '@/components/ScreenFrame';
import PostWrite from '@/features/feed/screens/PostWrite';

export default function PostWriteRoute() {
  return (
    <ScreenFrame maxWidth={640}>
      <PostWrite />
    </ScreenFrame>
  );
}
