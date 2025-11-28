import type { Theme } from './types';

export function getStyles(mode: 'widget' | 'page', theme: Theme): string {
   const isWidget = mode === 'widget';

   return `
      @import url('https://fonts.googleapis.com/css2?family=Press+Start+2P&family=VT323&display=swap');
      * { box-sizing: border-box; }

      body.theme-${theme} {
         background-color: ${theme === 'classic' ? '#008080' : theme === 'high-contrast' ? '#000' : '#050010'};
         ${theme === 'neon' ? `
            background-image: linear-gradient(rgba(20, 0, 40, 0.8) 1px, transparent 1px), linear-gradient(90deg, rgba(20, 0, 40, 0.8) 1px, transparent 1px);
            background-size: 40px 40px;
         ` : ''}
      }

      .font-vt { font-family: 'VT323', monospace; }
      .font-pixel { font-family: 'Press Start 2P', cursive; }
      .inset-3d { border-style: inset; border-width: 2px; }

      ${isWidget ? `
      #retro-chat-widget {
         position: fixed;
         bottom: 20px;
         right: 20px;
         width: 680px;
         height: 580px;
         z-index: 1090;
         background-color: #240046;
         border-top: 2px solid #9d4edd;
         border-left: 2px solid #9d4edd;
         border-right: 2px solid #10002b;
         border-bottom: 2px solid #10002b;
         ${theme === 'neon' ? 'animation: pulse-glow 3s infinite ease-in-out;' : ''}
         display: flex;
         flex-direction: column;
         padding: 4px;
         font-family: 'VT323', monospace;
      }
      ` : `
      #chat-window {
         position: absolute;
         top: 55%;
         left: 50%;
         transform: translate(-50%, -50%);
         width: 90%;
         max-width: 900px;
         height: 600px;
         max-height: 80vh;
         z-index: 100;
         background-color: #240046;
         border-top: 2px solid #9d4edd;
         border-left: 2px solid #9d4edd;
         border-right: 2px solid #10002b;
         border-bottom: 2px solid #10002b;
         ${theme === 'neon' ? 'animation: pulse-glow 3s infinite ease-in-out;' : ''}
         display: flex;
         flex-direction: column;
         padding: 4px;
      }
      `}

      @keyframes pulse-glow {
         0% { box-shadow: 0 0 15px rgba(123, 44, 191, 0.4); }
         50% { box-shadow: 0 0 25px rgba(157, 78, 221, 0.7); }
         100% { box-shadow: 0 0 15px rgba(123, 44, 191, 0.4); }
      }

      /* SLIME DRIP ANIMATION */
      @keyframes slime-fall {
         0% { top: -50%; opacity: 0; }
         20% { opacity: 0.5; }
         100% { top: 110%; opacity: 0; }
      }

      .slime-drip {
         position: absolute;
         background: linear-gradient(180deg, transparent, #00ff00);
         opacity: 0.3;
         animation: slime-fall 8s infinite linear;
         border-radius: 0 0 10px 10px;
      }

      #slime-overlay {
         position: absolute;
         top: 90px;
         left: 0;
         width: 100%;
         height: calc(100vh - 90px);
         pointer-events: none;
         z-index: 5;
         overflow: hidden;
      }

      .marquee-container {
         height: 60px;
         background: #240046;
         color: #00ff00;
         padding: 0;
         font-size: 22px;
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
         padding-top: 8px;
      }

      @keyframes marquee {
         0% { transform: translateX(0); }
         100% { transform: translateX(-100%); }
      }

      .title-bar {
         height: 32px;
         background: linear-gradient(90deg, #3c096c 0%, #10002b 100%);
         color: #ff00ff;
         font-family: 'Press Start 2P', cursive;
         font-size: 12px;
         text-shadow: 2px 2px 0 #000;
         display: flex;
         align-items: center;
         justify-content: space-between;
         padding: 0 8px;
         border-bottom: 2px solid #10002b;
         margin-bottom: 2px;
      }

      .menu-bar {
         display: flex;
         align-items: center;
         padding: 4px 0;
         font-size: 18px;
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
         font-size: 16px;
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
         font-size: 18px;
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
         display: flex;
         gap: 6px;
         padding: 4px;
         margin-bottom: 4px;
         overflow: hidden;
      }

      .chat-history {
         flex: 3;
         padding: 8px;
         user-select: text;
         font-size: 20px;
      }

      .chat-history.text-small { font-size: 16px; }
      .chat-history.text-medium { font-size: 20px; }
      .chat-history.text-large { font-size: 24px; }

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

      .user-list-container {
         flex: 1;
         display: flex;
         flex-direction: column;
      }

      .user-list-header {
         font-size: 16px;
         text-align: center;
         margin-bottom: 2px;
         color: #e0aaff;
      }

      .user-list {
         flex: 1;
         padding: 4px;
         font-size: 18px;
         display: flex;
         flex-direction: column;
      }

      .group-header {
         background: linear-gradient(90deg, #3c096c 0%, rgba(60, 9, 108, 0) 100%);
         margin-top: 4px;
         padding: 4px 6px;
         font-weight: bold;
         font-size: 20px;
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
         height: 36px;
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
         width: 28px;
         height: 28px;
         font-size: 16px;
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
         height: 70px;
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
         font-size: 20px;
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
         width: 80px;
         height: 50px;
         background: #240046;
         border-top: 2px solid #9d4edd;
         border-left: 2px solid #9d4edd;
         border-right: 2px solid #10002b;
         border-bottom: 2px solid #10002b;
         font-weight: bold;
         font-size: 18px;
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
         font-size: 16px;
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
         width: 32px;
         height: 32px;
         display: flex;
         align-items: center;
         justify-content: center;
         cursor: pointer;
         border: 1px solid transparent;
         color: #fff;
         font-size: 20px;
      }

      .picker-item:hover {
         background-color: #00ff00;
         color: #000;
      }

      .picker-item.snail-combo {
         font-size: 16px;
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
         font-size: 18px;
         padding: 2px 8px;
      }

      .standard-btn:active {
         border-style: inset;
         color: #ff00ff;
      }
   `;
}
