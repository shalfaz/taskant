'use client';

import { useEffect, useRef, useState } from 'react';
import { Headset, Send, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
}

const QUICK_STARTERS = [
  'How do I post a task?',
  'How does bidding work?',
  'How do payments work?',
];

const WELCOME_MESSAGE: ChatMessage = {
  id: 'welcome',
  role: 'model',
  text: 'Hi! Welcome to TaskAnt Live Support. Ask me anything about posting tasks, bidding, rides, store items, verification, or payments in ৳ — in English, বাংলা, or Banglish.',
};

interface SupportChatWidgetProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function SupportChatWidget({ open, onOpenChange }: SupportChatWidgetProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isOpen = open ?? internalOpen;
  const setIsOpen = (next: boolean) => {
    if (onOpenChange) onOpenChange(next);
    else setInternalOpen(next);
  };

  const [messages, setMessages] = useState<ChatMessage[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const nextIdRef = useRef(1);
  const endRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' });
      inputRef.current?.focus();
    }
  }, [isOpen, messages, sending]);

  const sendMessage = async (rawText: string) => {
    const text = rawText.trim();
    if (!text || sending) return;

    const userMsg: ChatMessage = {
      id: `user-${nextIdRef.current++}`,
      role: 'user',
      text,
    };
    const historyPayload = messages
      .filter((m) => m.id !== 'welcome' && !m.id.startsWith('error-'))
      .map((m) => ({ role: m.role, text: m.text }));

    setMessages((prev) => [...prev, userMsg]);
    setInput('');
    setSending(true);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 30000);

    try {
      const res = await fetch('/api/ai/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: text, history: historyPayload }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { reply?: string; error?: string; message?: string };
      const replyText =
        data.reply?.trim() ||
        data.error ||
        data.message ||
        'Sorry, I could not process that right now. Please try again.';
      setMessages((prev) => [
        ...prev,
        { id: `model-${nextIdRef.current++}`, role: 'model', text: replyText },
      ]);
    } catch (error: unknown) {
      const isTimeout = error instanceof DOMException && error.name === 'AbortError';
      setMessages((prev) => [
        ...prev,
        {
          id: `error-${nextIdRef.current++}`,
          role: 'model',
          text: isTimeout
            ? 'TaskAnt Live Support took too long to respond. Please try sending your message again.'
            : 'Unable to reach TaskAnt Live Support right now. Please check your connection and try again.',
        },
      ]);
    } finally {
      window.clearTimeout(timeoutId);
      setSending(false);
    }
  };

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    void sendMessage(input);
  };

  return (
    <>
      {isOpen && (
        <section
          aria-label="TaskAnt Live Support"
          className="fixed bottom-20 right-5 z-50 flex h-[460px] w-[340px] max-w-[calc(100vw-2.5rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:w-[375px]"
        >
          <header className="flex items-center justify-between border-b border-slate-100 bg-white px-4 py-3">
            <div className="flex items-center gap-2.5">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-600">
                <Headset className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-sm font-bold leading-tight text-slate-900">
                  TaskAnt Live Support
                </h2>
                <p className="mt-0.5 flex items-center gap-1.5 text-[11px] font-medium text-slate-500">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  AI Assistant • Online
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              aria-label="Close live support"
              className="flex h-8 w-8 items-center justify-center rounded-lg text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
            >
              <X className="h-4 w-4" />
            </button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto bg-slate-50/50 px-3.5 py-3">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[84%] whitespace-pre-wrap px-3.5 py-2.5 text-[13px] leading-relaxed ${
                    msg.role === 'user'
                      ? 'rounded-2xl rounded-br-sm bg-orange-600 text-white'
                      : 'rounded-2xl rounded-bl-sm bg-slate-100 text-slate-800'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {messages.length === 1 && !sending && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {QUICK_STARTERS.map((starter) => (
                  <button
                    key={starter}
                    type="button"
                    onClick={() => void sendMessage(starter)}
                    className="rounded-full border border-orange-200 bg-white px-3 py-1.5 text-xs font-medium text-orange-700 transition-colors hover:bg-orange-50"
                  >
                    {starter}
                  </button>
                ))}
              </div>
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-slate-100 px-4 py-3">
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.2s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400 [animation-delay:-0.1s]" />
                  <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-slate-400" />
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form
            onSubmit={handleSubmit}
            className="flex items-center gap-2 border-t border-slate-100 bg-white px-3 py-2.5"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Ask TaskAnt Support..."
              disabled={sending}
              className="h-9 min-w-0 flex-1 rounded-xl border border-slate-200 px-3 text-sm text-slate-800 outline-none transition-colors focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send message"
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-white transition-colors hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
            </button>
          </form>
        </section>
      )}

      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label={isOpen ? 'Close TaskAnt Live Support' : 'Open TaskAnt Live Support'}
        title="TaskAnt Live Support"
        className="fixed bottom-5 right-5 z-50 flex h-13 w-13 cursor-pointer items-center justify-center rounded-full bg-orange-600 text-white shadow-lg transition-transform hover:scale-105 hover:bg-orange-700"
      >
        {isOpen ? <X className="h-6 w-6" /> : <Headset className="h-6 w-6" />}
      </button>
    </>
  );
}
