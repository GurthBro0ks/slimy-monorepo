'use client';

import React, { useState, useEffect, useRef } from 'react';

// --- TYPES & DATA ---
type Theme = 'neon' | 'high-contrast' | 'classic';

interface ChatMessage {
   id: number;
   time: string;
   user: string;
   text: string;
   color: string;
   type: 'msg' | 'system';
}

// Dummy Data so tabs aren't empty
const INITIAL_HISTORY: Record<string, ChatMessage[]> = {
   'Lounge': [
      { id: 1, time: '11:58 PM', user: 'SysOp_Zero', text: 'Welcome to the node.', color: 'text-cyan-400', type: 'msg' },
      { id: 2, time: '12:01 AM', user: '(X)yth', text: 'System integrity check complete.', color: 'text-red-500 font-bold', type: 'msg' }
   ],
   'Club': [
      { id: 3, time: '12:05 AM', user: 'CoolDude99', text: 'Anyone heard the new track?', color: 'text-yellow-400', type: 'msg' },
      { id: 4, time: '12:06 AM', user: 'MallRat_X', text: 'It drops at midnight.', color: 'text-pink-400', type: 'msg' }
   ],
   'Admin': [
      { id: 5, time: '10:00 AM', user: 'System', text: '*** SERVER RESTART SCHEDULED ***', color: 'text-green-500', type: 'system' }
   ]
};

const USER_GROUPS = [
   { name: 'Admin', color: 'text-red-500 drop-shadow-[0_0_2px_rgba(255,0,0,0.8)]', users: [{ name: '(X)yth', status: 'online' }, { name: 'Gurth Brooks', status: 'online' }, { name: 'Stone', status: 'online' }] },
   { name: 'Club', color: 'text-cyan-400 drop-shadow-[0_0_2px_rgba(0,255,255,0.8)]', users: [{ name: 'CoolDude99', status: 'online' }, { name: 'MallRat_X', status: 'offline' }] },
   { name: 'Guild', color: 'text-green-500 drop-shadow-[0_0_2px_rgba(0,255,0,0.8)]', users: [{ name: 'L8rSk8r', status: 'online' }, { name: 'NetSurfer', status: 'away' }] }
];

const EMOJIS = ['🐌', '😂', '❤️', '👽', '👍', '🍕', '👻', '👎', '💩', '💣', '💋', '💀'];

