import React from 'react';
import type { TextSize } from '../types';

interface ChatContentProps {
   history: string;
   textSize: TextSize;
   showTimestamps: boolean;
   chatEndRef: React.RefObject<HTMLDivElement | null>;
}

export function ChatContent({ history, textSize, showTimestamps, chatEndRef }: ChatContentProps) {
   return (
      <>
         <div
            className={`inset-box chat-history text-${textSize} ${showTimestamps ? 'show-timestamps' : ''}`}
            dangerouslySetInnerHTML={{ __html: history }}
         />
         <div ref={chatEndRef} />
      </>
   );
}
