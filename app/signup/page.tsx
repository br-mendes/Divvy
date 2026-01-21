import { useEffect } from 'react';
import { useRouter } from 'next/router';

export default function SignupRedirect() {
  const router = useRouter();

  useEffect(() => {
    const redirect = router.query.redirect ? `?redirect=${router.query.redirect}` : '';
    router.replace(`/auth/signup${redirect}`);
  }, [router]);

  return null;
}
