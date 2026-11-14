import { AuthShell } from '@/components/AuthShell';
import Welcome from '@/features/auth/screens/Welcome';

export default function Index() {
  return (
    <AuthShell>
      <Welcome />
    </AuthShell>
  );
}
