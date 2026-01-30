import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function LoginRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = router.query.redirect ? `?redirect=${router.query.redirect}` : '';
    router.replace(`/auth/login${redirect}`);
  }, [router]);

  return null;
}
