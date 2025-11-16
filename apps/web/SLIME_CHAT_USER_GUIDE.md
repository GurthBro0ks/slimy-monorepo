# Slime Chat User Guide

## Welcome to Slime Chat! 🎉

Slime Chat is an AI-powered conversational interface that lets you chat with different personality modes. Whether you need helpful assistance, witty banter, professional advice, creative inspiration, or technical expertise, Slime Chat has you covered!

## Getting Started

### Accessing Slime Chat

1. Navigate to the Slime Chat page at `/chat`
2. You'll see the chat interface with personality mode options at the top
3. Choose your preferred personality mode
4. Start chatting!

## Features

### 1. Personality Modes 🎭

Slime Chat offers 5 distinct personality modes to match your conversation style:

#### 😊 Helpful
- **Best for**: General questions, learning, getting assistance
- **Tone**: Friendly, warm, and encouraging
- **Example**: "I'd be happy to help you with that! Let me explain..."

#### 😏 Sarcastic
- **Best for**: When you want humor mixed with helpfulness
- **Tone**: Witty, playful, with clever remarks
- **Example**: "Oh, I see you're entrusting me with the tremendous task of..."

#### 💼 Professional
- **Best for**: Business communication, formal inquiries
- **Tone**: Formal, precise, and corporate
- **Example**: "I would recommend the following approach..."

#### 🎨 Creative
- **Best for**: Brainstorming, creative projects, artistic ideas
- **Tone**: Imaginative, expressive, innovative
- **Example**: "Let's think outside the box! Imagine if..."

#### 💻 Technical
- **Best for**: Programming, technical questions, code examples
- **Tone**: Detailed, precise, developer-focused
- **Example**: "Here's the implementation using TypeScript..."

### 2. Sending Messages 💬

**Desktop:**
- Type your message in the text area at the bottom
- Press `Enter` to send
- Press `Shift + Enter` to add a new line without sending

**Mobile:**
- Tap the text area to open the keyboard
- Type your message
- Tap the green send button (arrow icon)

### 3. Message History 📜

- All messages are displayed in chronological order
- Your messages appear on the right in green bubbles
- AI responses appear on the left in gray bubbles
- Each message shows a timestamp
- The chat automatically scrolls to the latest message

### 4. Copy Messages 📋

- Hover over any message to reveal the copy button
- Click the copy icon to copy the message text to your clipboard
- A checkmark appears briefly to confirm the copy

### 5. Clear Conversation 🗑️

- Click the "Clear Chat" button in the top right
- This removes all messages from the current session
- Your personality mode selection is preserved
- This action cannot be undone

### 6. Message Persistence 💾

- Your conversations are automatically saved in your browser
- Refresh the page and your chat history remains
- Clearing your browser data will remove saved conversations
- Each browser/device maintains its own conversation history

## Tips for Best Results

### 1. Be Specific
Instead of: "Tell me about coding"
Try: "Explain how to use React hooks with TypeScript"

### 2. Choose the Right Personality
- Use **Technical** mode for code-related questions
- Use **Professional** mode for business writing
- Use **Creative** mode for brainstorming ideas
- Use **Helpful** mode for general questions
- Use **Sarcastic** mode when you want entertainment

### 3. Provide Context
The AI remembers your last 10 messages, so you can:
- Ask follow-up questions
- Reference previous parts of the conversation
- Build on earlier topics

### 4. Experiment with Modes
- Try asking the same question in different modes
- See how the personality affects the response style
- Switch modes mid-conversation for variety

## Usage Limits

### Rate Limiting
- **Limit**: 10 messages per minute
- **Purpose**: Prevent abuse and ensure fair access
- **What happens**: If you exceed the limit, you'll see an error message
- **Solution**: Wait 60 seconds before sending more messages

### Message Length
- **Recommended**: Keep messages under 500 characters for best results
- **Maximum**: No hard limit, but longer messages may take longer to process

## Privacy & Data

### What We Store
- Conversations are stored locally in your browser (localStorage)
- No server-side conversation storage (currently)
- Messages are sent to OpenAI API for processing

### What We Don't Store
- Personal identifying information
- Conversation history on servers
- User accounts or profiles (no authentication required)

### Data Security
- All communication uses HTTPS encryption
- API keys are never exposed to the client
- Rate limiting prevents abuse

## Troubleshooting

### Problem: Messages Not Sending

**Possible Causes:**
1. Rate limit exceeded
2. Network connection issues
3. API service temporarily unavailable

**Solutions:**
1. Wait 60 seconds and try again
2. Check your internet connection
3. Refresh the page
4. Try again in a few minutes

### Problem: Slow Responses

**Possible Causes:**
1. High server load
2. Complex query requiring more processing
3. Network latency

**Solutions:**
1. Be patient - responses typically arrive within 2-5 seconds
2. Simplify your question
3. Check your internet connection

