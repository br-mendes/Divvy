import Link from 'next/link';

type Props = {
  className?: string;
  compact?: boolean;
};

export default function StaticPageLinks({ className, compact }: Props) {
  const style: React.CSSProperties = {
    display: 'flex',
    gap: compact ? 10 : 14,
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: compact ? 'flex-start' : 'center',
    fontSize: 14,
    opacity: 0.85,
    marginTop: compact ? 10 : 16,
  };

  const linkStyle: React.CSSProperties = {
    textDecoration: 'underline',
  };

  return (
    <div className={className} style={style} aria-label='Links institucionais'>
      <Link href='/about' style={linkStyle}>Sobre</Link>
      <Link href='/faq' style={linkStyle}>FAQ</Link>
      <Link href='/privacy' style={linkStyle}>Privacidade</Link>
      <Link href='/terms' style={linkStyle}>Termos</Link>
    </div>
  );
}
