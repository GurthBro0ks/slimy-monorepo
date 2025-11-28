'use client';

import React, { useState } from 'react';
import { RetroChat } from './RetroChat';

export function RetroChatWidget() {
   const [isOpen, setIsOpen] = useState(false);

   if (!isOpen) {
      return (
         <button
            onClick={() => setIsOpen(true)}
            style={{
               position: 'fixed',
               bottom: '20px',
               right: '20px',
               width: '50px',
               height: '50px',
               borderRadius: '50%',
               background: '#240046',
               border: '2px solid #9d4edd',
               color: '#00ff00',
               fontSize: '24px',
               cursor: 'pointer',
               display: 'flex',
               alignItems: 'center',
               justifyContent: 'center',
               zIndex: 1080,
               boxShadow: '0 0 15px rgba(123, 44, 191, 0.4)'
            }}
            title="Open chat"
         >
            🐌
         </button>
      );
   }

   return <RetroChat mode="widget" isOpen={isOpen} onClose={() => setIsOpen(false)} />;
}
