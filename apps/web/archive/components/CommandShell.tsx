'use client';

import React, { useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/context';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChatWidget } from './ChatWidget';

type CommandShellProps = {
  title: string;
  breadcrumbs: string;
  statusText?: string;
  children: React.ReactNode;
};

const NAV_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/analytics', label: 'Analytics' },
  { href: '/club', label: 'Club' },
  { href: '/snail', label: 'Snail' },
  { href: '/settings', label: 'Settings' },
];

export function CommandShell({ title, breadcrumbs, statusText = 'System Status: Online', children }: CommandShellProps) {
  const { logout } = useAuth();
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const pathname = usePathname();

  // Background particles
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = window.innerWidth;
    let height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;

    type Particle = { x: number; y: number; vx: number; vy: number; size: number };
    let particles: Particle[] = [];

    const initParticles = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      canvas.width = width;
      canvas.height = height;
      particles = [];
      const density = Math.floor((width * height) / 20000);
      for (let i = 0; i < density; i += 1) {
        particles.push({
          x: Math.random() * width,
          y: Math.random() * height,
          vx: (Math.random() - 0.5) * 0.2,
          vy: (Math.random() - 0.5) * 0.2,
          size: Math.random() * 2,
        });
      }
    };

    initParticles();
    const handleResize = () => initParticles();
    window.addEventListener('resize', handleResize);

    let animationFrame: number;
    const animate = () => {
      ctx.clearRect(0, 0, width, height);
      ctx.fillStyle = '#3DFF8C';
      ctx.globalAlpha = 0.2;

      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = width;
        if (p.x > width) p.x = 0;
        if (p.y < 0) p.y = height;
        if (p.y > height) p.y = 0;
        ctx.fillRect(p.x, p.y, p.size, p.size);
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(animationFrame);
    };
  }, []);

  return (
    <>
      <div className="crt-overlay" />

      <nav className="sticky-nav">
        <div className="nav-left">
          <Link href="/dashboard" className="nav-logo">
            <span style={{ fontSize: '1.5rem', marginRight: '5px' }} aria-hidden="true">
              🐌
            </span>
            slimy.ai
          </Link>

          <div className="nav-links">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href || (link.href !== '/dashboard' && pathname?.startsWith(link.href));
              return (
                <Link key={link.href} href={link.href} className={isActive ? 'active' : ''}>
                  {link.label}
                </Link>
              );
            })}
          </div>
        </div>

        <div className="nav-user">
          <span className="user-pill">User #8841</span>
          <button className="btn-logout" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </nav>

      <canvas id="fluid-canvas" ref={canvasRef} />

      <div className="dashboard-wrapper">
        <div className="container">
          <div className="page-header">
            <div>
              <div className="page-breadcrumbs">{breadcrumbs}</div>
              <h1 className="page-title">{title}</h1>
            </div>
            <div style={{ color: 'var(--neon-green)', fontFamily: 'var(--font-pixel)' }}>{statusText}</div>
          </div>
          {children}
        </div>
      </div>

      <ChatWidget />
    </>
  );
}

export default CommandShell;