export default function SlimeChat() {
   const [mounted, setMounted] = useState(false);

   // Settings
   const [theme, setTheme] = useState<Theme>('neon');
   const [textSize, setTextSize] = useState('medium');
   const [myProfile, setMyProfile] = useState({ status: 'Online', quote: 'Reality is broken.' });
   const [isAway, setIsAway] = useState(false);

   // UI State
   const [activeTab, setActiveTab] = useState('Lounge');
   const [showProfile, setShowProfile] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
   const [activeMenu, setActiveMenu] = useState<string | null>(null);

   // Chat State
   const [history, setHistory] = useState(INITIAL_HISTORY);
   const inputRef = useRef<HTMLDivElement>(null);
   const chatEndRef = useRef<HTMLDivElement>(null);

   useEffect(() => {
      setMounted(true);
      const savedTheme = localStorage.getItem('slime_theme');
      if (savedTheme) setTheme(savedTheme as Theme);
   }, []);

   useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [history, activeTab]);

   // Handlers
   const handleSendMessage = () => {
      if (!inputRef.current) return;
      const text = inputRef.current.innerText;
      if (!text.trim()) return;
      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg: ChatMessage = { id: Date.now(), time, user: '(X)yth', text, color: 'text-red-500 font-bold', type: 'msg' };
      setHistory(prev => ({ ...prev, [activeTab]: [...(prev[activeTab] || []), newMsg] }));
      inputRef.current.innerText = '';
   };

   const handleKeyDown = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSendMessage(); }
   };

   const execCmd = (cmd: string, val?: string) => {
      document.execCommand(cmd, false, val);
      inputRef.current?.focus();
   };

   const toggleAway = () => {
      setIsAway(!isAway);
      const text = !isAway ? '*** You are now AWAY ***' : '*** You are now HERE ***';
      const sysMsg: ChatMessage = { id: Date.now(), time: 'Now', user: 'System', text, color: 'text-yellow-400 italic', type: 'system' };
      setHistory(prev => {
         const next = { ...prev };
         Object.keys(next).forEach(k => next[k] = [...next[k], sysMsg]);
         return next;
      });
   };

   // Theme Logic
   const t = (() => {
      if (theme === 'classic') return { bg: 'bg-[#008080]', winBg: 'bg-[#c0c0c0]', text: 'text-black', border: 'border-white', highlight: 'bg-[#000080] text-white', accent: 'text-[#000080]', inputBg: 'bg-white' };
      if (theme === 'high-contrast') return { bg: 'bg-black', winBg: 'bg-black', text: 'text-white', border: 'border-white', highlight: 'bg-white text-black', accent: 'text-yellow-300', inputBg: 'bg-black' };
      return { bg: 'bg-[#050010]', winBg: 'bg-[#240046]', text: 'text-[#e0aaff]', border: 'border-[#9d4edd]', highlight: 'bg-[#3c096c] text-[#00ff00]', accent: 'text-[#00ff00]', inputBg: 'bg-[#10002b]' };
   })();

   if (!mounted) return null;

   return (
      <div className={`min-h-screen w-full ${t.bg} ${t.text} font-mono flex flex-col items-center justify-center p-2 md:p-6 select-none relative overflow-hidden`}>
         <style>{`
         @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
         .font-vt { font-family: 'VT323', monospace; }
         .font-pixel { font-family: 'Press Start 2P', cursive; }
         .inset-3d { border-style: inset; border-width: 2px; }
         .custom-scroll::-webkit-scrollbar { width: 10px; }
         .custom-scroll::-webkit-scrollbar-track { background: rgba(0,0,0,0.2); }
         .custom-scroll::-webkit-scrollbar-thumb { background: currentColor; opacity: 0.5; border: 1px solid rgba(255,255,255,0.2); }
         [contenteditable]:empty:before { content: attr(placeholder); color: gray; }
         
         /* SLIME BACKGROUND ANIMATION */
         @keyframes slime-fall { 0% { top: -50%; opacity: 0; } 20% { opacity: 0.5; } 100% { top: 110%; opacity: 0; } }
         .slime-drip { position: absolute; background: linear-gradient(180deg, transparent, #00ff00); opacity: 0.3; animation: slime-fall 8s infinite linear; }
       ` }</style>

         {/* BACKGROUND SLIME (Only on Neon) */}
         {theme === 'neon' && (
            <>
               <div className="absolute inset-0 z-0 opacity-30 pointer-events-none" style={{ backgroundImage: 'linear-gradient(rgba(20, 0, 40, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 0, 40, 0.8) 1px, transparent 1px)', backgroundSize: '40px 40px' }}></div>
               <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
                  {[...Array(10)].map((_, i) => (
                     <div key={i} className="slime-drip w-1 rounded-b-lg" style={{ left: `${Math.random() * 100}%`, height: `${Math.random() * 200 + 50}px`, animationDelay: `${Math.random() * 5}s`, animationDuration: `${Math.random() * 5 + 5}s` }} />
                  ))}
               </div>
            </>
         )}

         {/* MAIN WINDOW */}
         <div className={`w-full max-w-6xl h-[85vh] flex flex-col ${t.winBg} border-2 ${t.border} shadow-[0_0_30px_rgba(157,78,221,0.6)] relative z-10`}>

            {/* 1. TITLE BAR */}
            <div className={`h-8 shrink-0 flex items-center justify-between px-2 border-b-2 ${t.border} bg-gradient-to-r from-purple-900 to-black`}>
               <span className="text-xs text-pink-500 font-pixel drop-shadow-md">slime.on // {activeTab}</span>
               <div className={`w-5 h-5 border ${t.border} flex items-center justify-center text-xs cursor-pointer hover:bg-red-500 bg-black/50`} onClick={() => window.location.href = '/'}>X</div>
            </div>

            {/* 2. MENU BAR */}
            <div className={`h-9 shrink-0 flex items-center px-1 border-b ${t.border} font-vt text-xl relative z-50 gap-1`}>
               {/* File */}
               <div className="relative group">
                  <div className={`px-3 cursor-pointer hover:${t.highlight}`} onClick={() => setActiveMenu(activeMenu === 'file' ? null : 'file')}><u>F</u>ile</div>
                  {activeMenu === 'file' && (
                     <div className={`absolute top-full left-0 ${t.winBg} border-2 ${t.border} min-w-[150px] shadow-xl flex flex-col`}>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { setShowProfile(true); setActiveMenu(null); }}>My Profile</div>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { setShowSettings(true); setActiveMenu(null); }}>Settings</div>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer border-t border-white/20`} onClick={() => { toggleAway(); setActiveMenu(null); }}>{isAway ? "I'm Back" : "Go Away"}</div>
                     </div>
                  )}
               </div>

               {/* Edit */}
               <div className="relative group">
                  <div className={`px-3 cursor-pointer hover:${t.highlight}`} onClick={() => setActiveMenu(activeMenu === 'edit' ? null : 'edit')}><u>E</u>dit</div>
                  {activeMenu === 'edit' && (
                     <div className={`absolute top-full left-0 ${t.winBg} border-2 ${t.border} min-w-[150px] shadow-xl flex flex-col`}>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { document.execCommand('copy'); setActiveMenu(null); }}>Copy</div>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { setActiveMenu(null); }}>Paste (Ctrl+V)</div>
                     </div>
                  )}
               </div>

               {/* View */}
               <div className="relative group">
                  <div className={`px-3 cursor-pointer hover:${t.highlight}`} onClick={() => setActiveMenu(activeMenu === 'view' ? null : 'view')}><u>V</u>iew</div>
                  {activeMenu === 'view' && (
                     <div className={`absolute top-full left-0 ${t.winBg} border-2 ${t.border} min-w-[150px] shadow-xl flex flex-col`}>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { setTextSize('small'); setActiveMenu(null); }}>Small Text</div>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { setTextSize('medium'); setActiveMenu(null); }}>Medium Text</div>
                        <div className={`px-3 py-1 hover:${t.highlight} cursor-pointer`} onClick={() => { setTextSize('large'); setActiveMenu(null); }}>Large Text</div>
                     </div>
                  )}
               </div>

               <div className="flex-1"></div>
               {/* Tabs */}
               <div className="flex items-end h-full pt-1 px-1 gap-1">
                  {['Lounge', 'Club', 'Admin'].map(tab => (
                     <div key={tab} onClick={() => setActiveTab(tab)}
                        className={`px-4 cursor-pointer rounded-t border-t border-l border-r ${activeTab === tab ? `${t.accent} bg-black/20 border-current font-bold` : 'border-transparent opacity-60 hover:opacity-100'}`}>
                        {tab}
                     </div>
                  ))}
               </div>
            </div>

            {/* 3. CONTENT AREA */}
            <div className="flex-1 flex overflow-hidden bg-black/20">

               {/* LEFT: CHAT HISTORY */}
               <div className={`flex-1 p-4 overflow-y-auto font-vt ${textSize === 'large' ? 'text-2xl' : textSize === 'small' ? 'text-sm' : 'text-xl'} inset-3d ${t.border} m-1 shadow-inner ${theme === 'neon' ? 'bg-[#10002b]' : 'bg-white'}`}>
                  {history[activeTab]?.map((msg, i) => (
                     <div key={i} className="mb-1 leading-tight break-words">
                        {msg.type === 'system' ? (
                           <span className="text-green-500 italic" dangerouslySetInnerHTML={{ __html: msg.text }} />
                        ) : (
                           <>
                              <span className="text-gray-500 text-sm mr-2 select-none">{msg.time}</span>
                              <span className={`mr-2 ${msg.color}`}>{msg.user}:</span>
                              <span className={theme === 'neon' ? 'text-[#e0aaff]' : 'text-black'} dangerouslySetInnerHTML={{ __html: msg.text }} />
                           </>
                        )}
                     </div>
                  ))}
                  <div ref={chatEndRef} />
               </div>

               {/* RIGHT: USER LIST */}
               <div className="w-48 shrink-0 flex flex-col border-l border-white/20 bg-black/10 m-1 ml-0">
                  <div className={`p-1 text-center font-vt border-b ${t.border} opacity-80`}>USERS ONLINE</div>
                  <div className={`flex-1 overflow-y-auto p-2 font-vt text-lg inset-3d ${t.border} ${theme === 'neon' ? 'bg-[#10002b]' : 'bg-white'} custom-scroll`}>
                     {/* ME */}
                     <div className="mb-2 pb-2 border-b border-gray-600">
                        <div className={`cursor-pointer px-1 truncate ${isAway ? 'text-yellow-400' : 'text-red-500'}`} onClick={() => setShowProfile(true)}>
                           {isAway ? '☾ ' : '● '} (X)yth
                        </div>
                     </div>
                     {/* GROUPS */}
                     {USER_GROUPS.map(g => (
                        <div key={g.name} className="mb-4">
                           <div className="text-xs uppercase opacity-50 mb-1 tracking-wider select-none">{g.name}</div>
                           {g.users.map(u => (
                              <div key={u.name} className={`truncate px-1 cursor-pointer hover:bg-white/10 ${g.color} ${u.status === 'offline' ? 'opacity-40' : ''}`}>
                                 {u.status === 'away' ? '☾ ' : u.status === 'offline' ? '○ ' : '● '} {u.name}
                              </div>
                           ))}
                        </div>
                     ))}
                  </div>
               </div>
            </div>

            {/* 4. INPUT AREA */}
            <div className={`h-auto shrink-0 p-2 ${t.winBg} border-t-2 ${t.border}`}>
               <div className="flex gap-1 mb-1 relative z-40">
                  <button onClick={() => execCmd('bold')} className={`w-8 h-8 border ${t.border} font-bold hover:bg-white/10 ${t.accent}`}>B</button>
                  <button onClick={() => execCmd('italic')} className={`w-8 h-8 border ${t.border} italic hover:bg-white/10 ${t.accent}`}>I</button>
                  <button onClick={() => execCmd('underline')} className={`w-8 h-8 border ${t.border} underline hover:bg-white/10 ${t.accent}`}>U</button>
                  <button onClick={() => setShowEmojiPicker(!showEmojiPicker)} className={`w-8 h-8 border ${t.border} hover:bg-white/10 ${t.accent}`}>:)</button>
                  {showEmojiPicker && (
                     <div className={`absolute bottom-10 left-24 w-64 h-32 overflow-y-auto ${t.winBg} border-2 ${t.border} p-1 grid grid-cols-6 gap-1 shadow-xl`}>
                        {EMOJIS.map(e => <div key={e} onClick={() => { execCmd('insertText', e); setShowEmojiPicker(false); }} className="cursor-pointer hover:bg-white/20 text-center text-xl">{e}</div>)}
                     </div>
                  )}
               </div>
               <div className="flex gap-2 h-16">
                  <div ref={inputRef} contentEditable onKeyDown={handleKeyDown}
                     className={`flex-1 inset-3d ${t.border} p-2 font-vt text-xl overflow-y-auto focus:outline-none ${t.inputBg} ${theme === 'neon' ? 'text-[#00ff00]' : 'text-black'}`}
                     placeholder="Message..." />
                  <button onClick={handleSendMessage} className={`w-24 border-2 ${t.border} ${t.accent} font-vt text-xl font-bold hover:bg-white/10 active:translate-y-px`}>SEND</button>
               </div>
            </div>

         </div>

         {/* --- POPUPS --- */}
         {(showProfile || showSettings) && (
            <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => { setShowProfile(false); setShowSettings(false); }}>
               <div className={`w-80 ${t.winBg} border-2 ${t.border} p-4 shadow-xl flex flex-col`} onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center border-b border-white/20 mb-4 pb-1">
                     <h2 className="font-vt text-2xl">{showProfile ? 'Profile' : 'Settings'}</h2>
                     <button onClick={() => { setShowProfile(false); setShowSettings(false); }} className="hover:text-red-500">X</button>
                  </div>

                  {showProfile ? (
                     <div className="font-vt text-xl space-y-4">
                        <div>User: <span className={t.accent}>(X)yth</span></div>
                        <div>Status: <input value={myProfile.status} onChange={e => setMyProfile({ ...myProfile, status: e.target.value })} className="bg-black/30 border border-white/30 p-1 w-full" /></div>
                        <div>Quote: <textarea value={myProfile.quote} onChange={e => setMyProfile({ ...myProfile, quote: e.target.value })} className="bg-black/30 border border-white/30 p-1 w-full h-20" /></div>
                     </div>
                  ) : (
                     <div className="font-vt text-xl space-y-4">
                        <div>
                           <label className="block mb-1">Theme:</label>
                           <select value={theme} onChange={e => setTheme(e.target.value as Theme)} className="w-full bg-black/30 border border-white/30 p-1">
                              <option value="neon">Neon</option>
                              <option value="classic">Classic</option>
                              <option value="high-contrast">High Contrast</option>
                           </select>
                        </div>
                     </div>
                  )}
                  <button className={`mt-4 border ${t.border} px-2 py-1 w-full hover:bg-white/10 font-vt text-xl`} onClick={() => { setShowProfile(false); setShowSettings(false); }}>Close</button>
               </div>
            </div>
         )}

         {/* Global Click Handler for Menus */}
         {activeMenu && <div className="fixed inset-0 z-40" onClick={() => setActiveMenu(null)} />}
      </div>
   );
}
