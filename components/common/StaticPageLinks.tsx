import Link from 'next/link';
import React from 'react';

const staticLinks = [
  { href: '/about', label: 'Sobre' },
  { href: '/faq', label: 'FAQ' },
  { href: '/support', label: 'Suporte' },
  { href: '/terms', label: 'Termos' },
  { href: '/privacy', label: 'Privacidade' },
];

type StaticPageLinksProps = {
  className?: string;
  linkClassName?: string;
};

export default function StaticPageLinks({
  className = '',
  linkClassName = '',
}: StaticPageLinksProps) {
  return (
    <div className={`flex flex-wrap items-center justify-center gap-4 ${className}`.trim()}>
      {staticLinks.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={`transition-colors ${linkClassName}`.trim()}
        >
          {link.label}
        </Link>
      ))}
    </div>
  );
}
