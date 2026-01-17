'use client';

import Link from 'next/link';
import { Logo } from './Logo';

export default function LogoAnimated() {
  return (
    <Link href="/" className="inline-flex">
      <Logo size="md" animated={true} />
    </Link>
  );
}
