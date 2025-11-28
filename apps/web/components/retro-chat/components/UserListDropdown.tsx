import React from 'react';
import { USER_GROUPS, CURRENT_USER } from '../constants';

interface UserListDropdownProps {
   show: boolean;
   isAway: boolean;
   onOpenProfile: (username: string) => void;
}

export function UserListDropdown({ show, isAway, onOpenProfile }: UserListDropdownProps) {
   if (!show) return null;

   const totalOnline = USER_GROUPS.reduce((sum, g) => sum + g.users.filter(u => u.status !== 'offline').length, 0);

   return (
      <div className="inset-box user-list" style={{ position: 'absolute', bottom: '140px', right: '10px', width: '200px', maxHeight: '300px', zIndex: 5000 }}>
         <div style={{ fontSize: '14px', marginBottom: '5px', color: '#e0aaff' }}>Online: {totalOnline}</div>
         {USER_GROUPS.map(group => {
            const onlineCount = group.users.filter(u => u.status !== 'offline').length;
            return (
               <div key={group.name}>
                  <div className="group-header" style={{ fontSize: '14px' }}>
                     <span style={{ marginRight: '5px' }}>▼</span>
                     <span style={{ color: '#ff00ff' }}>{group.name}</span>
                     <span style={{ color: '#00ff00', marginLeft: 'auto' }}>({onlineCount})</span>
                  </div>
                  <div className="group-content">
                     {group.users.map(user => {
                        const isCurrentUser = user.name === CURRENT_USER;
                        const displayStatus = isCurrentUser && isAway ? 'away' : user.status;
                        return (
                           <div
                              key={user.name}
                              className={`user-item ${displayStatus}`}
                              onClick={() => onOpenProfile(user.name)}
                              style={{ fontSize: '14px' }}
                           >
                              <span className="user-icon">
                                 {displayStatus === 'offline' ? '⊗' : displayStatus === 'away' ? '☾' : '●'}
                              </span>
                              <span className={group.color}>{user.name}</span>
                           </div>
                        );
                     })}
                  </div>
               </div>
            );
         })}
      </div>
   );
}
