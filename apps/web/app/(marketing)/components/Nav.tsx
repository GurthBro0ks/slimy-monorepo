'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function Nav() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();

  const handleLogin = () => {
    if (isAuthenticated) {
      // User is already authenticated, redirect to appropriate dashboard
      if (role === 'admin') {
        router.push('/admin');
      } else if (role === 'club') {
        router.push('/club');
      } else if (role === 'member') {
        router.push('/snail');
      } else {
        router.push('/guilds');
      }
    } else {
      // Not authenticated, proceed to login
      window.location.href = '/api/auth/discord/login';
    }
  };

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
        <a
          className="ghost-button"
          href="http://localhost:3001"
          target="_blank"
          rel="noopener noreferrer"
        >
          Chat Login
        </a>
        <button
          className="primary-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : isAuthenticated ? 'Dashboard' : 'Login'}
        </button>
      </div>
    </nav>
  );
}

export default Nav;
