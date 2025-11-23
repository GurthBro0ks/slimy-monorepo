'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

const navItems = [
  { href: '#features', label: 'Features' },
  { href: '#cases', label: 'Proof' },
  { href: '#cta', label: 'Early access' },
];

export function Nav() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogin = () => {
    setMobileMenuOpen(false);
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
      window.location.href = '/api/auth/login';
    }
  };

  const toggleMobileMenu = () => setMobileMenuOpen((prev) => !prev);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  const renderNavLinks = () =>
    navItems.map((item) => (
      <Link
        key={item.href}
        className="ghost-button"
        href={item.href}
        onClick={closeMobileMenu}
      >
        {item.label}
      </Link>
    ));

  return (
    <>
      <nav className="sticky-nav">
        <div className="nav-left">
          <div className="nav-logo">
            <Image src="/brand/slimy-mark.png" alt="Slimy logo" width={28} height={28} />
          </div>
          <span className="nav-brand">slimy.ai</span>
        </div>
        <div className="nav-actions">
          <div className="nav-links">{renderNavLinks()}</div>
          <button
            className="primary-button nav-login"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isAuthenticated ? 'Dashboard' : 'Login'}
          </button>
          <button
            className="mobile-menu-toggle"
            type="button"
            aria-label="Toggle navigation menu"
            aria-expanded={mobileMenuOpen}
            onClick={toggleMobileMenu}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </nav>
      <div className={`mobile-menu-panel ${mobileMenuOpen ? 'open' : ''}`}>
        {renderNavLinks()}
        <button
          className="primary-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : isAuthenticated ? 'Dashboard' : 'Login'}
        </button>
      </div>
    </>
  );
}

export default Nav;
