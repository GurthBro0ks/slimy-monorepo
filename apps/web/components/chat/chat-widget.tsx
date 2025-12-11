'use client';
import { useState } from 'react';
import { SlimeOnWindow } from './slime-on-window';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {isOpen && <SlimeOnWindow mode="dock" onClose={() => setIsOpen(false)} />}

      {/* Launch Bubble - Only visible when closed */}
      {!isOpen && (
        <div className="fixed bottom-4 right-4 z-[9999]">
          <button
            onClick={() => setIsOpen(true)}
            className="w-14 h-14 bg-[#240046] border-2 border-[#9d4edd] rounded-full flex items-center justify-center hover:bg-[#3c096c] hover:scale-110 transition-transform shadow-[0_0_15px_rgba(157,78,221,0.8)] relative"
          >
            <i className="fa-solid fa-comments text-[#00ff00] text-2xl"></i>
            <span className="absolute top-0 right-0 w-4 h-4 bg-[#ff0000] rounded-full border border-white animate-pulse"></span>
          </button>
        </div>
      )}
    </>
  );
}
