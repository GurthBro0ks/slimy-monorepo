'use client';

import { useState, useEffect } from 'react';
import { chatStorage, ConversationSummary } from '@/lib/chat/storage';
import { useAuth } from '@/lib/auth/context';
import { Button } from '@/components/ui/button';
import { MessageSquare, Clock, Trash2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface MessageListProps {
  onConversationSelect: (conversationId: string) => void;
  currentConversationId?: string | null;
  refreshTrigger?: number;
}

export function MessageList({
  onConversationSelect,
  currentConversationId,
  refreshTrigger
}: MessageListProps) {
  const { user } = useAuth();
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadConversations = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);
      const convs = await chatStorage.getConversations(user.id);
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
      setError('Failed to load conversations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadConversations();
  }, [user, refreshTrigger]);

  const handleDeleteConversation = async (conversationId: string, event: React.MouseEvent) => {
    event.stopPropagation();

    if (!user || !confirm('Are you sure you want to delete this conversation?')) {
      return;
    }

    try {
      await chatStorage.deleteConversation(conversationId, user.id);
      setConversations(prev => prev.filter(conv => conv.id !== conversationId));

      // If this was the current conversation, clear selection
      if (currentConversationId === conversationId) {
        onConversationSelect('');
      }
    } catch (err) {
      console.error('Failed to delete conversation:', err);
      setError('Failed to delete conversation');
    }
  };

  if (loading) {
    return (
      <div className="p-4">
        <div className="animate-pulse space-y-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-16 bg-zinc-800 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4">
        <div className="text-center text-red-400 text-sm">
          {error}
          <Button
            variant="outline"
            size="sm"
            onClick={loadConversations}
            className="ml-2"
          >
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="p-4 text-center">
        <MessageSquare className="h-8 w-8 text-zinc-600 mx-auto mb-2" />
        <p className="text-zinc-500 text-sm">No conversations yet</p>
        <p className="text-zinc-600 text-xs mt-1">
          Start a chat to create your first conversation
        </p>
      </div>
    );
  }

  return (
    <div className="p-2">
      <div className="space-y-2">
        {conversations.map((conversation) => (
          <div
            key={conversation.id}
            className={`group relative p-3 rounded-lg border cursor-pointer transition-all ${
              currentConversationId === conversation.id
                ? 'border-neon-green bg-neon-green/10'
                : 'border-zinc-700 bg-zinc-800/50 hover:border-zinc-600 hover:bg-zinc-800'
            }`}
            onClick={() => onConversationSelect(conversation.id)}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-medium text-zinc-200 truncate">
                  {conversation.title || 'Untitled Conversation'}
                </h3>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span className="capitalize">{conversation.personalityMode}</span>
                  <span>•</span>
                  <span>{conversation.messageCount} messages</span>
                </div>
                <div className="flex items-center gap-1 mt-1 text-xs text-zinc-600">
                  <Clock className="h-3 w-3" />
                  <span>{formatDistanceToNow(conversation.updatedAt, { addSuffix: true })}</span>
                </div>
              </div>

              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => handleDeleteConversation(conversation.id, e)}
                className="opacity-0 group-hover:opacity-100 h-6 w-6 p-0 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
