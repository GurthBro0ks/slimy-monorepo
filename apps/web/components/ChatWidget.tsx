'use client';

import React, { useState } from 'react';

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        className="widget-toggle"
        onClick={() => setIsOpen(true)}
        aria-label="Open slime.chat"
        style={{ display: isOpen ? 'none' : 'flex' }}
      >
        <svg viewBox="0 0 24 24">
          <path d="M7 16a3 3 0 1 1-3-3 3 3 0 0 1 3 3zm13.66-3.66l-1.42 1.42a1 1 0 0 0-.29.7V17a1 1 0 0 1-1 1h-3.05A6 6 0 0 0 5.12 11h-.06a4 4 0 0 1 7.23-2.32 1 1 0 0 0 1.34.37 5.94 5.94 0 0 0 2.22-3.23 1 1 0 0 0-1.85-1.07 1 1 0 1 0-1.42 1.42A3.94 3.94 0 0 1 11.5 8a4 4 0 0 0-3.69 2.54l-.11.23A6 6 0 0 0 12 20h5a3 3 0 0 0 3-3 1 1 0 0 0 .66-1.66z" />
        </svg>
      </button>

      {isOpen && (
        <div className="chat-interface">
          <div className="aol-container">
            <div className="aol-titlebar">
              <span>slime.chat - Guild #8841</span>
              <span style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} role="button" tabIndex={0}>
                ✕
              </span>
            </div>

            <div className="aol-chat-view">
              <div className="chat-msg">
                <span className="chat-sender">SlimeBot:</span>{' '}
                <span className="chat-text system">Session resumed.</span>
              </div>
              <div className="chat-msg">
                <span className="chat-sender">SlimeBot:</span>{' '}
                <span className="chat-text">Welcome back, Admin. System is ready.</span>
              </div>
            </div>

            <div className="aol-roster">
              <div className="roster-group">
                <div className="roster-header">Admin (2/2)</div>
                <div className="roster-item">
                  <span className="roster-icon online" />
                  Tenko
                </div>
                <div className="roster-item">
                  <span className="roster-icon online" />
                  Catalyst
                </div>
              </div>
              <div className="roster-group">
                <div className="roster-header">Guild (8/16)</div>
                <div className="roster-item">
                  <span className="roster-icon" />
                  Lynn
                </div>
              </div>
            </div>

            <div className="aol-input-area">
              <input type="text" className="aol-input" placeholder="Enter message..." />
              <button type="button" className="aol-btn-send">
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default ChatWidget;
