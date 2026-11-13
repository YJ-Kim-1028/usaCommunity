import { ScreenFrame } from '@/components/ScreenFrame';
import PostDetail from '@/features/feed/screens/PostDetail';

export default function PostDetailRoute() {
  return (
    <ScreenFrame maxWidth={720}>
      <PostDetail />
    </ScreenFrame>
  );
}
