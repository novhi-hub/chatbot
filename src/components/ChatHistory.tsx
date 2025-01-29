import React from 'react';
import { MessageSquarePlus, MessageSquare, ChevronRight } from 'lucide-react';
import type { Chat } from '../types';

interface ChatHistoryProps {
  chats: Chat[];
  currentChatId: string | null;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export function ChatHistory({ chats, currentChatId, onSelectChat, onNewChat }: ChatHistoryProps) {
  return (
    <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col h-full transition-colors duration-200">
      <h1 className="text-xl font-semibold text-gray-800 dark:text-gray-100 transition-colors duration-200 font-['Space_Mono'] tracking-wider p-4 text-center">
      Ollama Chat
      </h1>
      <div className="p-4">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors duration-200"
        >
          <MessageSquarePlus className="w-4 h-4" />
          New Chat
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto">
        {chats.map((chat) => (
          <button
            key={chat.id}
            onClick={() => onSelectChat(chat.id)}
            className={`w-full text-left p-4 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 transition-colors duration-200 ${
              currentChatId === chat.id ? 'bg-gray-100 dark:bg-gray-700' : ''
            }`}
          >
            <MessageSquare className="w-4 h-4 flex-shrink-0" />
            <span className="flex-1 truncate text-sm text-gray-800 dark:text-gray-100">
              {chat.title || 'New conversation'}
            </span>
            <ChevronRight className="w-4 h-4 text-gray-400 dark:text-gray-500" />
          </button>
        ))}
      </div>
    </div>
  );
}