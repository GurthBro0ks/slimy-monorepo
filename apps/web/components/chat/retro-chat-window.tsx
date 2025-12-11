'use client';
import { useState } from 'react';

interface RetroChatWindowProps {
  isFullPage?: boolean;
  onClose?: () => void;
}

export function RetroChatWindow({ isFullPage = false, onClose }: RetroChatWindowProps) {
  // Simple mock state for tabs
  const [activeTab, setActiveTab] = useState('Lounge');

  return (
    <div
      className={`bg-[#240046] border-2 border-[#9d4edd] flex flex-col font-mono text-sm shadow-[0_0_20px_rgba(157,78,221,0.6)] ${
        isFullPage
          ? 'w-[95%] h-[85vh] m-auto'
          : 'w-[400px] h-[500px] fixed bottom-20 right-4 z-[9999]'
      }`}
    >
      {/* Title Bar */}
      <div className="h-8 bg-gradient-to-r from-[#3c096c] to-[#10002b] flex items-center justify-between px-2 border-b border-[#10002b] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-[#00ff00] rounded-full animate-pulse shadow-[0_0_5px_#00ff00]"></div>
          <span className="text-[#ff00ff] font-bold text-xs tracking-widest">SLIME.ON</span>
        </div>
        <div className="flex gap-1">
          {!isFullPage && (
            <button onClick={onClose} className="w-5 h-5 bg-[#240046] border border-[#9d4edd] text-[#00ff00] flex items-center justify-center hover:bg-[#ff0000] hover:text-white">_</button>
          )}
          {onClose && <button onClick={onClose} className="w-5 h-5 bg-[#240046] border border-[#9d4edd] text-[#00ff00] flex items-center justify-center hover:bg-[#ff0000] hover:text-white">X</button>}
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 px-2 pt-2 bg-[#240046] border-b border-[#5a189a] shrink-0">
        {['Lounge', 'Club', 'Admin'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1 border-t border-l border-r rounded-t ${
              activeTab === tab
                ? 'bg-[#00ff00] text-[#000000] border-[#00ff00] font-bold'
                : 'bg-[#10002b] text-[#9d4edd] border-[#5a189a] hover:text-[#e0aaff]'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden p-2 gap-2 bg-[#10002b]">
        {/* Message List */}
        <div className="flex-1 bg-[#050010] border-2 border-inset border-[#5a189a] p-2 overflow-y-auto text-base">
           <div className="mb-1"><span className="text-[#9d4edd] text-xs">[12:00]</span> <span className="text-[#00ff00] font-bold">System:</span> Connected to {activeTab}.</div>
           <div className="mb-1"><span className="text-[#9d4edd] text-xs">[12:01]</span> <span className="text-[#e0aaff]">User:</span> Where is everyone?</div>
           <div className="mb-1"><span className="text-[#9d4edd] text-xs">[12:02]</span> <span className="text-[#d400ff] font-bold">Admin:</span> Checking logs...</div>
        </div>

        {/* User List (Hide on small widget if too narrow, or keep) */}
        <div className="w-24 bg-[#050010] border-2 border-inset border-[#5a189a] p-1 overflow-y-auto hidden sm:block">
           <div className="text-[#9d4edd] text-xs border-b border-[#5a189a] mb-1">ONLINE</div>
           <div className="text-[#00ff00] text-xs truncate">Admin</div>
           <div className="text-[#e0aaff] text-xs truncate">User1</div>
           <div className="text-[#e0aaff] text-xs truncate">User2</div>
        </div>
      </div>

      {/* Input Area */}
      <div className="h-12 bg-[#240046] border-t border-[#9d4edd] p-2 flex gap-2 shrink-0">
         <input type="text" className="flex-1 bg-[#10002b] border border-[#5a189a] text-[#00ff00] px-2 text-sm focus:outline-none focus:border-[#00ff00]" placeholder="Type a message..." />
         <button className="px-3 bg-[#3c096c] text-[#00ff00] border border-[#9d4edd] hover:bg-[#5a189a] text-xs font-bold">SEND</button>
      </div>
    </div>
  );
}
