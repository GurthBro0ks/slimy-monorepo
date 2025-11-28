import React from 'react';
import type { TextSize } from '../types';

interface ChatMenuBarProps {
   mode: 'widget' | 'page';
   activeTab: string;
   activeMenu: string | null;
   textSize: TextSize;
   showTimestamps: boolean;
   isAway: boolean;
   onToggleMenu: (menu: string) => void;
   onSwitchTab: (tab: string) => void;
   onSetTextSize: (size: TextSize) => void;
   onToggleTimestamps: () => void;
   onOpenEditProfile: () => void;
   onOpenProfile: (username: string) => void;
   onShowAwayManager: () => void;
   onToggleAway: () => void;
   onShowSettings: () => void;
}

export function ChatMenuBar({
   mode,
   activeTab,
   activeMenu,
   textSize,
   showTimestamps,
   isAway,
   onToggleMenu,
   onSwitchTab,
   onSetTextSize,
   onToggleTimestamps,
   onOpenEditProfile,
   onOpenProfile,
   onShowAwayManager,
   onToggleAway,
   onShowSettings
}: ChatMenuBarProps) {
   return (
      <div className="menu-bar">
         <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => onToggleMenu('file')}>
               <u>F</u>ile
            </div>
            {activeMenu === 'file' && (
               <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => onOpenProfile('(X)yth')}>View My Profile</div>
                  <div className="dropdown-item" onClick={onOpenEditProfile}>Edit Profile</div>
                  <div className="dropdown-item" onClick={onShowAwayManager}>Manage Away Messages...</div>
                  <div className="dropdown-item" onClick={onToggleAway}>{isAway ? "I'm Back" : "I'm Away"}</div>
                  <div className="dropdown-item" onClick={onShowSettings}>Settings...</div>
               </div>
            )}
         </div>

         <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => onToggleMenu('edit')}>
               <u>E</u>dit
            </div>
            {activeMenu === 'edit' && (
               <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => { document.execCommand('copy'); onToggleMenu(''); }}>Copy</div>
                  <div className="dropdown-item" onClick={() => onToggleMenu('')}>Paste (Ctrl+V)</div>
                  <div className="dropdown-item" onClick={() => { document.execCommand('selectAll'); onToggleMenu(''); }}>Select All</div>
               </div>
            )}
         </div>

         <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => onToggleMenu('view')}>
               <u>V</u>iew
            </div>
            {activeMenu === 'view' && (
               <div className="dropdown-menu">
                  <div className="dropdown-item" onClick={() => { onSetTextSize('small'); onToggleMenu(''); }}>Size: Small</div>
                  <div className="dropdown-item" onClick={() => { onSetTextSize('medium'); onToggleMenu(''); }}>Size: Medium</div>
                  <div className="dropdown-item" onClick={() => { onSetTextSize('large'); onToggleMenu(''); }}>Size: Large</div>
                  <div style={{ height: '1px', background: '#9d4edd', margin: '4px 0' }} />
                  <div className="dropdown-item" onClick={() => { onToggleTimestamps(); onToggleMenu(''); }}>
                     {showTimestamps ? 'Hide' : 'Show'} Timestamps
                  </div>
               </div>
            )}
         </div>

         <div className="menu-item" onClick={() => alert('Slime On v3.0')}>
            <u>H</u>elp
         </div>

         <div className="tab-container">
            <div className={`chat-tab ${activeTab === 'Lounge' ? 'active' : ''}`} onClick={() => onSwitchTab('Lounge')}>Lounge</div>
            <div className={`chat-tab ${activeTab === 'Club' ? 'active' : ''}`} onClick={() => onSwitchTab('Club')}>Club</div>
            <div className={`chat-tab ${activeTab === 'Admin' ? 'active' : ''}`} onClick={() => onSwitchTab('Admin')}>Admin</div>
         </div>
      </div>
   );
}
