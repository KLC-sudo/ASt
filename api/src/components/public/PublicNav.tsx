'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/events', label: 'Events' },
  { href: '/order', label: 'My Order' },
];

export function PublicNav() {
  const pathname = usePathname();
  return (
    <nav className="flex items-center gap-7">
      {LINKS.map((link) => {
        const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href + '/'));
        return (
          <Link
            key={link.href}
            href={link.href}
            className={`text-xs tracking-[0.2em] uppercase transition-colors ${
              isActive ? 'text-mustard' : 'text-white/55 hover:text-offwhite'
            }`}
          >
            {link.label}
          </Link>
        );
      })}
    </nav>
  );
}
