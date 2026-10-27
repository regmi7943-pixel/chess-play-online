import React, { useState, useRef, useEffect } from 'react';
import { Send, MessageSquare } from 'lucide-react';
import type { ChatMessage } from '../lib/types';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string) => void;
}

export const ChatBox: React.FC<ChatBoxProps> = ({ messages, onSendMessage }) => {
  const [inputText, setInputText] = useState<string>('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const quickPhrases = ['Good luck', 'Well played', 'Thanks', 'Nice move'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    onSendMessage(inputText);
    setInputText('');
  };

  return (
    <div className="flex flex-col h-full bg-[#141b26] border border-[#232f41] rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-1.5 px-3 py-2 bg-[#17202d] border-b border-[#232f41] text-xs font-semibold text-slate-200">
        <MessageSquare className="w-3.5 h-3.5 text-sky-400" />
        <span>Room Chat</span>
      </div>

      {/* Message history */}
      <div className="flex-1 overflow-y-auto p-2.5 space-y-2 max-h-[180px] sm:max-h-[220px] min-h-[120px]">
        {messages.length === 0 ? (
          <div className="text-center py-6 text-xs text-slate-500">
            No messages yet.
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`text-xs ${
                msg.isSystem ? 'text-amber-400/90 text-center italic py-0.5' : ''
              }`}
            >
              {!msg.isSystem && (
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span
                    className={`font-semibold ${
                      msg.senderColor === 'white'
                        ? 'text-slate-100'
                        : msg.senderColor === 'black'
                        ? 'text-amber-400'
                        : 'text-sky-300'
                    }`}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-[10px] text-slate-500">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
              )}
              {!msg.isSystem && (
                <div className="text-slate-200 bg-[#1b2433] px-2.5 py-1 rounded-lg inline-block max-w-[95%] break-words">
                  {msg.text}
                </div>
              )}
              {msg.isSystem && <span>{msg.text}</span>}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick response pills */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 bg-[#161f2c] border-t border-[#232f41] overflow-x-auto">
        {quickPhrases.map((phrase) => (
          <button
            key={phrase}
            type="button"
            onClick={() => onSendMessage(phrase)}
            className="text-[10px] whitespace-nowrap bg-[#1b2433] hover:bg-[#253244] border border-[#273447] text-slate-300 px-2 py-0.5 rounded-full transition-colors shrink-0"
          >
            {phrase}
          </button>
        ))}
      </div>

      {/* Input box */}
      <form onSubmit={handleSubmit} className="flex items-center gap-1.5 p-2 bg-[#17202d] border-t border-[#232f41]">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          placeholder="Message..."
          className="flex-1 bg-[#121924] border border-[#273549] rounded-lg px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
          maxLength={150}
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="p-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:bg-slate-700 disabled:text-slate-500 text-white transition-colors"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
