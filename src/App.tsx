import React, { useState, useRef, useEffect } from 'react';
import { Send, ChevronDown, Settings, User } from 'lucide-react';
import { MessageItem } from './components/MessageItem';
import { ModelSettings } from './components/ModelSettings';
import { ChatHistory } from './components/ChatHistory';
import type { Message, ChatState, OllamaModel, Chat } from './types';
import ThemeToggle from './components/ThemeToggle';

function App() {
  const [chats, setChats] = useState<Chat[]>(() => {
    const saved = localStorage.getItem('chats');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [state, setState] = useState<ChatState>({
    messages: [],
    isLoading: false,
  });
  const [input, setInput] = useState('');
  const [models, setModels] = useState<OllamaModel[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('deepseek');
  const [isModelDropdownOpen, setIsModelDropdownOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const [theme, setTheme] = useState(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme');
      return savedTheme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    }
    return 'light';
  });
  
  // Auto-resize textarea as content grows
  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    localStorage.setItem('theme', theme);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [input,theme]);
  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };
  // Save chats to localStorage
  useEffect(() => {
    localStorage.setItem('chats', JSON.stringify(chats));
  }, [chats]);

  const fetchModels = async () => {
    try {
      const response = await fetch('http://localhost:11434/api/tags');
      const data = await response.json();
      setModels(data.models);
      if (data.models.length > 0 && !data.models.find(m => m.name === selectedModel)) {
        setSelectedModel(data.models[0].name);
      }
    } catch (error) {
      console.error('Error fetching models:', error);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsModelDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [state.messages]);

  const createNewChat = () => {
    const newChat: Chat = {
      id: crypto.randomUUID(),
      title: 'New conversation',
      messages: [],
      createdAt: new Date(),
      modelId: selectedModel,
    };
    setChats(prev => [newChat, ...prev]);
    setCurrentChatId(newChat.id);
    setState({ messages: [], isLoading: false });
    setInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || state.isLoading) return;

    // Cancel any ongoing request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const userMessage: Message = { role: 'user', content: input };
    
    // Create new chat if none exists
    if (!currentChatId) {
      createNewChat();
    }

    setState(prev => ({
      messages: [...prev.messages, userMessage, { role: 'assistant', content: '' }],
      isLoading: true,
    }));
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    try {
      abortControllerRef.current = new AbortController();
      const response = await fetch('http://localhost:11434/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          prompt: input,
          stream: true,
        }),
        signal: abortControllerRef.current.signal,
      });

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() === '') continue;
            
            try {
              const data = JSON.parse(line);
              assistantMessage += data.response;
              
              setState(prev => ({
                ...prev,
                messages: prev.messages.map((msg, idx) => 
                  idx === prev.messages.length - 1
                    ? { ...msg, content: assistantMessage }
                    : msg
                ),
              }));
            } catch (e) {
              console.error('Error parsing JSON:', e);
            }
          }
        }
      }

      setState(prev => ({ ...prev, isLoading: false }));

      // Update chat in storage
      setChats(prev => prev.map(chat => {
        if (chat.id === currentChatId) {
          return {
            ...chat,
            messages: [
              ...chat.messages,
              userMessage,
              { role: 'assistant', content: assistantMessage }
            ],
            title: chat.messages.length === 0 ? input.slice(0, 50) : chat.title,
          };
        }
        return chat;
      }));
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Request aborted');
      } else {
        console.error('Error:', error);
      }
      setState(prev => ({ ...prev, isLoading: false }));
    } finally {
      abortControllerRef.current = null;
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSelectChat = (chatId: string) => {
    // Cancel any ongoing request when switching chats
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    const chat = chats.find(c => c.id === chatId);
    if (chat) {
      setCurrentChatId(chatId);
      setState({ messages: chat.messages, isLoading: false });
      setSelectedModel(chat.modelId);
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900 text-gray-800 dark:text-gray-100 transition-colors duration-200">
      <ChatHistory
        chats={chats}
        currentChatId={currentChatId}
        onSelectChat={handleSelectChat}
        onNewChat={createNewChat}
      />

      <div className="flex-1 flex flex-col">
        <header className="flex w-100 bg-transparent">
          <div className="w-full flex justify-end px-4 py-3">
          
        <div className="flex items-center gap-4">
          {/* Model Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
          onClick={() => setIsModelDropdownOpen(!isModelDropdownOpen)}
          className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-all duration-200"
            >
          {selectedModel}
                  <ChevronDown className="w-4 h-4" />
                </button>

                {isModelDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-10 transition-opacity duration-200">
                    <div className="py-1" role="menu">
                      {models.map((model) => (
                        <button
                          key={model.name}
                          onClick={() => {
                            setSelectedModel(model.name);
                            setIsModelDropdownOpen(false);
                          }}
                          className={`block w-full text-left px-4 py-2 text-sm ${selectedModel === model.name
                              ? 'bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-gray-100'
                              : 'text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600'
                            } transition-colors duration-200`}
                          role="menuitem"
                        >
                          {model.name}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* User Menu and Theme Toggle */}
              <div className="relative flex flex-1 gap-2 align-middle" ref={userMenuRef}>
                <button
                  onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-600 hover:bg-gray-300 dark:hover:bg-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800 transition-colors duration-200"
                >
                  <User className="w-5 h-5 text-gray-600 dark:text-gray-300" />
                </button>
                <ThemeToggle
                  theme={theme}
                  onToggle={toggleTheme}
                />
                {isUserMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white dark:bg-gray-700 ring-1 ring-black ring-opacity-5 dark:ring-gray-600 z-10 transition-opacity duration-200">
                    <div className="py-1" role="menu">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="flex items-center gap-2 w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                        role="menuitem"
                      >
                        <Settings className="w-4 h-4" />
                        Model Settings
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Chat Area */}
        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-gray-50 to-white dark:from-gray-900 dark:to-gray-800 transition-colors duration-200">
          {state.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 dark:text-gray-500 transition-colors duration-200">
              <p>Start a conversation with the AI...</p>
            </div>
          ) : (
            <div className="space-y-4">
              {state.messages.map((message, index) => (
                <MessageItem key={index} message={message} />
              ))}
              {state.isLoading && (
                <div className="max-w-3xl mx-auto px-4 py-8">
                  <div className="animate-pulse flex gap-6">
                    <div className="w-8 h-8 bg-gray-200 dark:bg-gray-700 rounded-full transition-colors duration-200"></div>
                    <div className="flex-1 space-y-3">
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded transition-colors duration-200"></div>
                      <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded w-3/4 transition-colors duration-200"></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          )}
        </main>

        {/* Footer Input Area */}
        <footer className="flex-shrink-0 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 transition-colors duration-200">
          <div className="max-w-3xl mx-auto p-4">
            <form onSubmit={handleSubmit} className="flex gap-4">
              <div className="flex-1 min-w-0">
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Type your message... (Shift + Enter for new line)"
                  className="w-full rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none overflow-hidden min-h-[44px] max-h-[200px] bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 transition-all duration-200"
                  disabled={state.isLoading}
                  rows={1}
                  style={{ lineHeight: '1.5' }}
                />
                <div className="mt-1 text-xs text-gray-500 dark:text-gray-400 transition-colors duration-200">
                  Press Shift + Enter for new line, Enter to send
                </div>
              </div>
              <button
                type="submit"
                disabled={state.isLoading}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed self-start transition-colors duration-200 dark:bg-blue-700 dark:hover:bg-blue-800 dark:focus:ring-offset-gray-800"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </footer>

        {/* Settings Modal */}
        {isSettingsOpen && (
          <ModelSettings
            models={models}
            onClose={() => setIsSettingsOpen(false)}
            onModelChange={fetchModels}
          />
        )}
      </div>
    </div>
  );
}

export default App;