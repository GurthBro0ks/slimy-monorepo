import React from 'react';

interface ChatTitleBarProps {
   mode: 'widget' | 'page';
   onClose?: () => void;
}

export function ChatTitleBar({ mode, onClose }: ChatTitleBarProps) {
   return (
      <div className="title-bar">
         <span>slime.on</span>
         {mode === 'widget' && onClose && (
            <button
               onClick={onClose}
               style={{
                  background: '#240046',
                  border: '1px solid #9d4edd',
                  color: '#00ff00',
                  cursor: 'pointer',
                  fontSize: '14px',
                  padding: '2px 6px'
               }}
            >
               ✕
            </button>
         )}
      </div>
   );
}
