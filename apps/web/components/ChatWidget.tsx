'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';

// --- TYPES & DATA ---
type Theme = 'neon' | 'high-contrast' | 'classic';
type TextSize = 'small' | 'medium' | 'large';
type UserStatus = 'online' | 'offline' | 'away';

interface UserGroup {
  name: string;
  count: string;
  color: string;
  users: { name: string; status: UserStatus; }[];
}

interface UserProfile {
  status: string;
  quote: string;
}

interface AwayMessage {
  id: number;
  title: string;
  text: string;
}

interface Settings {
  theme: Theme;
  sounds: boolean;
  top: boolean;
}

// Dummy Data
const INITIAL_HISTORY: Record<string, string> = {
  'Lounge': '<div class="msg-line"><span class="msg-timestamp">12:00 AM</span><span class="msg-user text-guild">L8rSk8r:</span> <span class="msg-text">Is the server lagging?</span></div>',
  'Club': '<div class="msg-line"><span class="msg-timestamp">11:55 PM</span><span class="msg-user text-club">DJ_Spin:</span> <span class="msg-text">New track dropping in 5!</span></div>',
  'Admin': '<div class="msg-line"><span class="msg-timestamp">09:00 AM</span><span class="msg-user text-admin">System:</span> <span class="msg-text">Log started.</span></div>'
};

const USER_GROUPS: UserGroup[] = [
  {
    name: "Admin",
    count: "7",
    color: "text-admin",
    users: [
      { name: "(X)yth", status: "online" },
      { name: "Gurth Brooks", status: "online" },
      { name: "Stone", status: "online" },
      { name: "SysOp_Zero", status: "offline" },
      { name: "Net_Ghost", status: "offline" },
      { name: "Root_Access", status: "offline" },
      { name: "Mainframe_X", status: "offline" }
    ]
  },
  {
    name: "Club",
    count: "25",
    color: "text-club",
    users: [
      { name: "CoolDude99", status: "online" },
      { name: "MallRat_X", status: "online" },
      { name: "Partier1", status: "offline" },
      { name: "Partier2", status: "offline" }
    ]
  },
  {
    name: "Guild",
    count: "56",
    color: "text-guild",
    users: [
      { name: "L8rSk8r", status: "online" },
      { name: "NetSurfer", status: "online" },
      { name: "Elf_Ranger", status: "offline" },
      { name: "Orc_Slayer", status: "offline" }
    ]
  }
];

const EMOJIS = {
  snailPack: ['🐌😎', '🐌❤️', '🐌💧', '🐌💤', '🐌😵', '🐌💕', '🐌😫', '🐌🤔', '🐌😯', '🐌👍', '🐌😠', '🐌✨'],
  retroPixels: ['😂', '❤️', '👽', '👍', '🍕', '👻', '👎', '💩', '💣', '💋', '💀', '🤩']
};

const COLORS = ['white', 'black', 'red', 'lime', 'blue', 'yellow', 'cyan', 'magenta', '#800000', '#008000', '#000080', '#808000', '#008080', '#800080', '#c0c0c0', '#808080'];

