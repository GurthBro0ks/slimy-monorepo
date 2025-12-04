'use client';

import React from 'react';
import { RetroChat } from '@/components/retro-chat/RetroChat';
import { useChatState } from '@/components/retro-chat/hooks';

export default function ChatPage() {
   const state = useChatState('page');

   if (!state.mounted) return null;

   return (
      <div className="flex-1 flex flex-col">
         {/* Scrolling Marquee */}
         <div className="h-8 bg-[#240046] border-b border-[#5a189a] text-[#00ff00] flex items-center overflow-hidden whitespace-nowrap">
            <div className="animate-marquee pl-4">
               Welcome to slimyai.xyz! Connect to the Grid... Latest Patch v3.0.1464 available now...
            </div>
         </div>

         <div className={`flex-1 w-full font-mono select-none relative overflow-hidden ${state.theme === 'neon' ? '' : `theme-${state.theme}`}`}>
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
      </div>
   );
}
