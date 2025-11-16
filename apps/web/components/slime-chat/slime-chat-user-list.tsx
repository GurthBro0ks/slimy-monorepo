"use client";

import { useEffect, useState } from "react";

interface User {
  id: string;
  username: string;
  color: string;
  status: "online" | "offline";
}

interface SlimeChatUserListProps {
  onClose: () => void;
}

export function SlimeChatUserList({ onClose }: SlimeChatUserListProps) {
  const [users, setUsers] = useState<User[]>([]);

  // TODO: Connect to MCP chat service for real user list
  useEffect(() => {
    // Placeholder users for demonstration
    const demoUsers: User[] = [
      { id: "1", username: "Alex", color: "#06b6d4", status: "online" },
      { id: "2", username: "Brooke", color: "#ec4899", status: "online" },
      { id: "3", username: "Chris", color: "#eab308", status: "online" },
      { id: "4", username: "Devon", color: "#8b5cf6", status: "online" },
    ];
    setUsers(demoUsers);
  }, []);

  return (
    <div className="absolute top-14 right-4 bg-zinc-800 border border-emerald-500/30 rounded-lg shadow-lg p-4 w-48 z-10">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-emerald-500 font-semibold text-sm">ONLINE</h3>
        <span className="text-gray-400 text-xs">({users.filter(u => u.status === "online").length})</span>
      </div>
      
      <div className="space-y-2">
        {users.filter(u => u.status === "online").map((user) => (
          <div key={user.id} className="flex items-center gap-2">
            <div 
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: user.color }}
            />
            <span 
              className="text-sm font-medium"
              style={{ color: user.color }}
            >
              {user.username}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
