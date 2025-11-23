'use client';

import { useState } from 'react';
import './marketing.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Features from './components/Features';
import CaseStudies from './components/CaseStudies';
import CTA from './components/CTA';
import LoginModal from './components/LoginModal';
import ChatWidget from './components/ChatWidget';

export default function MarketingPage() {
  const [loginOpen, setLoginOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('slimySession') === 'true';
  });

  const openLogin = () => setLoginOpen(true);
  const closeLogin = () => setLoginOpen(false);

  const handleLogin = () => {
    setLoginOpen(false);
    setChatOpen(true);
  };

  return (
    <>
      <Nav onOpenLogin={openLogin} />
      <main>
        <Hero onOpenLogin={openLogin} />
        <Features />
        <CaseStudies />
        <CTA onOpenLogin={openLogin} />
      </main>
      <div className="crt-overlay" aria-hidden="true" />
      <LoginModal open={loginOpen} onClose={closeLogin} onLogin={handleLogin} />
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
