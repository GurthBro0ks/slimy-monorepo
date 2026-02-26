'use client';
import React, { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';


export function RetroShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const slimeContainerRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/';
  const isAuthCallback = pathname.startsWith('/api/auth');
  // chat removed
  
  const isMissionControl = pathname.startsWith("/mission-control");
  if (isMissionControl) return <>{children}</>;
  const showHeader = !isAuthCallback;
  const showNav = !isLoginPage && !isAuthCallback;
  const showWidget = false; // chat removed

  let marqueeText = "slimyai.xyz System Operational.";
  if (isLoginPage) marqueeText = "Welcome to slimyai.xyz! Connect to the Grid...";
  else if (pathname === '/login-landing') marqueeText = "Dashboard Loaded. Metrics: Nominal.";
  else if (pathname === '/club') marqueeText = "Club Analytics Active. Upload baseline data.";
  
  else if (pathname.startsWith('/admin')) marqueeText = "Admin Control Panel Activated. System Administration Mode.";

  useEffect(() => {
    if (!slimeContainerRef.current) return;
    const container = slimeContainerRef.current;
    container.innerHTML = ''; 
    const dripCount = Math.floor(window.innerWidth / 40);
    for (let i = 0; i < dripCount; i++) {
      const drip = document.createElement('div');
      drip.className = 'slime-drip';
      drip.style.width = Math.random() * 5 + 2 + 'px';
      drip.style.left = Math.random() * 100 + '%';
      drip.style.height = Math.random() * 100 + 50 + 'px';
      drip.style.animationDelay = Math.random() * 5 + 's';
      drip.style.animationDuration = Math.random() * 10 + 5 + 's';
      container.appendChild(drip);
    }
  }, [pathname]);

  const handleLogout = async () => {
     try { await fetch('/api/auth/logout', { method: 'POST' }); } catch {
       // Ignore logout errors
     }
     window.location.href = "/?logged_out=true";
  };

  if (!showHeader) return <>{children}</>;

  return (
    <>
      <style jsx global>{`
        body {
          margin: 0; padding: 0; width: 100vw; min-height: 100vh;
          background-color: #050010; 
          background-image: linear-gradient(rgba(20, 0, 40, 0.8) 1px, transparent 1px), 
                            linear-gradient(90deg, rgba(20, 0, 40, 0.8) 1px, transparent 1px);
          background-size: 40px 40px; font-family: 'VT323', monospace; color: #e0aaff;
          padding-top: 150px; 
        }
        img[alt="Snail"], .web-logo img { mix-blend-mode: screen !important; background: transparent !important; }
        
        .web-header { 
          position: fixed; top: 0; left: 0; width: 100%; height: auto; min-height: 100px;
          background: #10002b; border-bottom: 2px solid #9d4edd; 
          padding: 15px 0; 
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
          box-shadow: 0 0 20px rgba(157, 78, 221, 0.3); z-index: 1000;
        }
        .web-logo { 
          font-family: 'Press Start 2P', cursive; font-size: 24px; color: #00ff00; 
          text-shadow: 2px 2px #ff00ff; display: flex; align-items: center; gap: 10px; text-decoration: none;
        }
        .web-nav { display: flex; gap: 15px; flex-wrap: wrap; justify-content: center; } 
        .nav-btn {
          background: #240046; border: 2px solid #9d4edd; 
          color: #e0aaff; font-family: 'VT323', monospace; font-size: 20px; padding: 5px 15px; 
          cursor: pointer; text-decoration: none; transition: all 0.2s;
        }
        .nav-btn:hover { background-color: #3c096c; color: #fff; text-shadow: 0 0 5px #fff; border-color: #00ff00; }
        
        .marquee-container { 
            position: fixed; top: 110px; left: 0; width: 100%; 
            height: 44px; 
            background: #240046; color: #00ff00; 
            border-bottom: 1px solid #5a189a; 
            z-index: 900;
            display: flex; align-items: center; 
            overflow: hidden;
        }
        .marquee-text-wrapper {
            width: 100%;
            white-space: nowrap;
            overflow: hidden;
            display: flex;
            align-items: center;
            height: 100%;
        }
        .marquee-text {
            display: inline-block;
            white-space: nowrap;
            animation: marquee 20s linear infinite;
            font-size: 24px;
            line-height: 1.2;
            padding-top: 0;
        }
        @keyframes marquee {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
        }

        #slime-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; pointer-events: none; z-index: 1; overflow: hidden; }
        .slime-drip { position: absolute; top: -100%; background: linear-gradient(180deg, transparent, #00ff00); opacity: 0.3; border-radius: 0 0 10px 10px; animation: slime-fall infinite linear; }
        @keyframes slime-fall { 0% { top: -50%; opacity: 0; } 20% { opacity: 0.5; } 100% { top: 110%; opacity: 0; } }

        .web-footer { margin-top: auto; width: 100%; background: #10002b; border-top: 2px solid #9d4edd; padding: 15px 20px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; z-index: 50; }
        .footer-text { color: #fff; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 1px 1px 0 #000; }
        .footer-copy { color: #9d4edd; font-size: 14px; }
      `}</style>

      <header className="web-header">
        <Link href="/" className="web-logo"><div style={{ width: 32, height: 32, position: "relative" }}><Image src="/brand/snail-glitch.png" alt="Snail" width={32} height={32} style={{ objectFit: "contain" }} /></div>slimyai.xyz</Link>
        {showNav && <nav className="web-nav"><Link href="/login-landing" className="nav-btn">Dashboard</Link><Link href="/mission-control" className="nav-btn">Mission Control</Link><button onClick={handleLogout} className="nav-btn">Log Out</button></nav>}
      </header>

      <div className="marquee-container">
         <div className="marquee-text-wrapper">
            <div className="marquee-text">{marqueeText}</div>
         </div>
      </div>

      <div id="slime-overlay" ref={slimeContainerRef}></div>
      <div style={{ position: 'relative', zIndex: 10, minHeight: '50vh', display: 'flex', flexDirection: 'column' }}><div style={{ flex: 1 }}>{children}</div><footer className="web-footer"><div className="footer-text">Enter the Slime Matrix</div><div className="footer-copy">&copy; 2025 slimyai.xyz</div></footer></div>
      {/* ChatWidget removed */}
    </>
  );
}
