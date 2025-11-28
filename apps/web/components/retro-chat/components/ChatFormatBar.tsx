import React from 'react';
import { EmoticonPicker } from './EmoticonPicker';
import { ColorPicker } from './ColorPicker';

interface ChatFormatBarProps {
   showEmoticonPicker: boolean;
   showColorPicker: boolean;
   currentColorMode: 'foreColor' | 'hiliteColor';
   onOpenColorPicker: (e: React.MouseEvent, mode: 'foreColor' | 'hiliteColor') => void;
   onToggleEmoticons: (e: React.MouseEvent) => void;
   onFormatDoc: (cmd: string, val?: string) => void;
   onAddLink: () => void;
   onInsertEmoticon: (emoji: string) => void;
   onApplyColor: (color: string) => void;
}

export function ChatFormatBar({
   showEmoticonPicker,
   showColorPicker,
   currentColorMode,
   onOpenColorPicker,
   onToggleEmoticons,
   onFormatDoc,
   onAddLink,
   onInsertEmoticon,
   onApplyColor
}: ChatFormatBarProps) {
   return (
      <div className="format-bar">
         <div className="fmt-btn" onClick={(e) => onOpenColorPicker(e, 'foreColor')} title="Text Color">A</div>
         <div className="fmt-btn" onClick={(e) => onOpenColorPicker(e, 'hiliteColor')} title="Background">⬛</div>
         <div style={{ width: '2px', height: '20px', background: '#9d4edd', margin: '0 4px' }} />
         <div className="fmt-btn" onClick={() => onFormatDoc('bold')}>B</div>
         <div className="fmt-btn" onClick={() => onFormatDoc('italic')}>I</div>
         <div className="fmt-btn" onClick={() => onFormatDoc('underline')}>U</div>
         <div className="fmt-btn" onClick={onAddLink}>Link</div>
         <div className="fmt-btn" onClick={onToggleEmoticons}>:)</div>

         <EmoticonPicker isOpen={showEmoticonPicker} onInsertEmoticon={onInsertEmoticon} />
         <ColorPicker isOpen={showColorPicker} colorMode={currentColorMode} onApplyColor={onApplyColor} />
      </div>
   );
}
