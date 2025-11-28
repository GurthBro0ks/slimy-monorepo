'use client';

import React, { useEffect } from 'react';
import { useChatState } from './hooks';
import { getStyles } from './styles';
import { ProfileModal } from './components/ProfileModal';
import { SettingsModal } from './components/SettingsModal';
import { AwayManagerModal } from './components/AwayManagerModal';
import { ChatTitleBar } from './components/ChatTitleBar';
import { ChatMenuBar } from './components/ChatMenuBar';
import { ChatContent } from './components/ChatContent';
import { UserListSidebar } from './components/UserListSidebar';
import { UserListDropdown } from './components/UserListDropdown';
import { ChatFormatBar } from './components/ChatFormatBar';
import { ChatInput } from './components/ChatInput';
import { USER_GROUPS } from './constants';

interface RetroChatProps {
   mode: 'widget' | 'page';
   isOpen?: boolean;
   onClose?: () => void;
}

export function RetroChat({ mode, isOpen = true, onClose }: RetroChatProps) {
   const state = useChatState(mode);

   // Page mode: always show
   // Widget mode: only show if isOpen
   if (!state.mounted) return null;
   if (mode === 'widget' && !isOpen) return null;

   const containerId = mode === 'widget' ? 'retro-chat-widget' : 'chat-window';
   const themeClasses = state.theme === 'neon' ? '' : `theme-${state.theme}`;

   const totalOnline = USER_GROUPS.reduce((sum, g) => sum + g.users.filter(u => u.status !== 'offline').length, 0);

   return (
      <>
         <style dangerouslySetInnerHTML={{ __html: getStyles(mode, state.theme) }} />

         <div id={containerId} className="font-vt">
            {/* Title Bar */}
            <ChatTitleBar mode={mode} onClose={onClose} />

            {/* Menu Bar */}
            <ChatMenuBar
               mode={mode}
               activeTab={state.activeTab}
               activeMenu={state.activeMenu}
               textSize={state.textSize}
               showTimestamps={state.showTimestamps}
               isAway={state.isAway}
               onToggleMenu={state.toggleMenu}
               onSwitchTab={state.switchTab}
               onSetTextSize={state.setTextSize}
               onToggleTimestamps={() => state.setShowTimestamps(!state.showTimestamps)}
               onOpenEditProfile={state.openEditProfile}
               onOpenProfile={state.openProfile}
               onShowAwayManager={() => state.setShowAwayManager(true)}
               onToggleAway={state.toggleAway}
               onShowSettings={() => state.setShowSettings(true)}
            />

            {/* Content Area */}
            <div className="content-area">
               <ChatContent
                  history={state.history[state.activeTab]}
                  textSize={state.textSize}
                  showTimestamps={state.showTimestamps}
                  chatEndRef={state.chatEndRef}
               />

               {mode === 'page' ? (
                  <UserListSidebar isAway={state.isAway} onOpenProfile={state.openProfile} />
               ) : (
                  <UserListDropdown show={state.showUserList} isAway={state.isAway} onOpenProfile={state.openProfile} />
               )}
            </div>

            {/* Format Bar */}
            <ChatFormatBar
               showEmoticonPicker={state.showEmoticonPicker}
               showColorPicker={state.showColorPicker}
               currentColorMode={state.currentColorMode}
               onOpenColorPicker={state.openColorPicker}
               onToggleEmoticons={state.toggleEmoticons}
               onFormatDoc={state.formatDoc}
               onAddLink={state.addLink}
               onInsertEmoticon={state.insertEmoticon}
               onApplyColor={state.applyColor}
            />

            {/* Input Row */}
            <ChatInput
               inputRef={state.inputRef}
               onKeyDown={state.handleKeyDown}
               onSendMessage={state.handleSendMessage}
            />
         </div>

         {/* Modals */}
         <ProfileModal
            isOpen={state.showProfile}
            profileViewUser={state.profileViewUser}
            editMode={state.profileEditMode}
            userProfile={state.userProfile}
            editStatus={state.editStatus}
            editQuoteRef={state.editQuoteRef}
            onClose={() => state.setShowProfile(false)}
            onEditModeChange={state.setProfileEditMode}
            onStatusChange={state.setEditStatus}
            onSave={state.saveProfile}
         />

         <SettingsModal
            isOpen={state.showSettings}
            settings={state.settings}
            onSettingsChange={state.setSettings}
            onSave={state.saveSettings}
            onClose={() => state.setShowSettings(false)}
         />

         <AwayManagerModal
            isOpen={state.showAwayManager}
            awayMessages={state.awayMessages}
            activeAwayId={state.activeAwayId}
            newAwayTitle={state.newAwayTitle}
            newAwayText={state.newAwayText}
            onActiveAwayIdChange={state.setActiveAwayId}
            onDeleteAwayMessage={state.deleteAwayMessage}
            onNewAwayTitleChange={state.setNewAwayTitle}
            onNewAwayTextChange={state.setNewAwayText}
            onAddAwayMessage={state.addAwayMessage}
            onClose={() => state.setShowAwayManager(false)}
         />
      </>
   );
}
