import { useState, useRef, useEffect } from 'react';
import { EMOJIS, COLORS } from '../constants';
import type { Theme, TextSize, UserProfile, AwayMessage } from '../types';
import { useAuth } from '@/lib/auth/context';

export function useChatState(mode: 'widget' | 'page') {
   const { user } = useAuth();
   const username = (user as any)?.globalName || (user as any)?.username || (user as any)?.name || 'Operator';
   const [mounted, setMounted] = useState(false);

   // Settings
   const [theme, setTheme] = useState<Theme>('neon');
   const [textSize, setTextSize] = useState<TextSize>('medium');
   const [showTimestamps, setShowTimestamps] = useState(false);
   const [userProfile, setUserProfile] = useState<UserProfile>({ status: 'Online', quote: 'Reality is broken.' });
   const [isAway, setIsAway] = useState(false);
   const [settings, setSettings] = useState({ theme: 'neon' as Theme, sounds: true, top: false });

   // UI State
   const [activeTab, setActiveTab] = useState('Lounge');
   const [activeMenu, setActiveMenu] = useState<string | null>(null);
   const [showProfile, setShowProfile] = useState(false);
   const [showSettings, setShowSettings] = useState(false);
   const [showAwayManager, setShowAwayManager] = useState(false);
   const [profileEditMode, setProfileEditMode] = useState(false);
   const [profileViewUser, setProfileViewUser] = useState<string | null>(null);
   const [showUserList, setShowUserList] = useState(false);

   // Popup States
   const [showEmoticonPicker, setShowEmoticonPicker] = useState(false);
   const [showColorPicker, setShowColorPicker] = useState(false);
   const [currentColorMode, setCurrentColorMode] = useState<'foreColor' | 'hiliteColor'>('foreColor');

   // Chat State
   const [history, setHistory] = useState<Record<string, string>>({
      'Lounge': '',
      'Club': '',
      'Admin': ''
   });
   const [awayMessages, setAwayMessages] = useState<AwayMessage[]>([{ id: 1, title: "Lunch", text: "Out to lunch." }]);
   const [activeAwayId, setActiveAwayId] = useState(1);
   const [editStatus, setEditStatus] = useState('');
   const [newAwayTitle, setNewAwayTitle] = useState('');
   const [newAwayText, setNewAwayText] = useState('');

   const inputRef = useRef<HTMLDivElement>(null);
   const chatEndRef = useRef<HTMLDivElement>(null);
   const editQuoteRef = useRef<HTMLDivElement>(null);

   const handleSendMessage = () => {
      if (!inputRef.current) return;
      const txt = inputRef.current.innerHTML.trim();
      if (!txt) return;

      const time = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const newMsg = `<div class="msg-line"><span class="msg-timestamp">${time}</span><span class="msg-self text-admin">${username}:</span> <span class="msg-text">${txt}</span></div>`;

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
      setProfileViewUser(username);
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

   // Persistence effect
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

   // Auto-scroll effect
   useEffect(() => {
      chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
   }, [history, activeTab]);

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

   return {
      // Mounted state
      mounted,
      // Settings state
      theme,
      setTheme,
      textSize,
      setTextSize,
      showTimestamps,
      setShowTimestamps,
      userProfile,
      setUserProfile,
      isAway,
      setIsAway,
      settings,
      setSettings,

      // UI state
      activeTab,
      setActiveTab,
      activeMenu,
      setActiveMenu,
      showProfile,
      setShowProfile,
      showSettings,
      setShowSettings,
      showAwayManager,
      setShowAwayManager,
      profileEditMode,
      setProfileEditMode,
      profileViewUser,
      setProfileViewUser,
      showUserList,
      setShowUserList,

      // Popup state
      showEmoticonPicker,
      setShowEmoticonPicker,
      showColorPicker,
      setShowColorPicker,
      currentColorMode,
      setCurrentColorMode,

      // Chat state
      history,
      setHistory,
      awayMessages,
      setAwayMessages,
      activeAwayId,
      setActiveAwayId,
      editStatus,
      setEditStatus,
      newAwayTitle,
      setNewAwayTitle,
      newAwayText,
      setNewAwayText,

      // Refs
      inputRef,
      chatEndRef,
      editQuoteRef,

      // Handlers
      handleSendMessage,
      handleKeyDown,
      formatDoc,
      toggleMenu,
      switchTab,
      toggleAway,
      openProfile,
      openEditProfile,
      saveProfile,
      saveSettings,
      addAwayMessage,
      deleteAwayMessage,
      toggleEmoticons,
      openColorPicker,
      applyColor,
      insertEmoticon,
      addLink
   };
}
