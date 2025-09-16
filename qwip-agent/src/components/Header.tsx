'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NavLink = ({ href, label }: { href: string; label: string }) => {
  const pathname = usePathname();
  const active = pathname === href;
  return (
    <Link
      href={href}
      className={`px-3 py-2 rounded-md text-sm font-medium ${
        active ? 'bg-black text-white' : 'text-black/70 hover:bg-black/5'
      }`}
    >
      {label}
    </Link>
  );
};

export default function Header() {
  return (
    <header className="w-full border-b bg-white/70 backdrop-blur">
      <div className="mx-auto max-w-6xl flex items-center justify-between px-4 py-3">
        <Link href="/" className="font-semibold text-xl">Qwip</Link>
        <nav className="flex items-center gap-1">
          <NavLink href="/" label="Home" />
          <NavLink href="/vitrine" label="Vitrine" />
          <NavLink href="/dashboard" label="Dashboard" />
        </nav>
      </div>
    </header>
  );
}
