'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import MatrixBackground from '@/components/MatrixBackground';
import { useAuth } from '@/hooks/useAuth';
import { SlimeLoginModal } from '@/app/_components/SlimeLoginModal';

export function Hero() {
  const router = useRouter();
  const { isAuthenticated, isLoading, role } = useAuth();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleLogin = () => {
    if (isAuthenticated) {
      // User is already authenticated, redirect to appropriate dashboard
      if (role === 'admin') {
        router.push('/guilds');
      } else if (role === 'club') {
        router.push('/club');
      } else {
        // Default for members and unknown roles
        router.push('/snail');
      }
    } else {
      // Not authenticated, open login modal
      setIsModalOpen(true);
    }
  };

  return (
    <>
      <header className="hero">
        <MatrixBackground />
        <div className="floating-sparks" aria-hidden="true" />
        <div className="hero-content">
          <div className="glow-pill" role="presentation">
            <Image src="/brand/slimy-mark.png" alt="" width={20} height={20} />
            <span>Neon-native AI workflows</span>
          </div>
          <h1 className="hero-title">SLIMY.AI</h1>
          <p className="hero-subtitle">
            A Y2K-flavored agent workspace that automates onboarding, support, and growth ops with a slime-slick UI.
            Blend retro chat vibes with modern AI orchestration.
          </p>
          <div className="hero-actions">
            <button
              className="primary-button"
              onClick={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Slime on'}
            </button>
            <a className="ghost-button" href="#features">
              See how it flows
            </a>
          </div>
          <div className="footer-marquee">
            <span className="badge">Realtime agents</span>
            <span className="badge">Playground-ready</span>
            <span className="badge">No vendor lock</span>
            <span className="badge">API-first</span>
          </div>
        </div>
      </header>

      <SlimeLoginModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
}

export default Hero;
