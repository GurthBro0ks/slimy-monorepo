import React from 'react';
import { USER_GROUPS, CURRENT_USER } from '../constants';
import type { UserStatus } from '../types';

interface UserListSidebarProps {
   isAway: boolean;
   onOpenProfile: (username: string) => void;
}

export function UserListSidebar({ isAway, onOpenProfile }: UserListSidebarProps) {
   const totalOnline = USER_GROUPS.reduce((sum, g) => sum + g.users.filter(u => u.status !== 'offline').length, 0);

   return (
      <div className="user-list-container">
         <div className="user-list-header">People Here: {totalOnline}</div>
         <div className="inset-box user-list">
            {USER_GROUPS.map(group => {
               const onlineCount = group.users.filter(u => u.status !== 'offline').length;
               return (
                  <div key={group.name}>
                     <div className="group-header">
                        <span style={{ marginRight: '5px' }}>▼</span>
                        <span style={{ color: '#ff00ff' }}>{group.name}</span>
                        <span style={{ color: '#00ff00', marginLeft: '5px' }}>({onlineCount}/{group.count})</span>
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
      </div>
   );
}
