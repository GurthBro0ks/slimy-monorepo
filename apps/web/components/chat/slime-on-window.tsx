'use client';
import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/lib/auth/context'; // FIXED IMPORT

export interface SlimeOnWindowProps {
  mode?: 'full' | 'dock';
  onClose?: () => void;
}

export function SlimeOnWindow({ mode = 'dock', onClose }: SlimeOnWindowProps) {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('Lounge');
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState([
    { id: 1, user: 'System', text: 'Welcome to Slime.On v3.0', color: '#00ff00', time: '12:00' },
    { id: 2, user: 'Admin', text: 'Channel secure.', color: '#ff0000', time: '12:01' },
  ]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const newMsg = {
      id: Date.now(),
      user: user?.username || 'Guest',
      text: input,
      color: '#d400ff',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    setMessages([...messages, newMsg]);
    setInput('');
  };

  const windowClasses = mode === 'full'
    ? 'w-full h-full max-w-5xl mx-auto flex flex-col'
    : 'w-[400px] h-[500px] fixed bottom-20 right-4 z-[9999] flex flex-col shadow-[10px_10px_0px_rgba(0,0,0,0.5)]';

  return (
    <div className={`${windowClasses} bg-[#c0c0c0] border-t-2 border-l-2 border-white border-b-2 border-r-2 border-black font-sans text-xs sm:text-sm text-black`}>
      <div className="bg-[#000080] text-white p-1 px-2 flex justify-between items-center select-none">
        <div className="flex items-center gap-2 font-bold"><div className="w-3 h-3 bg-[#00ff00] rounded-full"></div><span>Slime.On Instant Messenger</span></div>
        <div className="flex gap-1">{onClose && <button onClick={onClose} className="w-5 h-5 bg-[#c0c0c0] border-t border-l border-white border-b border-r border-black flex items-center justify-center text-black font-bold active:border-inset focus:outline-none">X</button>}</div>
      </div>
      <div className="flex px-1 py-1 border-b border-[#808080] shadow-sm select-none bg-[#c0c0c0] space-x-0 text-black">
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-2"><span className="underline">F</span>ile</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-2"><span className="underline">E</span>dit</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-2"><span className="underline">V</span>iew</span>
        <span className="cursor-pointer hover:bg-[#000080] hover:text-white px-2"><span className="underline">H</span>elp</span>
      </div>
      <div className="flex flex-1 p-1 gap-1 overflow-hidden bg-[#c0c0c0]">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex gap-1 pl-1">
             {['Lounge', 'Club', 'Admin'].map(tab => (<button key={tab} onClick={() => setActiveTab(tab)} className={`px-3 py-0.5 border-t border-l border-r rounded-t-sm text-xs ${activeTab === tab ? 'bg-white border-[#808080] relative top-[1px] z-10 font-bold' : 'bg-[#c0c0c0] border-white text-gray-600'}`}>{tab}</button>))}
          </div>
          <div className="flex-1 bg-white border-2 border-inset border-[#808080] p-2 overflow-y-auto font-mono text-sm leading-5">
            {messages.map(msg => (<div key={msg.id} className="mb-1"><span className="text-gray-500 mr-2 text-[10px]">[{msg.time}]</span><span style={{ color: msg.color }} className="font-bold mr-1">{msg.user}:</span><span>{msg.text}</span></div>))}
            <div ref={messagesEndRef} />
          </div>
          <div className="flex gap-1 p-1 bg-[#c0c0c0] border border-[#808080] items-center">
             <button className="w-6 h-6 bg-[#c0c0c0] border-2 border-outset border-white font-bold font-serif text-xs active:border-inset flex items-center justify-center">B</button>
             <button className="w-6 h-6 bg-[#c0c0c0] border-2 border-outset border-white font-serif italic text-xs active:border-inset flex items-center justify-center">I</button>
             <button className="w-6 h-6 bg-[#c0c0c0] border-2 border-outset border-white underline text-xs active:border-inset flex items-center justify-center">U</button>
             <div className="w-[1px] h-4 bg-gray-500 mx-1"></div>
             <button className="px-1 text-xs text-blue-800 hover:bg-[#000080] hover:text-white">Link</button>
          </div>
          <div className="h-14 bg-white border-2 border-inset border-[#808080] p-1 flex">
             <textarea value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }} className="w-full h-full resize-none outline-none font-mono text-sm text-black" />
             <button onClick={handleSend} className="w-16 ml-1 h-full bg-[#c0c0c0] border-2 border-outset border-white active:border-inset font-bold text-xs">SEND</button>
          </div>
        </div>
        <div className="w-28 bg-white border-2 border-inset border-[#808080] p-1 overflow-y-auto font-mono text-xs hidden sm:block">
           <div className="font-bold bg-[#000080] text-white px-1 mb-1">ONLINE</div>
           <div className="cursor-pointer hover:bg-[#000080] hover:text-white px-1">System</div>
           <div className="cursor-pointer hover:bg-[#000080] hover:text-white px-1 font-bold text-[#d400ff]">{user?.username || 'You'}</div>
        </div>
      </div>
      <div className="border-t border-[#808080] p-0.5 text-[10px] text-gray-600 flex justify-between px-2"><span>Connected</span><span>v3.0</span></div>
    </div>
  );
}
