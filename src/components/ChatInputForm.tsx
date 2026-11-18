import React from 'react';
import { STRINGS } from '../i18n/en';
import { SendIcon, MicIcon } from './icons';

interface ChatInputFormProps {
  input: string;
  setInput: (val: string) => void;
  isStreaming: boolean;
  isListening: boolean;
  onSend: (text: string) => void;
  onVoiceInput: () => void;
}

export const ChatInputForm: React.FC<ChatInputFormProps> = ({
  input,
  setInput,
  isStreaming,
  isListening,
  onSend,
  onVoiceInput,
}) => {
  return (
    <div className="p-4 border-t border-slate-200 bg-white">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSend(input);
        }}
        className="flex items-center gap-2"
      >
        <input
          type="text"
          aria-label="Ask a question about smog protection"
          data-testid="chat-input"
          value={input}
          maxLength={600}
          onChange={(e) => setInput(e.target.value)}
          placeholder={STRINGS.chat.placeholder}
          className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-600 focus:bg-white text-slate-900 min-h-[44px]"
        />

        <button
          type="button"
          onClick={onVoiceInput}
          aria-label="Voice input in Hindi or English"
          title="Voice Input (Hindi / English)"
          className={`p-2.5 rounded-xl border transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center ${
            isListening
              ? 'bg-rose-600 text-white border-rose-600 animate-pulse'
              : 'bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200'
          }`}
        >
          <MicIcon className="w-5 h-5" />
        </button>

        <button
          type="submit"
          data-testid="chat-send"
          aria-label="Send question"
          disabled={isStreaming || !input.trim()}
          className="px-4 py-2.5 bg-teal-700 hover:bg-teal-800 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1 min-h-[44px]"
        >
          <SendIcon className="w-4 h-4" />
          <span className="hidden sm:inline">{STRINGS.chat.send}</span>
        </button>
      </form>

      <p className="text-[10px] text-slate-500 text-center mt-2">{STRINGS.app.disclaimerShort}</p>
    </div>
  );
};
