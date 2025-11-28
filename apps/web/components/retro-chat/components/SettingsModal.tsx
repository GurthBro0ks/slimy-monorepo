import React from 'react';
import type { Settings, Theme } from '../types';

interface SettingsModalProps {
   isOpen: boolean;
   settings: Settings;
   onSettingsChange: (settings: Settings) => void;
   onSave: () => void;
   onClose: () => void;
}

export function SettingsModal({
   isOpen,
   settings,
   onSettingsChange,
   onSave,
   onClose
}: SettingsModalProps) {
   if (!isOpen) return null;

   return (
      <div className="modal-overlay" onClick={onClose}>
         <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '300px' }}>
            <div className="font-vt" style={{ color: '#e0aaff' }}>
               <h3 style={{ marginBottom: '10px' }}>Settings</h3>
               <div style={{ marginBottom: '8px' }}>
                  Theme:
                  <select
                     value={settings.theme}
                     onChange={(e) => onSettingsChange({ ...settings, theme: e.target.value as Theme })}
                     className="input-box"
                     style={{ height: '36px', width: '100%', marginTop: '4px' }}
                  >
                     <option value="neon">Slime On (Default)</option>
                     <option value="high-contrast">High Contrast</option>
                     <option value="classic">Classic Gray</option>
                  </select>
               </div>
               <div style={{ marginBottom: '8px' }}>
                  <input
                     type="checkbox"
                     checked={settings.sounds}
                     onChange={(e) => onSettingsChange({ ...settings, sounds: e.target.checked })}
                  /> Enable Sounds
               </div>
               <div style={{ marginBottom: '8px' }}>
                  <input
                     type="checkbox"
                     checked={settings.top}
                     onChange={(e) => onSettingsChange({ ...settings, top: e.target.checked })}
                  /> Always on Top
               </div>
               <div style={{ marginTop: '10px', textAlign: 'right' }}>
                  <button className="standard-btn" onClick={onSave}>Save</button>
               </div>
            </div>
         </div>
      </div>
   );
}
