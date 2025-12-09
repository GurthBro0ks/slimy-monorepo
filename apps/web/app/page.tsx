"use client";

import { SlimeDrip } from "@/components/SlimeDrip";
import Image from "next/image";

export default function HomePage() {
  const handleDiscordLogin = () => {
    // FIX: Updated to correct backend route (removed /discord segment)
    window.location.href = "/api/auth/login";
  };

  return (
    <>
      <style jsx global>{`
        /* Reset and base styles for the retro homepage */
        body {
          margin: 0;
          padding: 0;
          width: 100vw;
          min-height: 100vh;
          background-color: #050010;
          background-image: linear-gradient(
              rgba(20, 0, 40, 0.8) 1px,
              transparent 1px
            ),
            linear-gradient(
              90deg,
              rgba(20, 0, 40, 0.8) 1px,
              transparent 1px
            );
          background-size: 40px 40px;
          overflow-x: hidden;
          overflow-y: auto;
          user-select: none;
          color: #e0aaff;
        }

        /* FORCE TRANSPARENCY on Snail Logos */
        img[alt="Snail"], .hero-snail img, .web-logo img {
          mix-blend-mode: screen !important;
          background-color: transparent !important;
        }

        /* Slime Drip Animation */
        #slime-overlay {
          position: absolute;
          top: 120px;
          left: 0;
          width: 100%;
          height: calc(100vh - 120px);
          pointer-events: none;
          z-index: 5;
          overflow: hidden;
        }

        .slime-drip {
          position: absolute;
          top: -100%;
          background: linear-gradient(180deg, transparent, #00ff00);
          opacity: 0.3;
          border-radius: 0 0 10px 10px;
          animation: slime-fall infinite linear;
        }

        @keyframes slime-fall {
          0% {
            top: -50%;
            opacity: 0;
          }
          20% {
            opacity: 0.5;
          }
          100% {
            top: 110%;
            opacity: 0;
          }
        }

        /* Header */
        .web-header {
          width: 100%;
          height: 60px;
          background: #10002b;
          border-bottom: 2px solid #9d4edd;
          padding: 0 20px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          box-shadow: 0 0 20px rgba(157, 78, 221, 0.3);
          position: relative;
          z-index: 10;
        }

        .web-logo {
          font-family: 'Press Start 2P', cursive;
          font-size: 24px;
          color: #00ff00;
          text-shadow: 2px 2px #ff00ff;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        .web-nav {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
          min-height: 30px;
        }

        .marquee-container {
          height: 30px;
          background: #240046;
          color: #00ff00;
          padding: 5px;
          font-size: 18px;
          border-bottom: 1px solid #5a189a;
          white-space: nowrap;
          overflow: hidden;
          line-height: 20px;
          font-family: 'VT323', monospace;
          position: relative;
        }

        .marquee-text {
          display: inline-block;
          padding-left: 100%;
          animation: marquee 20s linear infinite;
        }

        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-100%);
          }
        }

        /* Login Hero Section */
        #login-hero {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 40px 20px;
          text-align: center;
          position: relative;
          z-index: 20;
          background: rgba(5, 0, 16, 0.6);
          border-bottom: 2px solid #9d4edd;
          box-shadow: 0 4px 15px rgba(0, 0, 0, 0.5);
        }

        .hero-snail {
          width: 120px;
          height: 120px;
          /* Note: mix-blend-mode applied via global img selector above */
          filter: drop-shadow(0 0 10px #00ff00);
          margin-bottom: 20px;
        }

        .hero-title {
          font-family: 'Press Start 2P', cursive;
          font-size: 48px;
          color: #d400ff;
          text-shadow: 4px 4px 0 #00ff00, 0 0 20px #d400ff;
          margin-bottom: 10px;
        }

        .hero-slogan {
          font-family: 'VT323', monospace;
          font-size: 28px;
          color: #e0aaff;
          text-shadow: 1px 1px 0 #000;
          margin-bottom: 30px;
          max-width: 600px;
        }

        .discord-btn {
          display: flex;
          align-items: center;
          gap: 10px;
          background: #3c096c;
          border-top: 3px solid #9d4edd;
          border-left: 3px solid #9d4edd;
          border-right: 3px solid #10002b;
          border-bottom: 3px solid #10002b;
          color: #00ff00;
          font-family: 'Press Start 2P', cursive;
          font-size: 18px;
          padding: 12px 24px;
          cursor: pointer;
          text-decoration: none;
          transition: all 0.1s;
          box-shadow: 0 0 10px rgba(157, 78, 221, 0.5);
        }

        .discord-btn:hover {
          background: #5a189a;
          color: #fff;
          box-shadow: 0 0 20px rgba(157, 78, 221, 0.8);
        }

        .discord-btn:active {
          border-top: 3px solid #10002b;
          border-left: 3px solid #10002b;
          border-right: 3px solid #9d4edd;
          border-bottom: 3px solid #9d4edd;
          transform: translate(2px, 2px);
        }

        /* Feature Grid */
        .feature-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 15px;
          margin-top: 30px;
          width: 100%;
          max-width: 400px;
        }

        .feature-square {
          background: #240046;
          border: 2px solid #9d4edd;
          aspect-ratio: 1 / 1;
          position: relative;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 10px;
          cursor: pointer;
          overflow: hidden;
          transition: all 0.2s;
          box-shadow: 0 0 10px rgba(157, 78, 221, 0.3);
          text-align: center;
        }

        .feature-square:hover,
        .feature-square:active {
          border-color: #00ff00;
          box-shadow: 0 0 15px rgba(0, 255, 0, 0.5);
          transform: translateY(-2px);
        }

        .feature-content {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 10px;
          transition: opacity 0.3s;
        }

        .feature-square:hover .feature-content,
        .feature-square:active .feature-content {
          opacity: 0.1;
        }

        .feature-square i {
          font-size: 32px;
          color: #00ff00;
          text-shadow: 2px 2px #ff00ff;
        }

        .feature-title {
          font-family: 'Press Start 2P', cursive;
          font-size: 10px;
          color: #e0aaff;
          line-height: 1.4;
        }

        .feature-desc {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: rgba(16, 0, 43, 0.95);
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px;
          text-align: center;
          font-family: 'VT323', monospace;
          font-size: 20px;
          color: #00ff00;
          opacity: 0;
          transition: opacity 0.3s;
          pointer-events: none;
        }

        .feature-square:hover .feature-desc,
        .feature-square:active .feature-desc {
          opacity: 1;
        }

        /* Footer */
        .web-footer {
          position: relative;
          margin-top: auto;
          width: 100%;
          background: #10002b;
          border-top: 2px solid #9d4edd;
          padding: 15px 20px;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          gap: 10px;
          z-index: 50;
          box-shadow: 0 -4px 20px rgba(157, 78, 221, 0.4);
          font-family: 'VT323', monospace;
        }

        .footer-text {
          color: #fff;
          font-size: 18px;
          text-transform: uppercase;
          letter-spacing: 1px;
          text-shadow: 1px 1px 0 #000;
        }

        .footer-copy {
          color: #9d4edd;
          font-size: 14px;
        }

        /* Responsive adjustments */
        @media (max-width: 768px) {
          .hero-title {
            font-size: 32px;
          }
          .hero-slogan {
            font-size: 22px;
          }
          .discord-btn {
            font-size: 14px;
            padding: 10px 20px;
          }
          .web-logo {
            font-size: 18px;
          }
        }
      `}</style>

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          minHeight: "100vh",
        }}
      >
        {/* Header */}
        <header className="web-header">
          <div className="web-logo">
            <div
              style={{
                width: 32,
                height: 32,
                position: "relative",
              }}
            >
              <Image
                src="/brand/snail-glitch.png"
                alt="Snail"
                width={32}
                height={32}
                style={{ objectFit: "contain" }}
              />
            </div>
            slimyai.xyz
          </div>
          {/* Placeholder space for future links */}
          <nav className="web-nav"></nav>
        </header>

        {/* Marquee */}
        <div className="marquee-container">
          <div className="marquee-text">
            Welcome to slimyai.xyz! Connect to the Grid... Latest Patch v3.0.1464
            available now...
          </div>
        </div>

        {/* Slime Drip Overlay */}
        <SlimeDrip />

        {/* Login Hero Section */}
        <div id="login-hero">
          <div className="hero-snail">
            <Image
              src="/brand/snail-glitch.png"
              alt="Snail"
              width={120}
              height={120}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div className="hero-title">slimy.ai</div>
          <div className="hero-slogan">
            fueled by{" "}
            <span style={{ color: "#ff00ff", textShadow: "0 0 5px #ff00ff" }}>
              adhd
            </span>{" "}
            &mdash; driven by{" "}
            <span style={{ color: "#00ffff", textShadow: "0 0 5px #00ffff" }}>
              feet
            </span>{" "}
            &mdash; motivated by{" "}
            <span style={{ color: "#ffff00", textShadow: "0 0 5px #ffff00" }}>
              ducks
            </span>
          </div>
          <button className="discord-btn" onClick={handleDiscordLogin}>
            <i className="fa-brands fa-discord"></i> Discord Login
          </button>

          {/* Feature Grid - Cosmetic Only */}
          <div className="feature-grid">
            <button type="button" className="feature-square">
              <div className="feature-content">
                <i className="fa-solid fa-toolbox"></i>
                <div className="feature-title">Personal Snail Tools</div>
              </div>
              <div className="feature-desc">
                Analyze screenshots, calculate tier costs, and access secret
                codes for Super Snail.
              </div>
            </button>

            <button type="button" className="feature-square">
              <div className="feature-content">
                <i className="fa-solid fa-chart-line"></i>
                <div className="feature-title">Club Analytics</div>
              </div>
              <div className="feature-desc">
                Track club performance, analyze member stats, and optimize
                strategies.
              </div>
            </button>

            <button type="button" className="feature-square">
              <div className="feature-content">
                <i className="fa-solid fa-comments"></i>
                <div className="feature-title">Slime Chat</div>
              </div>
              <div className="feature-desc">
                AI-powered conversations with personality modes and context
                awareness.
              </div>
            </button>

            <button type="button" className="feature-square">
              <div className="feature-content">
                <i className="fa-solid fa-shield-halved"></i>
                <div className="feature-title">Admin Panel</div>
              </div>
              <div className="feature-desc">
                Manage guilds, configure settings, and monitor bot health.
              </div>
            </button>
          </div>
        </div>

        {/* Footer */}
        <footer className="web-footer">
          <div className="footer-text">Enter the Slime Matrix</div>
          <div className="footer-copy">&copy; 2025 slimyai.xyz</div>
        </footer>
      </div>
    </>
  );
}
