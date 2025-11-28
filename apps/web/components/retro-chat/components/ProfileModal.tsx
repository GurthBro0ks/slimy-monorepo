import React, { useRef, useEffect } from 'react';
import type { UserProfile } from '../types';
import { CURRENT_USER, USER_GROUPS } from '../constants';

interface ProfileModalProps {
   isOpen: boolean;
   profileViewUser: string | null;
   editMode: boolean;
   userProfile: UserProfile;
   editStatus: string;
   editQuoteRef: React.RefObject<HTMLDivElement | null>;
   onClose: () => void;
   onEditModeChange: (mode: boolean) => void;
   onStatusChange: (status: string) => void;
   onSave: () => void;
}

export function ProfileModal({
   isOpen,
   profileViewUser,
   editMode,
   userProfile,
   editStatus,
   editQuoteRef,
   onClose,
   onEditModeChange,
   onStatusChange,
   onSave
}: ProfileModalProps) {
   if (!isOpen || !profileViewUser) return null;

   const isCurrentUser = profileViewUser === CURRENT_USER;

   return (
      <div className="modal-overlay" onClick={onClose}>
         <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="font-vt" style={{ color: '#e0aaff', fontSize: '18px' }}>
               <div style={{ marginBottom: '10px' }}>
                  Screen Name: <span style={{ color: '#ff00ff' }}>{profileViewUser}</span>
               </div>

               {!editMode ? (
                  <div className="inset-box" style={{ padding: '8px', color: '#00ff00' }}>
                     <div>Status: <span style={{ color: '#fff' }}>{isCurrentUser ? userProfile.status : 'Online'}</span></div>
                     <div style={{ borderBottom: '1px solid #9d4edd', margin: '5px 0' }}>Quote:</div>
                     <div style={{ color: '#e0aaff', fontStyle: 'italic' }} dangerouslySetInnerHTML={{ __html: isCurrentUser ? userProfile.quote : 'Just hanging out.' }} />
                  </div>
               ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                     <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span>Status:</span>
                        <input
                           type="text"
                           value={editStatus}
                           onChange={(e) => onStatusChange(e.target.value)}
                           className="input-box"
                           style={{ height: '36px', flex: 1 }}
                        />
                     </div>
                     <div>Quote:</div>
                     <div
                        ref={editQuoteRef}
                        className="input-box"
                        contentEditable
                        style={{ height: '150px' }}
                        suppressContentEditableWarning
                     />
                     <div style={{ textAlign: 'right', marginTop: '5px', display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                        <button className="standard-btn" onClick={onClose}>Cancel</button>
                        <button className="standard-btn" onClick={onSave}>Save</button>
                     </div>
                  </div>
               )}

               {!editMode && (
                  <button className="standard-btn" style={{ marginTop: '10px', width: '100%' }} onClick={onClose}>Close</button>
               )}
            </div>
         </div>
      </div>
   );
}
