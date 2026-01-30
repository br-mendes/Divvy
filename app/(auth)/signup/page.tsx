import { redirect } from 'next/navigation';

export default function SignupRedirect({
  searchParams,
}: {
  searchParams?: { [key: string]: string | string[] | undefined };
}) {
  const raw = searchParams?.redirect ?? searchParams?.next;
  const redirectParam = Array.isArray(raw) ? raw[0] : raw;

  const suffix = redirectParam ? `?redirect=${encodeURIComponent(redirectParam)}` : '';
  redirect(`/auth/signup${suffix}`);
}