export function ChatWidget() {
  const { isAuthenticated, isLoading } = useAuth();
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const currentUser = "(X)yth";

  // Settings
  const [theme, setTheme] = useState<Theme>('neon');
  const [textSize, setTextSize] = useState<TextSize>('medium');
  const [showTimestamps, setShowTimestamps] = useState(false);
  const [userProfile, setUserProfile] = useState<UserProfile>({ status: 'Online', quote: 'Reality is broken.' });
  const [isAway, setIsAway] = useState(false);
  const [settings, setSettings] = useState<Settings>({ theme: 'neon', sounds: true, top: false });

  // UI State
  const [activeTab, setActiveTab] = useState('Lounge');
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [showProfile, setShowProfile] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showAwayManager, setShowAwayManager] = useState(false);
  const [showUserList, setShowUserList] = useState(false);
  const [profileEditMode, setProfileEditMode] = useState(false);
  const [profileViewUser, setProfileViewUser] = useState<string | null>(null);

  // Popup States
  const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [currentColorMode, setCurrentColorMode] = useState<'foreColor' | 'hiliteColor'>('foreColor');

  // Chat State
  const [history, setHistory] = useState(INITIAL_HISTORY);
  const [awayMessages, setAwayMessages] = useState<AwayMessage[]>([{ id: 1, title: "Lunch", text: "Out to lunch." }]);
  const [activeAwayId, setActiveAwayId] = useState(1);
  const [editStatus, setEditStatus] = useState('');
  const [newAwayTitle, setNewAwayTitle] = useState('');
  const [newAwayText, setNewAwayText] = useState('');

  const inputRef = useRef<HTMLDivElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const editQuoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
    // Load from localStorage
    const savedProfile = localStorage.getItem('slime_profile');
    if (savedProfile) setUserProfile(JSON.parse(savedProfile));

    const savedAway = localStorage.getItem('slime_away');
    if (savedAway) {
      const parsed = JSON.parse(savedAway);
      if (parsed.messages) {
        setAwayMessages(parsed.messages);
        setActiveAwayId(parsed.activeId);
      } else {
        setAwayMessages(parsed);
      }
    }

    const savedSettings = localStorage.getItem('slime_settings');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      setSettings(parsed);
      setTheme(parsed.theme);
    }
  }, []);

  useEffect(() => {
    if (isOpen) {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [history, activeTab, isOpen]);

  // Close menus on outside click
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.menu-item-container')) {
        setActiveMenu(null);
      }
      if (!target.closest('.fmt-btn') && !target.closest('.popup-menu')) {
        setShowEmoticonPicker(false);
        setShowColorPicker(false);
      }
    };
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const handleSendMessage = () => {
    if (!inputRef.current) return;
    const txt = inputRef.current.innerHTML.trim();
    if (!txt) return;

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const newMsg = `<div class="msg-line"><span class="msg-timestamp">${time}</span><span class="msg-self text-admin">${currentUser}:</span> <span class="msg-text">${txt}</span></div>`;

    setHistory(prev => ({
      ...prev,
      [activeTab]: prev[activeTab] + newMsg
    }));

    inputRef.current.innerHTML = '';
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const execCmd = (cmd: string, val?: string) => {
    document.execCommand(cmd, false, val);
    inputRef.current?.focus();
  };

  const formatDoc = (cmd: string, val?: string) => {
    execCmd(cmd, val);
  };

  const toggleMenu = (menuId: string) => {
    setActiveMenu(activeMenu === menuId ? null : menuId);
  };

  const switchTab = (tab: string) => {
    setActiveTab(tab);
  };

  const toggleAway = () => {
    const newAwayState = !isAway;
    setIsAway(newAwayState);

    const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const statusText = newAwayState ? "AWAY" : "HERE";
    const statusColor = newAwayState ? '#ffff00' : '#00ff00';

    let awayMsgHtml = "";
    if (newAwayState) {
      const active = awayMessages.find(m => m.id === activeAwayId);
      if (active) {
        awayMsgHtml = `<br><span style="font-size:18px; color:#ffff00; font-weight:bold;">Message: ${active.text}</span>`;
      }
      setUserProfile(prev => ({ ...prev, status: "Away" }));
    } else {
      setUserProfile(prev => ({ ...prev, status: "Online" }));
    }

    const systemMsgHtml = `<div class="msg-line"><span class="msg-timestamp">${time}</span><span class="msg-system" style="color:${statusColor}">*** You are now ${statusText} ***${awayMsgHtml}</span></div>`;

    setHistory(prev => {
      const newHistory = { ...prev };
      for (let key in newHistory) {
        newHistory[key] += systemMsgHtml;
      }
      return newHistory;
    });

    setActiveMenu(null);
  };

  const openProfile = (username: string) => {
    setProfileViewUser(username);
    setShowProfile(true);
    setProfileEditMode(false);
    setActiveMenu(null);
  };

  const openEditProfile = () => {
    setProfileViewUser(currentUser);
    setShowProfile(true);
    setProfileEditMode(true);
    setEditStatus(userProfile.status);
    setTimeout(() => {
      if (editQuoteRef.current) {
        editQuoteRef.current.innerHTML = userProfile.quote;
      }
    }, 0);
    setActiveMenu(null);
  };

  const saveProfile = () => {
    const newProfile = {
      status: editStatus,
      quote: editQuoteRef.current?.innerHTML || ''
    };
    setUserProfile(newProfile);
    localStorage.setItem('slime_profile', JSON.stringify(newProfile));
    setShowProfile(false);
  };

  const saveSettings = () => {
    localStorage.setItem('slime_settings', JSON.stringify(settings));
    setTheme(settings.theme);
    setShowSettings(false);
  };

  const addAwayMessage = () => {
    if (awayMessages.length >= 3) {
      alert("Max 3 messages.");
      return;
    }
    if (newAwayTitle && newAwayText) {
      const newMsg = { id: Date.now(), title: newAwayTitle, text: newAwayText };
      const updated = [...awayMessages, newMsg];
      setAwayMessages(updated);
      if (updated.length === 1) setActiveAwayId(newMsg.id);
      localStorage.setItem('slime_away', JSON.stringify({ messages: updated, activeId: activeAwayId }));
      setNewAwayTitle('');
      setNewAwayText('');
    }
  };

  const deleteAwayMessage = (id: number) => {
    const updated = awayMessages.filter(m => m.id !== id);
    setAwayMessages(updated);
    localStorage.setItem('slime_away', JSON.stringify({ messages: updated, activeId: activeAwayId }));
  };

  const toggleEmoticons = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowColorPicker(false);
    setShowEmoticonPicker(!showEmoticonPicker);
  };

  const openColorPicker = (e: React.MouseEvent, mode: 'foreColor' | 'hiliteColor') => {
    e.stopPropagation();
    setShowEmoticonPicker(false);
    setCurrentColorMode(mode);
    setShowColorPicker(!showColorPicker);
  };

  const applyColor = (color: string) => {
    formatDoc(currentColorMode, color);
    setShowColorPicker(false);
  };

  const insertEmoticon = (emoji: string) => {
    formatDoc('insertText', emoji);
    setShowEmoticonPicker(false);
  };

  const addLink = () => {
    const url = prompt('URL:');
    if (url) formatDoc('createLink', url);
  };

  const totalOnline = USER_GROUPS.reduce((sum, g) => sum + g.users.filter(u => u.status !== 'offline').length, 0);

  const handleLogin = () => {
    window.location.href = '/api/auth/discord/login';
  };

  if (!mounted) return null;

  const themeClasses = theme === 'neon' ? '' : `theme-${theme}`;

  if (!isOpen) {
    return (
      <button
        type="button"
        className="widget-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open slime.chat"
        style={{
          position: 'fixed',
          bottom: '20px',
          right: '20px',
          width: '60px',
          height: '60px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #ff5ccf, #b875ff)',
          border: '2px solid rgba(255, 255, 255, 0.1)',
          boxShadow: '0 0 20px rgba(255, 92, 207, 0.5)',
          display: 'grid',
          placeItems: 'center',
          cursor: 'pointer',
          zIndex: 1090,
          transition: 'transform 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        <span role="img" aria-label="snail" style={{ fontSize: '28px' }}>🐌</span>
      </button>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
        
        .font-vt { font-family: 'VT323', monospace; }
        .font-pixel { font-family: 'Press Start 2P', cursive; }
        
        #retro-chat-widget {
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 680px;
          max-width: calc(100vw - 40px);
          height: 580px;
          max-height: calc(100vh - 40px);
          z-index: 1090;
          background-color: #240046;
          border-top: 2px solid #9d4edd;
          border-left: 2px solid #9d4edd;
          border-right: 2px solid #10002b;
          border-bottom: 2px solid #10002b;
          animation: pulse-glow 3s infinite ease-in-out;
          display: flex;
          flex-direction: column;
          padding: 4px;
        }
        
        @keyframes pulse-glow {
          0% { box-shadow: 0 0 15px rgba(123, 44, 191, 0.4); }
          50% { box-shadow: 0 0 25px rgba(157, 78, 221, 0.7); }
          100% { box-shadow: 0 0 15px rgba(123, 44, 191, 0.4); }
        }
        
        .marquee-container {
          height: 40px;
          background: #240046;
          color: #00ff00;
          padding: 0;
          font-size: 18px;
          border-bottom: 1px solid #5a189a;
          white-space: nowrap;
          overflow-x: hidden;
          overflow-y: visible;
          position: relative;
          display: flex;
          align-items: center;
        }
        
        .marquee-text {
          font-family: 'VT323', monospace;
          display: inline-block;
          padding-left: 100%;
          animation: marquee 20s linear infinite;
          line-height: 1;
        }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-100%); }
        }
        
        .title-bar {
          height: 28px;
          background: linear-gradient(90deg, #3c096c 0%, #10002b 100%);
          color: #ff00ff;
          font-family: 'Press Start 2P', cursive;
          font-size: 10px;
          text-shadow: 2px 2px 0 #000;
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0 8px;
          border-bottom: 2px solid #10002b;
          margin-bottom: 2px;
        }
        
        .close-btn {
          background: none;
          border: none;
          color: #ff00ff;
          cursor: pointer;
          font-size: 16px;
          padding: 0;
          line-height: 1;
        }
        
        .close-btn:hover {
          color: #00ff00;
        }
        
        .menu-bar {
          display: flex;
          align-items: center;
          padding: 4px 0;
          font-size: 16px;
          color: #e0aaff;
          position: relative;
          z-index: 150;
        }
        
        .menu-item {
          padding: 0 8px;
          cursor: pointer;
        }
        
        .menu-item:hover {
          background-color: #3c096c;
          color: #00ff00;
        }
        
        .dropdown-menu {
          position: absolute;
          top: 100%;
          left: 0;
          background-color: #240046;
          border: 2px solid #00ff00;
          min-width: 180px;
          display: flex;
          flex-direction: column;
          padding: 2px;
          box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
          z-index: 9000;
        }
        
        .dropdown-item {
          padding: 4px 12px;
          cursor: pointer;
          color: #e0aaff;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        
        .dropdown-item:hover {
          background-color: #00ff00;
          color: #000;
        }
        
        .tab-container {
          display: flex;
          gap: 4px;
          margin-left: 20px;
          flex: 1;
          padding-right: 4px;
        }
        
        .chat-tab {
          padding: 2px 10px;
          font-family: 'VT323', monospace;
          font-size: 16px;
          color: #9d4edd;
          cursor: pointer;
          border: 1px solid #9d4edd;
          border-radius: 4px 4px 0 0;
          background: rgba(36, 0, 70, 0.5);
          flex: 1;
          text-align: center;
        }
        
        .chat-tab:hover {
          color: #fff;
          background: #3c096c;
        }
        
        .chat-tab.active {
          background: #00ff00;
          color: #050010;
          border-color: #00ff00;
          font-weight: bold;
          box-shadow: 0 0 5px #00ff00;
        }
        
        .content-area {
          flex: 1;
          padding: 4px;
          margin-bottom: 4px;
          overflow: hidden;
        }
        
        .chat-history {
          height: 100%;
          padding: 8px;
          user-select: text;
          font-size: 18px;
        }
        
        .chat-history.text-small { font-size: 14px; }
        .chat-history.text-medium { font-size: 18px; }
        .chat-history.text-large { font-size: 22px; }
        
        .inset-box {
          background: #10002b;
          border-top: 2px solid #10002b;
          border-left: 2px solid #10002b;
          border-right: 2px solid #5a189a;
          border-bottom: 2px solid #5a189a;
          overflow-y: scroll;
          color: #00ff00;
          font-family: 'VT323', monospace;
        }
        
        .text-admin {
          color: #ff3333;
          text-shadow: 0 0 4px #ff0000;
        }
        
        .text-club {
          color: #00ffff;
          text-shadow: 0 0 4px #00aaaa;
        }
        
        .text-guild {
          color: #00ff00;
          text-shadow: 0 0 4px #00aa00;
        }
        
        .msg-line {
          margin-bottom: 4px;
        }
        
        .msg-timestamp {
          color: #9d4edd;
          font-size: 0.8em;
          margin-right: 6px;
          display: none;
        }
        
        .show-timestamps .msg-timestamp {
          display: inline;
        }
        
        .msg-text {
          color: #e0aaff;
        }
        
        .msg-system {
          color: #00ff00;
          font-style: italic;
        }
        
        .msg-self {
          color: #ff3333;
          font-weight: bold;
          text-shadow: 0 0 4px #ff0000;
        }
        
        .format-bar {
          height: 32px;
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 0 4px;
          background: #240046;
          margin-bottom: 4px;
          position: relative;
          z-index: 140;
        }
        
        .fmt-btn {
          width: 26px;
          height: 26px;
          font-size: 14px;
          background: #240046;
          border-top: 2px solid #9d4edd;
          border-left: 2px solid #9d4edd;
          border-right: 2px solid #10002b;
          border-bottom: 2px solid #10002b;
          color: #00ff00;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .fmt-btn:active {
          border: 2px solid #10002b;
          border-right: 2px solid #9d4edd;
          border-bottom: 2px solid #9d4edd;
        }
        
        .input-row {
          height: 60px;
          display: flex;
          gap: 6px;
          padding: 4px;
          position: relative;
          z-index: 145;
        }
        
        .input-box {
          flex: 1;
          background: #10002b;
          border: 2px inset #9d4edd;
          padding: 6px;
          font-family: 'VT323', monospace;
          font-size: 18px;
          color: #00ff00;
          outline: none;
          overflow-y: auto;
          cursor: text;
        }
        
        .input-box:focus {
          background: #1a0b35;
          box-shadow: inset 0 0 5px #9d4edd;
        }
        
        .input-box:empty::before {
          content: attr(placeholder);
          color: #555;
        }
        
        .send-btn {
          width: 70px;
          height: 48px;
          background: #240046;
          border-top: 2px solid #9d4edd;
          border-left: 2px solid #9d4edd;
          border-right: 2px solid #10002b;
          border-bottom: 2px solid #10002b;
          font-weight: bold;
          font-size: 16px;
          color: #00ff00;
          cursor: pointer;
          font-family: 'VT323', monospace;
        }
        
        .send-btn:active {
          border: 2px solid #10002b;
          color: #fff;
        }
        
        .popup-menu {
          position: absolute;
          background-color: #240046;
          border: 2px solid #00ff00;
          padding: 4px;
          z-index: 5000;
          box-shadow: 0 0 10px #00ff00;
          bottom: 40px;
          overflow-y: auto;
          overflow-x: hidden;
        }
        
        .picker-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 2px;
        }
        
        .picker-tab {
          font-size: 14px;
          margin-bottom: 4px;
          padding-bottom: 2px;
          border-bottom: 1px dashed #00ff00;
          font-weight: bold;
          color: #ff00ff;
          grid-column: 1 / -1;
          text-align: center;
          margin-top: 5px;
        }
        
        .picker-item {
          width: 30px;
          height: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          border: 1px solid transparent;
          color: #fff;
          font-size: 18px;
        }
        
        .picker-item:hover {
          background-color: #00ff00;
          color: #000;
        }
        
        .picker-item.snail-combo {
          font-size: 14px;
          letter-spacing: -2px;
        }
        
        .color-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 4px;
        }
        
        .color-swatch {
          width: 24px;
          height: 24px;
          border: 1px solid #555;
          cursor: pointer;
        }
        
        .color-swatch:hover {
          border: 2px solid #fff;
        }
        
        .modal-overlay {
          position: fixed;
          inset: 0;
          background: rgba(0, 0, 0, 0.5);
          backdrop-filter: blur(4px);
          z-index: 8000;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        .modal-window {
          background-color: #240046;
          border: 2px solid #9d4edd;
          padding: 16px;
          max-width: 440px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
        }
        
        .standard-btn {
          background: #240046;
          border-top: 2px solid #9d4edd;
          border-left: 2px solid #9d4edd;
          border-right: 2px solid #10002b;
          border-bottom: 2px solid #10002b;
          color: #00ff00;
          cursor: pointer;
          font-family: 'VT323', monospace;
          font-size: 16px;
          padding: 2px 8px;
        }
        
        .standard-btn:active {
          border-style: inset;
          color: #ff00ff;
        }
        
        .user-list-panel {
          position: absolute;
          top: 100%;
          right: 0;
          width: 220px;
          max-height: 400px;
          background-color: #240046;
          border: 2px solid #00ff00;
          z-index: 9000;
          box-shadow: 4px 4px 10px rgba(0,0,0,0.5);
        }
        
        .user-list {
          padding: 4px;
          font-size: 16px;
          display: flex;
          flex-direction: column;
          max-height: 380px;
          overflow-y: auto;
        }
        
        .group-header {
          background: linear-gradient(90deg, #3c096c 0%, rgba(60, 9, 108, 0) 100%);
          margin-top: 4px;
          padding: 4px 6px;
          font-weight: bold;
          font-size: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          text-shadow: 2px 2px 0 #000000;
          border-bottom: 1px solid #5a189a;
          border-left: 2px solid #9d4edd;
        }
        
        .group-content {
          padding-left: 12px;
          margin-bottom: 2px;
          background-color: rgba(0,0,0,0.2);
        }
        
        .user-item {
          display: flex;
          align-items: center;
          gap: 5px;
          padding: 2px 0;
          cursor: pointer;
          color: #e0aaff;
        }
        
        .user-item:hover {
          background-color: #3c096c;
          color: #fff;
        }
        
        .user-icon {
          color: #00ff00;
        }
        
        .user-item.offline {
          opacity: 0.6;
        }
        
        .user-item.offline .user-icon {
          color: #808080;
        }
        
        .user-item.away .user-icon {
          color: #ffff00;
        }
        
        @media (max-width: 768px) {
          #retro-chat-widget {
            width: calc(100vw - 20px);
            height: calc(100vh - 20px);
            bottom: 10px;
            right: 10px;
          }
        }
      `}</style>

      <div id="retro-chat-widget" className={`font-vt ${themeClasses}`}>
        {/* Marquee */}
        <div className="marquee-container">
          <div className="marquee-text">Welcome to slimyai.xyz! Connect to the Grid... Latest Patch v3.0.1464 available now...</div>
        </div>

        {/* Title Bar */}
        <div className="title-bar">
          <span>slime.on</span>
          <button className="close-btn" onClick={() => setIsOpen(false)} aria-label="Close chat">✕</button>
        </div>

        {/* Menu Bar */}
        <div className="menu-bar">
          <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => toggleMenu('file')}>
              <u>F</u>ile
            </div>
            {activeMenu === 'file' && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => openProfile(currentUser)}>View My Profile</div>
                <div className="dropdown-item" onClick={openEditProfile}>Edit Profile</div>
                <div className="dropdown-item" onClick={() => { setShowAwayManager(true); setActiveMenu(null); }}>Manage Away Messages...</div>
                <div className="dropdown-item" onClick={toggleAway}>{isAway ? "I'm Back" : "I'm Away"}</div>
                <div className="dropdown-item" onClick={() => { setShowSettings(true); setActiveMenu(null); }}>Settings...</div>
              </div>
            )}
          </div>

          <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => toggleMenu('edit')}>
              <u>E</u>dit
            </div>
            {activeMenu === 'edit' && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { document.execCommand('copy'); setActiveMenu(null); }}>Copy</div>
                <div className="dropdown-item" onClick={() => setActiveMenu(null)}>Paste (Ctrl+V)</div>
                <div className="dropdown-item" onClick={() => { document.execCommand('selectAll'); setActiveMenu(null); }}>Select All</div>
              </div>
            )}
          </div>

          <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => toggleMenu('view')}>
              <u>V</u>iew
            </div>
            {activeMenu === 'view' && (
              <div className="dropdown-menu">
                <div className="dropdown-item" onClick={() => { setTextSize('small'); setActiveMenu(null); }}>Size: Small</div>
                <div className="dropdown-item" onClick={() => { setTextSize('medium'); setActiveMenu(null); }}>Size: Medium</div>
                <div className="dropdown-item" onClick={() => { setTextSize('large'); setActiveMenu(null); }}>Size: Large</div>
                <div style={{ height: '1px', background: '#9d4edd', margin: '4px 0' }} />
                <div className="dropdown-item" onClick={() => { setShowTimestamps(!showTimestamps); setActiveMenu(null); }}>
                  {showTimestamps ? 'Hide' : 'Show'} Timestamps
                </div>
              </div>
            )}
          </div>

          <div className="menu-item-container" style={{ position: 'relative' }}>
            <div className="menu-item" onClick={() => setShowUserList(!showUserList)}>
              <u>U</u>sers
            </div>
            {showUserList && (
              <div className="user-list-panel">
                <div style={{ padding: '4px', textAlign: 'center', color: '#e0aaff', fontSize: '14px', borderBottom: '1px solid #5a189a' }}>
                  People Here: {totalOnline}
                </div>
                <div className="user-list">
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
                            const isCurrentUser = user.name === currentUser;
                            const displayStatus = isCurrentUser && isAway ? 'away' : user.status;
                            return (
                              <div
                                key={user.name}
                                className={`user-item ${displayStatus}`}
                                onClick={() => { openProfile(user.name); setShowUserList(false); }}
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
            )}
          </div>

          <div className="menu-item" onClick={() => alert('Slime On v3.0')}>
            <u>H</u>elp
          </div>

          <div className="tab-container">
            <div className={`chat-tab ${activeTab === 'Lounge' ? 'active' : ''}`} onClick={() => switchTab('Lounge')}>Lounge</div>
            <div className={`chat-tab ${activeTab === 'Club' ? 'active' : ''}`} onClick={() => switchTab('Club')}>Club</div>
            <div className={`chat-tab ${activeTab === 'Admin' ? 'active' : ''}`} onClick={() => switchTab('Admin')}>Admin</div>
          </div>
        </div>

        {/* Content Area */}
        <div className="content-area">
          <div
            className={`inset-box chat-history text-${textSize} ${showTimestamps ? 'show-timestamps' : ''}`}
            dangerouslySetInnerHTML={{ __html: history[activeTab] }}
          />
          <div ref={chatEndRef} />
        </div>

        {/* Format Bar */}
        <div className="format-bar">
          <div className="fmt-btn" onClick={(e) => openColorPicker(e, 'foreColor')} title="Text Color">A</div>
          <div className="fmt-btn" onClick={(e) => openColorPicker(e, 'hiliteColor')} title="Background">⬛</div>
          <div style={{ width: '2px', height: '20px', background: '#9d4edd', margin: '0 4px' }} />
          <div className="fmt-btn" onClick={() => formatDoc('bold')}>B</div>
          <div className="fmt-btn" onClick={() => formatDoc('italic')}>I</div>
          <div className="fmt-btn" onClick={() => formatDoc('underline')}>U</div>
          <div className="fmt-btn" onClick={addLink}>Link</div>
          <div className="fmt-btn" onClick={toggleEmoticons}>:)</div>

          {showEmoticonPicker && (
            <div className="popup-menu" style={{ width: '220px', maxHeight: '200px', right: 'auto', left: '50%', transform: 'translateX(-50%)' }}>
              <div className="picker-grid">
                <div className="picker-tab">Snail Pack</div>
                {EMOJIS.snailPack.map((e, i) => (
                  <div key={i} className="picker-item snail-combo" onClick={() => insertEmoticon(e)}>{e}</div>
                ))}
                <div className="picker-tab">Retro Pixels</div>
                {EMOJIS.retroPixels.map((e, i) => (
                  <div key={i} className="picker-item" onClick={() => insertEmoticon(e)}>{e}</div>
                ))}
              </div>
            </div>
          )}

          {showColorPicker && (
            <div className="popup-menu" style={{ width: '140px', left: 0 }}>
              <div className="picker-tab">{currentColorMode === 'foreColor' ? 'Text Color' : 'Background'}</div>
              <div className="color-grid">
                {COLORS.map((c, i) => (
                  <div key={i} className="color-swatch" style={{ backgroundColor: c }} onClick={() => applyColor(c)} />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Input Row */}
        <div className="input-row">
          <div
            ref={inputRef}
            className="input-box"
            contentEditable
            onKeyDown={handleKeyDown}
            suppressContentEditableWarning
          />
          <button className="send-btn" onClick={handleSendMessage}>SEND</button>
        </div>
      </div>

      {/* Profile Modal */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <div className="font-vt" style={{ color: '#e0aaff', fontSize: '16px' }}>
              <div style={{ marginBottom: '10px' }}>
                Screen Name: <span style={{ color: '#ff00ff' }}>{profileViewUser}</span>
              </div>

              {!profileEditMode ? (
                <div className="inset-box" style={{ padding: '8px', color: '#00ff00' }}>
                  <div>Status: <span style={{ color: '#fff' }}>{profileViewUser === currentUser ? userProfile.status : 'Online'}</span></div>
                  <div style={{ borderBottom: '1px solid #9d4edd', margin: '5px 0' }}>Quote:</div>
                  <div style={{ color: '#e0aaff', fontStyle: 'italic' }} dangerouslySetInnerHTML={{ __html: profileViewUser === currentUser ? userProfile.quote : 'Just hanging out.' }} />
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span>Status:</span>
                    <input
                      type="text"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value)}
                      className="input-box"
                      style={{ height: '36px', flex: 1 }}
                    />
                  </div>
                  <div>Quote:</div>
                  <div
                    ref={editQuoteRef}
                    className="input-box"
                    contentEditable
                    style={{ height: '120px' }}
                    suppressContentEditableWarning
                  />
                  <div style={{ textAlign: 'right', marginTop: '5px', display: 'flex', justifyContent: 'flex-end', gap: '5px' }}>
                    <button className="standard-btn" onClick={() => setShowProfile(false)}>Cancel</button>
                    <button className="standard-btn" onClick={saveProfile}>Save</button>
                  </div>
                </div>
              )}

              {!profileEditMode && (
                <button className="standard-btn" style={{ marginTop: '10px', width: '100%' }} onClick={() => setShowProfile(false)}>Close</button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {showSettings && (
        <div className="modal-overlay" onClick={() => setShowSettings(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '300px' }}>
            <div className="font-vt" style={{ color: '#e0aaff' }}>
              <h3 style={{ marginBottom: '10px' }}>Settings</h3>
              <div style={{ marginBottom: '8px' }}>
                Theme:
                <select
                  value={settings.theme}
                  onChange={(e) => setSettings({ ...settings, theme: e.target.value as Theme })}
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
                  onChange={(e) => setSettings({ ...settings, sounds: e.target.checked })}
                /> Enable Sounds
              </div>
              <div style={{ marginBottom: '8px' }}>
                <input
                  type="checkbox"
                  checked={settings.top}
                  onChange={(e) => setSettings({ ...settings, top: e.target.checked })}
                /> Always on Top
              </div>
              <div style={{ marginTop: '10px', textAlign: 'right' }}>
                <button className="standard-btn" onClick={saveSettings}>Save</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Away Manager Modal */}
      {showAwayManager && (
        <div className="modal-overlay" onClick={() => setShowAwayManager(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '350px' }}>
            <div className="font-vt" style={{ color: '#e0aaff' }}>
              <h3 style={{ marginBottom: '10px' }}>Away Messages</h3>
              <div style={{ marginBottom: '5px', fontSize: '14px' }}>Select active message:</div>
              <div className="inset-box" style={{ padding: '5px', marginBottom: '10px', maxHeight: '150px' }}>
                {awayMessages.map(msg => (
                  <div key={msg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px', borderBottom: '1px solid #555' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                      <input
                        type="radio"
                        name="away"
                        checked={msg.id === activeAwayId}
                        onChange={() => {
                          setActiveAwayId(msg.id);
                          localStorage.setItem('slime_away', JSON.stringify({ messages: awayMessages, activeId: msg.id }));
                        }}
                      />
                      <span style={{ cursor: 'pointer' }} onClick={() => {
                        setNewAwayTitle(msg.title);
                        setNewAwayText(msg.text);
                      }}>{msg.title}</span>
                    </div>
                    <button
                      className="standard-btn"
                      style={{ width: '24px', height: '24px', fontSize: '12px', padding: '0' }}
                      onClick={() => deleteAwayMessage(msg.id)}
                    >X</button>
                  </div>
                ))}
              </div>
              <div style={{ borderTop: '1px solid #9d4edd', paddingTop: '5px' }}>
                <div style={{ fontSize: '14px', marginBottom: '5px' }}>Create New (Max 3):</div>
                <div style={{ display: 'flex', gap: '5px', marginBottom: '5px' }}>
                  <input
                    type="text"
                    value={newAwayTitle}
                    onChange={(e) => setNewAwayTitle(e.target.value)}
                    placeholder="Title"
                    className="input-box"
                    style={{ flex: 1, height: '36px' }}
                  />
                  <button className="standard-btn" onClick={addAwayMessage}>Add</button>
                </div>
                <textarea
                  value={newAwayText}
                  onChange={(e) => setNewAwayText(e.target.value)}
                  placeholder="Message text..."
                  className="input-box"
                  style={{ height: '60px', width: '100%' }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
