'use client';

import { useEffect, useState } from 'react';
import './marketing.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Features from './components/Features';
import CaseStudies from './components/CaseStudies';
import CTA from './components/CTA';
import ChatWidget from './components/ChatWidget';

export default function MarketingPage() {
  const [chatOpen, setChatOpen] = useState(false);
  const [chatAllowed, setChatAllowed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const syncChatAccess = () => {
      const isLoggedIn = localStorage.getItem('isLoggedIn') === 'true';
      setChatAllowed(isLoggedIn);
      setChatOpen(isLoggedIn);
    };
    syncChatAccess();
    window.addEventListener('storage', syncChatAccess);
    return () => window.removeEventListener('storage', syncChatAccess);
  }, []);

  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Features />
        <CaseStudies />
        <CTA />
      </main>
      <div className="crt-overlay" aria-hidden="true" />
      <ChatWidget open={chatAllowed && chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
