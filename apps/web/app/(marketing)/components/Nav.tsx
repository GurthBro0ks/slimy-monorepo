'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';

type NavProps = {
  onOpenLogin: () => void;
};

export function Nav({ onOpenLogin }: NavProps) {
  const loginUrl = useMemo(() => process.env.NEXT_PUBLIC_LOGIN_URL, []);

  return (
    <nav className="sticky-nav">
      <div className="nav-left">
        <div className="nav-logo">
          <Image src="/brand/slimy-mark.png" alt="Slimy logo" width={28} height={28} />
        </div>
        <span className="nav-brand">slimy.ai</span>
      </div>
      <div className="nav-actions">
        <Link className="ghost-button" href="#features">
          Features
        </Link>
        <Link className="ghost-button" href="#cases">
          Proof
        </Link>
        <Link className="ghost-button" href="#cta">
          Early access
        </Link>
        {loginUrl ? (
          <a className="primary-button" href={loginUrl}>
            Login
          </a>
        ) : (
          <button className="primary-button" type="button" onClick={onOpenLogin}>
            Login
          </button>
        )}
      </div>
    </nav>
  );
}

export default Nav;
