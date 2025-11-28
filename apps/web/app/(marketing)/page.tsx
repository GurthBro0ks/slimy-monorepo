'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import './marketing.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Features from './components/Features';
import CaseStudies from './components/CaseStudies';
import CTA from './components/CTA';
import ChatWidget from './components/ChatWidget';

export default function MarketingPage() {
  // Chat starts closed; only opens when user explicitly clicks to open it
  // This prevents hydration mismatch from localStorage reads
  const [chatOpen, setChatOpen] = useState(false);
  const pathname = usePathname();

  // Don't show chat widget on the /chat page
  const showChatWidget = pathname !== '/chat';

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
      {showChatWidget && <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} onOpen={() => setChatOpen(true)} />}
    </>
  );
}
