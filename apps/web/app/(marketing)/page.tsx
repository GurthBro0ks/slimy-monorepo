'use client';

import { useState } from 'react';
import './marketing.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Features from './components/Features';
import CaseStudies from './components/CaseStudies';
import CTA from './components/CTA';
import ChatWidget from './components/ChatWidget';

export default function MarketingPage() {
  const [chatOpen, setChatOpen] = useState(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('slimySession') === 'true';
  });

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
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />
    </>
  );
}
