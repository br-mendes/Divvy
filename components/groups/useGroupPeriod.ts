'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';

export function useGroupPeriod() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const from = searchParams.get('from') || '';
  const to = searchParams.get('to') || '';

  function setPeriod(nextFrom: string, nextTo: string) {
    const sp = new URLSearchParams(searchParams.toString());
    if (nextFrom) sp.set('from', nextFrom); else sp.delete('from');
    if (nextTo) sp.set('to', nextTo); else sp.delete('to');
    router.replace(`${pathname}?${sp.toString()}`);
  }

  return { from, to, setPeriod };
}
