import React from 'react';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isRedFlag?: boolean;
}

interface ChatMessageListProps {
  messages: ChatMessage[];
  messagesEndRef: React.RefObject<HTMLDivElement>;
}

export const ChatMessageList: React.FC<ChatMessageListProps> = ({
  messages,
  messagesEndRef,
}) => {
  return (
    <div
      className="flex-1 overflow-y-auto p-4 space-y-4"
      role="log"
      aria-live="polite"
      aria-atomic="false"
    >
      {messages.map((m) => (
        <div
          key={m.id}
          className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
        >
          <div
            className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
              m.role === 'user'
                ? 'bg-teal-700 text-white rounded-br-xs'
                : 'bg-slate-100 text-slate-900 rounded-bl-xs border border-slate-200'
            }`}
          >
            {m.content || (
              <span className="inline-flex items-center gap-1 text-slate-500 italic">
                <span className="animate-spin text-xs">⌛</span> Thinking...
              </span>
            )}
          </div>
        </div>
      ))}
      <div ref={messagesEndRef} />
    </div>
  );
};
