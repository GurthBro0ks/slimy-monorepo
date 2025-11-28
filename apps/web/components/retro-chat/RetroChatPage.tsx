'use client';

import React from 'react';
import Nav from '@/app/(marketing)/components/Nav';
import '@/app/(marketing)/marketing.css';
import { RetroChat } from './RetroChat';
import { useChatState } from './hooks';

export function RetroChatPage() {
   const state = useChatState('page');

   if (!state.mounted) return null;

   return (
      <>
         <Nav />

         {/* Scrolling Marquee */}
         <div className="marquee-container">
            <div className="marquee-text">Welcome to slimyai.xyz! Connect to the Grid... Latest Patch v3.0.1464 available now...</div>
         </div>

         <div className={`min-h-[calc(100vh-60px)] w-full font-mono select-none relative overflow-hidden ${state.theme === 'neon' ? '' : `theme-${state.theme}`}`}>
            {/* Slime Drip Overlay - Only show for neon theme */}
            {state.theme === 'neon' && (
               <div id="slime-overlay">
                  {Array.from({ length: Math.floor((typeof window !== 'undefined' ? window.innerWidth : 1920) / 40) }).map((_, i) => (
                     <div
                        key={i}
                        className="slime-drip"
                        style={{
                           width: `${Math.random() * 5 + 2}px`,
                           left: `${Math.random() * 100}%`,
                           height: `${Math.random() * 100 + 50}px`,
                           animationDelay: `${Math.random() * 5}s`,
                           animationDuration: `${Math.random() * 10 + 5}s`
                        }}
                     />
                  ))}
               </div>
            )}
            <RetroChat mode="page" />
         </div>
      </>
   );
}
