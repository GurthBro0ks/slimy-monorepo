'use client';
import { useState } from 'react';
import { SlimeOnWindow } from './slime-on-window';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <SlimeOnWindow mode="dock" onClose={() => setIsOpen(false)} />}

      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="w-16 h-16 bg-[#7b2cbf] border-2 border-[#e0aaff] rounded-full flex items-center justify-center hover:bg-[#9d4edd] hover:scale-110 transition-transform shadow-[0_0_15px_rgba(123,44,191,0.8)] cursor-pointer"
          title="Open Chat"
        >
          <i className="fa-solid fa-comments text-white text-3xl"></i>
          <span className="absolute top-0 right-0 w-5 h-5 bg-[#00ff00] rounded-full border border-black animate-pulse"></span>
        </button>
      )}
    </>
  );
}
