'use client';

import { useRouter } from 'next/navigation';
import useFluidCanvas from '../hooks/useFluidCanvas';
import { useAuth } from '@/hooks/useAuth';

export function Hero() {
  const { canvasRef } = useFluidCanvas();
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
      window.location.href = '/api/auth/login';
    }
  };

  return (
    <header className="hero">
      <canvas id="fluid-canvas" ref={canvasRef} aria-hidden="true" />
      <div className="floating-sparks" aria-hidden="true" />
      <div className="hero-content">
        <h1 className="hero-title">SLIMY.AI</h1>
        <div className="hero-actions">
          <button
            className="primary-button slime-on-button"
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Loading...' : isAuthenticated ? 'Go to Dashboard' : 'Slime on'}
          </button>
        </div>
        <div className="footer-marquee">
          <span className="badge">Discord Analytics</span>
          <span className="badge">Club Management</span>
          <span className="badge">Snelp Codes</span>
          <span className="badge">Admin Dashboard</span>
        </div>
      </div>
    </header>
  );
}

export default Hero;
