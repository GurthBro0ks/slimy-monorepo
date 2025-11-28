import React from 'react';

interface ChatInputProps {
   inputRef: React.RefObject<HTMLDivElement | null>;
   onKeyDown: (e: React.KeyboardEvent) => void;
   onSendMessage: () => void;
}

export function ChatInput({ inputRef, onKeyDown, onSendMessage }: ChatInputProps) {
   return (
      <div className="input-row">
         <div
            ref={inputRef}
            className="input-box"
            contentEditable
            onKeyDown={onKeyDown}
            suppressContentEditableWarning
         />
         <button className="send-btn" onClick={onSendMessage}>SEND</button>
      </div>
   );
}
