import React from 'react';
import { EMOJIS } from '../constants';

interface EmoticonPickerProps {
   isOpen: boolean;
   onInsertEmoticon: (emoji: string) => void;
}

export function EmoticonPicker({ isOpen, onInsertEmoticon }: EmoticonPickerProps) {
   if (!isOpen) return null;

   return (
      <div className="popup-menu" style={{ width: '240px', maxHeight: '200px', right: 'auto', left: '50%', transform: 'translateX(-50%)' }}>
         <div className="picker-grid">
            <div className="picker-tab">Snail Pack</div>
            {EMOJIS.snailPack.map((e, i) => (
               <div key={i} className="picker-item snail-combo" onClick={() => onInsertEmoticon(e)}>{e}</div>
            ))}
            <div className="picker-tab">Retro Pixels</div>
            {EMOJIS.retroPixels.map((e, i) => (
               <div key={i} className="picker-item" onClick={() => onInsertEmoticon(e)}>{e}</div>
            ))}
         </div>
      </div>
   );
}
