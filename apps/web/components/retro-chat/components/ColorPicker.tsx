import React from 'react';
import { COLORS } from '../constants';

interface ColorPickerProps {
   isOpen: boolean;
   colorMode: 'foreColor' | 'hiliteColor';
   onApplyColor: (color: string) => void;
}

export function ColorPicker({ isOpen, colorMode, onApplyColor }: ColorPickerProps) {
   if (!isOpen) return null;

   return (
      <div className="popup-menu" style={{ width: '160px', left: 0 }}>
         <div className="picker-tab">{colorMode === 'foreColor' ? 'Text Color' : 'Background'}</div>
         <div className="color-grid">
            {COLORS.map((c, i) => (
               <div key={i} className="color-swatch" style={{ backgroundColor: c }} onClick={() => onApplyColor(c)} />
            ))}
         </div>
      </div>
   );
}
