import React from 'react';
import type { AwayMessage } from '../types';

interface AwayManagerModalProps {
   isOpen: boolean;
   awayMessages: AwayMessage[];
   activeAwayId: number;
   newAwayTitle: string;
   newAwayText: string;
   onActiveAwayIdChange: (id: number) => void;
   onDeleteAwayMessage: (id: number) => void;
   onNewAwayTitleChange: (title: string) => void;
   onNewAwayTextChange: (text: string) => void;
   onAddAwayMessage: () => void;
   onClose: () => void;
}

export function AwayManagerModal({
   isOpen,
   awayMessages,
   activeAwayId,
   newAwayTitle,
   newAwayText,
   onActiveAwayIdChange,
   onDeleteAwayMessage,
   onNewAwayTitleChange,
   onNewAwayTextChange,
   onAddAwayMessage,
   onClose
}: AwayManagerModalProps) {
   if (!isOpen) return null;

   return (
      <div className="modal-overlay" onClick={onClose}>
         <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '350px' }}>
            <div className="font-vt" style={{ color: '#e0aaff' }}>
               <h3 style={{ marginBottom: '10px' }}>Away Messages</h3>
               <div style={{ marginBottom: '5px', fontSize: '16px' }}>Select active message:</div>
               <div className="inset-box" style={{ padding: '5px', marginBottom: '10px', maxHeight: '150px' }}>
                  {awayMessages.map(msg => (
                     <div key={msg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', borderBottom: '1px solid #555' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                           <input
                              type="radio"
                              name="away"
                              checked={msg.id === activeAwayId}
                              onChange={() => {
                                 onActiveAwayIdChange(msg.id);
                                 localStorage.setItem('slime_away', JSON.stringify({ messages: awayMessages, activeId: msg.id }));
                              }}
                           />
                           <span style={{ cursor: 'pointer' }} onClick={() => {
                              onNewAwayTitleChange(msg.title);
                              onNewAwayTextChange(msg.text);
                           }}>{msg.title}</span>
                        </div>
                        <button
                           className="standard-btn"
                           style={{ width: '24px', height: '24px', fontSize: '12px', padding: '0' }}
                           onClick={() => onDeleteAwayMessage(msg.id)}
                        >X</button>
                     </div>
                  ))}
               </div>
               <div style={{ borderTop: '1px solid #9d4edd', paddingTop: '5px' }}>
                  <div style={{ fontSize: '16px', marginBottom: '5px' }}>Create New (Max 3):</div>
                  <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                     <input
                        type="text"
                        value={newAwayTitle}
                        onChange={(e) => onNewAwayTitleChange(e.target.value)}
                        placeholder="Title"
                        className="input-box"
                        style={{ flex: 1, height: '36px' }}
                     />
                     <button className="standard-btn" onClick={onAddAwayMessage}>Add</button>
                  </div>
                  <textarea
                     value={newAwayText}
                     onChange={(e) => onNewAwayTextChange(e.target.value)}
                     placeholder="Message text..."
                     className="input-box"
                     style={{ height: '60px', width: '100%' }}
                  />
               </div>
            </div>
         </div>
      </div>
   );
}
