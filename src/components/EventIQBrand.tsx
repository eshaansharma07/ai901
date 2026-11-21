import Image from 'next/image';
import Link from 'next/link';

export default function EventIQBrand({ className = '' }: { className?: string }) {
  return <Link href="/" className={`eventiq-brand ${className}`}>
    <Image src="/eventiq-mark.png" width={42} height={42} alt="" unoptimized />
    <span>EventIQ <small>AI</small></span>
  </Link>;
}
