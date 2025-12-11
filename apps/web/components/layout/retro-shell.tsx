'use client';
import React, { useEffect, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ChatWidget } from '../chat/chat-widget';

export function RetroShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const slimeContainerRef = useRef<HTMLDivElement>(null);

  const isLoginPage = pathname === '/';
  const isAuthCallback = pathname.startsWith('/api/auth');
  const isChatPage = pathname === '/chat';
  
  const showHeader = !isAuthCallback;
  const showNav = !isLoginPage && !isAuthCallback;
  const showWidget = !isLoginPage && !isChatPage && !isAuthCallback;

  let marqueeText = "slimyai.xyz System Operational.";
  if (isLoginPage) marqueeText = "Welcome to slimyai.xyz! Connect to the Grid... Latest Patch v3.0.1464 available now...";
  else if (pathname === '/dashboard') marqueeText = "Dashboard Loaded. System Metrics: Nominal. Welcome back, user.";
  else if (pathname === '/club') marqueeText = "Club Analytics Active. Upload baseline data to compare stats.";
  else if (pathname === '/chat') marqueeText = "Secure Channel Established. Encryption: ENABLED.";

  useEffect(() => {
    if (!slimeContainerRef.current) return;
    const container = slimeContainerRef.current;
    if (container.childElementCount > 0) return;
    
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
     try { await fetch('/api/auth/logout', { method: 'POST' }); } catch (e) {}
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
          padding-top: 100px;
        }
        img[alt="Snail"], .web-logo img { mix-blend-mode: screen !important; background: transparent !important; }
        
        .web-header { 
          position: fixed; top: 0; left: 0; width: 100%; height: 60px; 
          background: #10002b; border-bottom: 2px solid #9d4edd; 
          padding: 0 20px; 
          display: grid; 
          grid-template-columns: 1fr auto 1fr; /* Centered Logo Layout */
          align-items: center;
          box-shadow: 0 0 20px rgba(157, 78, 221, 0.3); z-index: 1000;
        }
        .web-logo { 
          grid-column: 2; 
          font-family: 'Press Start 2P', cursive; font-size: 24px; color: #00ff00; 
          text-shadow: 2px 2px #ff00ff; display: flex; align-items: center; gap: 10px; text-decoration: none;
          justify-self: center;
        }
        .web-nav { 
          grid-column: 3; 
          display: flex; gap: 10px; justify-self: end; 
        } 
        .nav-btn {
          background: #240046; border: 2px solid #9d4edd; 
          color: #e0aaff; font-family: 'VT323', monospace; font-size: 18px; padding: 4px 12px; 
          cursor: pointer; text-decoration: none; transition: all 0.2s;
        }
        .nav-btn:hover { background-color: #3c096c; color: #fff; text-shadow: 0 0 5px #fff; border-color: #00ff00; }
        
        .marquee-container { 
            position: fixed; top: 60px; left: 0; width: 100%; 
            height: 30px; /* Fixed Height */
            background: #240046; color: #00ff00; padding: 4px 0; 
            border-bottom: 1px solid #5a189a; 
            overflow: hidden; 
            white-space: nowrap; /* Single Line */
            line-height: 22px; 
            z-index: 900;
            font-size: 18px;
        }
        .marquee-text { display: inline-block; padding-left: 100%; animation: marquee 20s linear infinite; }
        @keyframes marquee { 0% { transform: translateX(0); } 100% { transform: translateX(-100%); } }

        #slime-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100vh; pointer-events: none; z-index: 1; overflow: hidden; }
        .slime-drip {
          position: absolute; top: -100%; background: linear-gradient(180deg, transparent, #00ff00);
          opacity: 0.3; border-radius: 0 0 10px 10px; animation: slime-fall infinite linear;
        }
        @keyframes slime-fall { 0% { top: -50%; opacity: 0; } 20% { opacity: 0.5; } 100% { top: 110%; opacity: 0; } }

        .web-footer {
          margin-top: auto; width: 100%; background: #10002b;
          border-top: 2px solid #9d4edd; padding: 15px 20px;
          display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px;
          z-index: 50;
        }
        .footer-text { color: #fff; font-size: 18px; text-transform: uppercase; letter-spacing: 1px; text-shadow: 1px 1px 0 #000; }
        .footer-copy { color: #9d4edd; font-size: 14px; }
      `}</style>

      <header className="web-header">
        <div></div> 
        <Link href="/" className="web-logo">
           <div style={{ width: 32, height: 32, position: "relative" }}>
             <Image src="/brand/snail-glitch.png" alt="Snail" width={32} height={32} style={{ objectFit: "contain" }} />
           </div>
           slimyai.xyz
        </Link>
        
        {showNav ? (
          <nav className="web-nav">
              <Link href="/dashboard" className="nav-btn">Dashboard</Link>
              <Link href="/chat" className="nav-btn">Chat</Link>
              <Link href="/club" className="nav-btn">Club</Link>
              <button onClick={handleLogout} className="nav-btn">Log Out</button>
          </nav>
        ) : (
          <div></div> 
        )}
      </header>

      <div className="marquee-container">
         <div className="marquee-text">{marqueeText}</div>
      </div>

      <div id="slime-overlay" ref={slimeContainerRef}></div>

      <div style={{ position: 'relative', zIndex: 10, minHeight: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
        <div style={{ flex: 1 }}>{children}</div>
        <footer className="web-footer">
          <div className="footer-text">Enter the Slime Matrix</div>
          <div className="footer-copy">&copy; 2025 slimyai.xyz</div>
        </footer>
      </div>

      {showWidget && <ChatWidget />}
    </>
  );
}
