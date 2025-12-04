'use client';

import { usePathname } from 'next/navigation';
import './marketing.css';
import Nav from './components/Nav';
import Hero from './components/Hero';
import Features from './components/Features';
import CaseStudies from './components/CaseStudies';
import CTA from './components/CTA';
import ChatWidget from '@/components/ChatWidget';

export default function MarketingPage() {
  const pathname = usePathname();

  // Don't show chat widget on the landing page (/) or /chat page
  // Chat widgets are handled by AppShell for authenticated users
  const showChatWidget = false;

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
      {showChatWidget && <ChatWidget />}
    </>
  );
}