### Problem: Messages Disappeared

**Possible Causes:**
1. Browser data was cleared
2. Using a different browser/device
3. Incognito/private browsing mode

**Solutions:**
1. Messages are stored per browser - check if you're using the same one
2. Avoid clearing browser data if you want to keep conversations
3. Regular browsing mode preserves conversations better

### Problem: Error Messages

**"Rate limit exceeded"**
- Wait 60 seconds before sending more messages

**"Failed to send message"**
- Check your internet connection
- Refresh the page and try again

**"An error occurred"**
- The service may be temporarily unavailable
- Try again in a few minutes
- If the problem persists, contact support

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `Enter` | Send message |
| `Shift + Enter` | New line in message |
| `Esc` | Clear input field (if empty) |

## Mobile Experience

### Optimized for Mobile
- Responsive design works on all screen sizes
- Touch-friendly buttons and controls
- Optimized text input for mobile keyboards
- Smooth scrolling on touch devices

### Mobile Tips
- Use landscape mode for more typing space
- Tap personality buttons to switch modes
- Swipe to scroll through long conversations
- Use the send button instead of keyboard shortcuts

## Best Practices

### 1. Start Simple
- Begin with a clear, straightforward question
- Add complexity in follow-up messages

### 2. Use Follow-ups
- Build on previous responses
- Ask for clarification or more details
- Reference earlier parts of the conversation

### 3. Switch Modes Strategically
- Change personality modes to get different perspectives
- Use Technical mode for implementation details
- Use Creative mode for alternative approaches

### 4. Save Important Information
- Use the copy button to save useful responses
- Paste into a note-taking app for reference
- Export conversations (feature coming soon)

## Examples of Great Prompts

### For Technical Mode 💻
```
"Show me how to implement a custom React hook for fetching data with TypeScript"
"Explain the difference between async/await and Promises with code examples"
"Help me debug this error: [paste error message]"
```

### For Creative Mode 🎨
```
"Give me 5 unique ideas for a mobile app that helps people learn languages"
"Write a creative tagline for an eco-friendly coffee shop"
"Suggest innovative ways to gamify a fitness tracking app"
```

### For Professional Mode 💼
```
"Draft a professional email declining a job offer politely"
"Outline a project proposal for implementing a new CRM system"
"Provide talking points for a quarterly business review presentation"
```

### For Helpful Mode 😊
```
"Explain how photosynthesis works in simple terms"
"What are the best practices for staying productive while working from home?"
"Help me understand the basics of investing in stocks"
```

### For Sarcastic Mode 😏
```
"Why do people still use Internet Explorer?"
"Explain why Mondays are the worst"
"Tell me about the joys of debugging production code at 3 AM"
```

## Frequently Asked Questions

### Q: Do I need to create an account?
**A:** No! Slime Chat works without any authentication. Just visit the page and start chatting.

### Q: How long are conversations saved?
**A:** Conversations are saved in your browser indefinitely until you clear your browser data or manually clear the chat.

### Q: Can I share my conversations?
**A:** Currently, you can copy individual messages. Conversation sharing and export features are planned for a future update.

### Q: Is there a mobile app?
**A:** Not yet, but the web interface is fully responsive and works great on mobile browsers.

### Q: Can I customize the personality modes?
**A:** Custom personality modes are planned for a future update. For now, you can choose from the 5 available modes.

### Q: What AI model powers Slime Chat?
**A:** Slime Chat uses OpenAI's GPT-4, one of the most advanced language models available.

### Q: Are there any costs?
**A:** Slime Chat is free to use! We handle the API costs.

### Q: Can the AI remember information across sessions?
**A:** Currently, the AI only remembers the last 10 messages in your current session. Cross-session memory is planned for future updates.

## Coming Soon 🚀

We're constantly improving Slime Chat! Here's what's on the roadmap:

- **Message Streaming**: See responses appear in real-time as they're generated
- **Voice Input/Output**: Talk to Slime Chat using your voice
- **Image Upload**: Share images and get AI analysis
- **Conversation Export**: Download your chats as PDF or JSON
- **User Accounts**: Save conversations across devices
- **Custom Personalities**: Create your own personality modes
- **Multi-language Support**: Chat in your preferred language
- **Code Syntax Highlighting**: Better formatting for code snippets
- **Message Reactions**: React to messages with emojis
- **Conversation Search**: Find specific messages in your history

## Feedback & Support

We'd love to hear from you!

- **Bug Reports**: Found a bug? Let us know!
- **Feature Requests**: Have an idea? We want to hear it!
- **General Feedback**: Tell us what you think!

Contact us through the main Slimy.ai website or Discord community.

---

**Happy Chatting!** 🎉

We hope you enjoy using Slime Chat. Whether you're looking for help, inspiration, or just a good laugh, we're here to make your conversations engaging and productive.

*Last Updated: November 1, 2025*
