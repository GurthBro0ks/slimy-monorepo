'use client';

import Image from 'next/image';
import useFluidCanvas from '../hooks/useFluidCanvas';

type HeroProps = {
  onOpenLogin: () => void;
};

export function Hero({ onOpenLogin }: HeroProps) {
  const { canvasRef } = useFluidCanvas();

  return (
    <header className="hero">
      <canvas id="fluid-canvas" ref={canvasRef} aria-hidden="true" />
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
          <button className="primary-button" type="button" onClick={onOpenLogin}>
            Slime on
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
  );
}

export default Hero;
