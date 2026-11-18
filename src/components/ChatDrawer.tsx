import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { STRINGS } from '../i18n/en';
import { hasRedFlagSymptoms } from '../../api/_lib/prompts';
import { SendIcon, MicIcon, CloseIcon, SparklesIcon, AlertTriangleIcon } from './icons';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isRedFlag?: boolean;
}

export const ChatDrawer: React.FC = () => {
  const { isChatOpen, setIsChatOpen, air, profile, plan, scenario } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      role: 'assistant',
      content: `Hello! I am your BreatheFresh air quality companion. Ask me anything about window ventilation timing, purifier CADR sizing, safe commute hours, or individual precautions for your family.`,
    },
  ]);
  const [input, setInput] = useState('');
  const [isStreaming, setIsStreaming] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [criticalAlert, setCriticalAlert] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isStreaming]);

  if (!isChatOpen) return null;

  // Context pack for the Groq system prompt
  const contextPack = `CITY: ${profile.city.name}
CURRENT AIR: AQI ${air?.naqi.aqi ?? 'N/A'} (${air?.naqi.category ?? 'N/A'}), PM2.5 ${air?.current.pm2_5 ?? 'N/A'} µg/m³
CLEANEST WINDOW: ${air?.bestWindow.timeLabel ?? 'N/A'} (dips to ${air?.bestWindow.pm25 ?? 'N/A'} µg/m³)
PEAK SMOG: ${air?.worstWindow.timeLabel ?? 'N/A'} (peaks at ${air?.worstWindow.pm25 ?? 'N/A'} µg/m³)
FAMILY MEMBERS: ${scenario.members.map((m) => `${m.name} (${m.ageGroup}, ${m.conditions.join('/') || 'healthy'})`).join(', ')}
HOME: ${scenario.home.areaM2}m², Purifier: ${profile.lifestyle.hasPurifier ? 'Yes' : 'No'}
CURRENT PLAN HEADLINE: ${plan?.headline ?? 'Rule-based protection'}`;

  const handleSendMessage = async (textToSend: string) => {
    const trimmed = textToSend.trim();
    if (!trimmed || isStreaming) return;

    // Check 600 character cap and filter non-printable characters
    const sanitized = trimmed
      .slice(0, 600)
      .split('')
      .filter((c) => c.charCodeAt(0) >= 32 || c === '\n')
      .join('');

    // Check red-flag medical symptoms immediately on client
    if (hasRedFlagSymptoms(sanitized)) {
      setCriticalAlert(STRINGS.chat.redFlagWarning);
    } else {
      setCriticalAlert(null);
    }

    const userMsg: Message = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: sanitized,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setIsStreaming(true);

    const assistantMsgId = `assistant-${Date.now()}`;
    setMessages((prev) => [
      ...prev,
      { id: assistantMsgId, role: 'assistant', content: '' },
    ]);

    try {
      const recentHistory = [...messages.slice(-5), userMsg].map((m) => ({
        role: m.role,
        content: m.content,
      }));

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: recentHistory,
          contextPack,
          language: profile.language,
        }),
      });

      if (!res.ok || !res.body) {
        throw new Error('Chat API returned error');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const tLine = line.trim();
          if (!tLine || !tLine.startsWith('data: ')) continue;
          const dataStr = tLine.slice(6);
          if (dataStr === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataStr);
            if (parsed.token) {
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMsgId
                    ? { ...msg, content: msg.content + parsed.token }
                    : msg
                )
              );
            }
            if (parsed.isRedFlag) {
              setCriticalAlert(STRINGS.chat.redFlagWarning);
            }
          } catch {
            // ignore
          }
        }
      }
    } catch {
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMsgId
            ? {
                ...msg,
                content:
                  'Keep windows sealed and use your indoor air purifier during peak inversion hours. (AI service offline, showing guidance)',
              }
            : msg
        )
      );
    } finally {
      setIsStreaming(false);
    }
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: unknown; webkitSpeechRecognition?: unknown })
        .SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: unknown }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert('Voice recognition is not supported in this browser. Please type your message.');
      return;
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const recognition = new (SpeechRecognition as any)();
    recognition.lang = profile.language === 'hi' ? 'hi-IN' : 'en-IN';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognition.start();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/40 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-lg bg-white h-full shadow-2xl flex flex-col justify-between animate-in slide-in-from-right duration-200">
        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-teal-600 text-white shadow-xs">
              <SparklesIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-slate-900 text-base">
                {STRINGS.chat.drawerTitle}
              </h3>
              <p className="text-xs text-slate-500">
                Grounded in {profile.city.name} air data · Not medical advice
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsChatOpen(false)}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
          >
            <CloseIcon className="w-5 h-5" />
          </button>
        </div>

        {/* Critical Health Symptom Banner */}
        {criticalAlert && (
          <div className="m-4 p-3.5 bg-rose-50 border-2 border-rose-500 rounded-xl text-xs text-rose-950 flex items-start gap-2 shadow-sm animate-bounce">
            <AlertTriangleIcon className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold uppercase tracking-wide text-rose-800">
                Medical Warning
              </strong>
              {criticalAlert}
            </div>
          </div>
        )}

        {/* Message Stream */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((m) => (
            <div
              key={m.id}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] rounded-2xl px-4 py-3 text-xs sm:text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-teal-600 text-white rounded-br-xs'
                    : 'bg-slate-100 text-slate-800 rounded-bl-xs border border-slate-200'
                }`}
              >
                {m.content || (
                  <span className="inline-flex items-center gap-1 text-slate-400 italic">
                    <span className="animate-spin text-xs">⌛</span> Thinking...
                  </span>
                )}
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestion Chips */}
        <div className="px-4 py-2 border-t border-slate-100 bg-slate-50/50 flex gap-2 overflow-x-auto no-scrollbar">
          {STRINGS.chat.suggestions.map((s, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(s)}
              className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-white hover:bg-teal-50 border border-slate-200 hover:border-teal-300 rounded-full flex-shrink-0 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-4 border-t border-slate-200 bg-white">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage(input);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              data-testid="chat-input"
              value={input}
              maxLength={600}
              onChange={(e) => setInput(e.target.value)}
              placeholder={STRINGS.chat.placeholder}
              className="flex-1 px-4 py-2.5 text-xs sm:text-sm bg-slate-50 border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-500 focus:bg-white text-slate-800"
            />

            <button
              type="button"
              onClick={handleVoiceInput}
              title="Voice Input (Hindi / English)"
              className={`p-2.5 rounded-xl border transition-colors ${
                isListening
                  ? 'bg-rose-500 text-white border-rose-500 animate-pulse'
                  : 'bg-slate-100 text-slate-600 border-slate-200 hover:bg-slate-200'
              }`}
            >
              <MicIcon className="w-4 h-4" />
            </button>

            <button
              type="submit"
              data-testid="chat-send"
              disabled={isStreaming || !input.trim()}
              className="px-4 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white text-xs font-bold rounded-xl transition-all shadow-xs flex items-center gap-1"
            >
              <SendIcon className="w-4 h-4" />
              <span className="hidden sm:inline">{STRINGS.chat.send}</span>
            </button>
          </form>

          <p className="text-[10px] text-slate-400 text-center mt-2">
            {STRINGS.app.disclaimerShort}
          </p>
        </div>
      </div>
    </div>
  );
};
