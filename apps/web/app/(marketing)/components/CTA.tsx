'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';

export function CTA() {
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
    <section id="cta" className="section cta">
      <Image src="/brand/slimy-logo.png" alt="Slimy wordmark" width={280} height={120} />
      <h2 className="section-title">Let your agents get a little slimy</h2>
      <p className="section-subtitle">
        Wire up your tools, drop in your playbooks, and ship an on-brand neon agent in hours—not weeks.
      </p>
      <div className="cta-actions">
        <button
          className="primary-button"
          onClick={handleLogin}
          disabled={isLoading}
        >
          {isLoading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Launch Slimy'}
        </button>
        <a className="ghost-button" href="mailto:hey@slimy.ai">
          Talk to a human
        </a>
      </div>
    </section>
  );
}

export default CTA;
