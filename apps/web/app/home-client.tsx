"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth/context";
import Image from "next/image";

export default function HomeClient() {
  const { user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isRedirecting, setIsRedirecting] = useState(false);

  useEffect(() => {
    if (searchParams.get('logged_out')) return;
    if (!isLoading && user) {
      setIsRedirecting(true);
      router.push("/dashboard");
    }
  }, [user, isLoading, router, searchParams]);

  if (isRedirecting) {
    return <div className="flex h-screen items-center justify-center text-[#00ff00] font-mono text-xl">INITIALIZING_DASHBOARD...</div>;
  }

  return (
    <>
      <style jsx global>{`
        #login-hero { display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 80px 20px; text-align: center; position: relative; z-index: 20; }
        .hero-snail { width: 120px; height: 120px; margin-bottom: 20px; }
        .hero-title { font-family: 'Press Start 2P', cursive; font-size: 48px; color: #d400ff; text-shadow: 4px 4px 0 #00ff00, 0 0 20px #d400ff; margin-bottom: 10px; }
        .hero-slogan { font-family: 'VT323', monospace; font-size: 28px; color: #e0aaff; text-shadow: 1px 1px 0 #000; margin-bottom: 30px; max-width: 600px; }
        .discord-btn { display: flex; align-items: center; gap: 10px; background: #3c096c; border: 3px solid #9d4edd; border-right-color: #10002b; border-bottom-color: #10002b; color: #00ff00; font-family: 'Press Start 2P', cursive; font-size: 18px; padding: 12px 24px; cursor: pointer; transition: all 0.1s; box-shadow: 0 0 10px rgba(157, 78, 221, 0.5); }
        .discord-btn:hover { background: #5a189a; color: #fff; box-shadow: 0 0 20px rgba(157, 78, 221, 0.8); }
        .discord-btn:active { transform: translate(2px, 2px); }
        .feature-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-top: 30px; width: 100%; max-width: 400px; }
        .feature-square { background: #240046; border: 2px solid #9d4edd; aspect-ratio: 1 / 1; position: relative; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 10px; cursor: pointer; overflow: hidden; transition: all 0.2s; box-shadow: 0 0 10px rgba(157, 78, 221, 0.3); text-align: center; }
        .feature-square:hover { border-color: #00ff00; box-shadow: 0 0 15px rgba(0, 255, 0, 0.5); transform: translateY(-2px); }
        .feature-content { display: flex; flex-direction: column; align-items: center; gap: 10px; transition: opacity 0.3s; }
        .feature-square:hover .feature-content { opacity: 0.1; }
        .feature-square i { font-size: 32px; color: #00ff00; text-shadow: 2px 2px #ff00ff; }
        .feature-title { font-family: 'Press Start 2P', cursive; font-size: 10px; color: #e0aaff; line-height: 1.4; }
        .feature-desc { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(16, 0, 43, 0.95); display: flex; align-items: center; justify-content: center; padding: 10px; text-align: center; font-family: 'VT323', monospace; font-size: 20px; color: #00ff00; opacity: 0; transition: opacity 0.3s; pointer-events: none; }
        .feature-square:hover .feature-desc { opacity: 1; }
      `}</style>
      <div id="login-hero">
        <div className="hero-snail"><Image src="/brand/snail-glitch.png" alt="Snail" width={120} height={120} style={{ objectFit: "contain" }} /></div>
        <div className="hero-title">slimy.ai</div>
        <div className="hero-slogan">fueled by <span style={{ color: "#ff00ff" }}>adhd</span> &mdash; driven by <span style={{ color: "#00ffff" }}>feet</span> &mdash; motivated by <span style={{ color: "#ffff00" }}>ducks</span></div>
        <a href="http://localhost:3001" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button className="discord-btn" style={{ background: '#0a4a0a', borderColor: '#00ff00 #002200 #002200 #00ff00' }}>
            <i className="fa-solid fa-comments"></i> Chat Login
          </button>
        </a>
        <div className="feature-grid">
          <button className="feature-square"><div className="feature-content"><i className="fa-solid fa-toolbox"></i><div className="feature-title">Snail Tools</div></div><div className="feature-desc">Analyze screenshots & calculate stats.</div></button>
          <button className="feature-square"><div className="feature-content"><i className="fa-solid fa-chart-line"></i><div className="feature-title">Analytics</div></div><div className="feature-desc">Track club performance.</div></button>
          <button className="feature-square"><div className="feature-content"><i className="fa-solid fa-comments"></i><div className="feature-title">Chat</div></div><div className="feature-desc">AI-powered conversations.</div></button>
          <button className="feature-square"><div className="feature-content"><i className="fa-solid fa-shield-halved"></i><div className="feature-title">Admin</div></div><div className="feature-desc">Manage guilds & settings.</div></button>
        </div>
      </div>
    </>
  );
}
