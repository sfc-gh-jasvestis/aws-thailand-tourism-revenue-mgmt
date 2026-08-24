'use client';

import { useState } from 'react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  sql?: string;
  source?: string;
}

interface AskAIProps {
  title?: string;
  placeholder?: string;
  sampleQuestions: string[];
  onSubmit: (question: string) => Promise<{ answer: string; sql?: string; source?: string }>;
}

export function AskAI({ title = 'Ask AI', placeholder, sampleQuestions, onSubmit }: AskAIProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (question?: string) => {
    const q = question || input;
    if (!q.trim()) return;

    setMessages((prev) => [...prev, { role: 'user', content: q }]);
    setInput('');
    setLoading(true);

    try {
      const result = await onSubmit(q);
      setMessages((prev) => [...prev, { role: 'assistant', content: result.answer, sql: result.sql, source: result.source }]);
    } catch (err) {
      setMessages((prev) => [...prev, { role: 'assistant', content: 'Error: Unable to process your question.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex h-full flex-col rounded-lg border border-slate-200 bg-white shadow-sm">
      <div className="border-b border-slate-200 px-4 py-3">
        <h3 className="text-sm font-semibold text-slate-700">{title}</h3>
        <p className="mt-0.5 text-[11px] text-slate-400">Powered by Cortex Analyst (data queries) + Cortex Search &amp; Complete (strategy advice)</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div>
            <p className="mb-3 text-sm text-slate-500">Try asking:</p>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {sampleQuestions.map((q, i) => (
                <button
                  key={i}
                  className="rounded border border-slate-200 px-3 py-2 text-left text-xs text-slate-700 hover:bg-slate-50 hover:border-blue-300 transition-colors"
                  onClick={() => handleSubmit(q)}
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === 'user' ? 'bg-snowflake-blue text-white' : 'bg-slate-100 text-slate-800'}`}>
              <p className="whitespace-pre-wrap">{msg.content}</p>
              {msg.sql && (
                <pre className="mt-2 rounded bg-slate-800 p-2 text-xs text-green-300 overflow-x-auto">{msg.sql}</pre>
              )}
              {msg.source && (
                <p className="mt-1 text-[10px] text-slate-400 italic">Source: {msg.source}</p>
              )}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="rounded-lg bg-slate-100 px-3 py-2 text-sm text-slate-500">Thinking...</div>
          </div>
        )}
      </div>

      <div className="border-t border-slate-200 p-3">
        <div className="flex gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
            placeholder={placeholder || 'Ask about revenue, demand, pricing, or strategy...'}
            className="flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-snowflake-blue focus:outline-none"
          />
          <button
            onClick={() => handleSubmit()}
            disabled={loading || !input.trim()}
            className="rounded bg-snowflake-blue px-4 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
