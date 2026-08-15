'use client';

import { useState, useRef, useEffect } from 'react';
import { Send, X, Bot, Sparkles, Zap, MessageSquare } from 'lucide-react';

interface Message {
  role: 'user' | 'model';
  content: string;
}

const QUICK_QUESTIONS = [
  'What resources are available?',
  'Which department has the most assets?',
  'How much have we saved?',
  'Find me available laptops',
];

export default function AIChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'model',
      content: 'Hi! I\'m RESCUE AI Assistant. I can answer questions about your organizational resources in real-time. What would you like to know? 🔎',
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [unread, setUnread] = useState(0);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (open) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [messages, open]);

  const sendMessage = async (text?: string) => {
    const msg = text || input.trim();
    if (!msg || loading) return;

    const userMsg: Message = { role: 'user', content: msg };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const resp = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: msg, history }),
      });
      const data = await resp.json();

      const aiMsg: Message = { role: 'model', content: data.reply || 'Sorry, I had trouble answering that.' };
      setMessages(prev => [...prev, aiMsg]);

      if (!open) setUnread(prev => prev + 1);
    } catch (e) {
      setMessages(prev => [...prev, {
        role: 'model',
        content: 'I\'m having trouble connecting. Please try again in a moment.',
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Panel */}
      {open && (
        <div className="chat-widget animate-fade-in-scale">
          {/* Header */}
          <div className="chat-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{
                width: 32, height: 32, borderRadius: '50%',
                background: 'linear-gradient(135deg, var(--ai-purple), var(--rescue-green))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Sparkles size={14} color="white" />
              </div>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-primary)' }}>RESCUE AI Assistant</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: 'var(--rescue-green)' }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--rescue-green)', animation: 'chat-pulse 2s infinite' }} />
                  Live DB · Grounded answers
                </div>
              </div>
            </div>
            <button
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map((msg, i) => (
              <div key={i} className={`chat-msg ${msg.role === 'user' ? 'user' : 'ai'}`}>
                <div className={`chat-avatar ${msg.role === 'user' ? 'user-avatar' : 'ai-avatar'}`}>
                  {msg.role === 'user' ? 'U' : <Bot size={13} />}
                </div>
                <div className={`chat-bubble ${msg.role === 'user' ? 'user' : 'ai'}`}>
                  {msg.content}
                </div>
              </div>
            ))}

            {loading && (
              <div className="chat-msg ai">
                <div className="chat-avatar ai-avatar"><Bot size={13} /></div>
                <div className="chat-typing">
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                  <div className="typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Quick Questions */}
          {messages.length <= 1 && (
            <div style={{ padding: '0 12px 8px', display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {QUICK_QUESTIONS.map(q => (
                <button
                  key={q}
                  onClick={() => sendMessage(q)}
                  style={{
                    background: 'var(--bg-elevated)', border: '1px solid var(--border-subtle)',
                    borderRadius: 20, padding: '5px 12px', fontSize: 11,
                    color: 'var(--text-secondary)', cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.15s',
                  }}
                  onMouseEnter={e => { (e.target as HTMLElement).style.borderColor = 'rgba(124,58,237,0.4)'; (e.target as HTMLElement).style.color = 'var(--text-primary)'; }}
                  onMouseLeave={e => { (e.target as HTMLElement).style.borderColor = 'var(--border-subtle)'; (e.target as HTMLElement).style.color = 'var(--text-secondary)'; }}
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          {/* Input */}
          <div className="chat-input-area">
            <textarea
              ref={inputRef}
              className="chat-input"
              placeholder="Ask about resources, savings, departments..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
            />
            <button
              className="chat-send-btn"
              onClick={() => sendMessage()}
              disabled={!input.trim() || loading}
              style={{ opacity: (!input.trim() || loading) ? 0.5 : 1 }}
            >
              <Send size={14} color="white" />
            </button>
          </div>
        </div>
      )}

      {/* Toggle Button */}
      <button
        className="chat-widget-toggle"
        onClick={() => setOpen(prev => !prev)}
        title="Ask RESCUE AI"
      >
        {open ? (
          <X size={22} color="white" />
        ) : (
          <>
            <MessageSquare size={22} color="white" />
            {unread > 0 && (
              <div style={{
                position: 'absolute', top: -4, right: -4,
                background: 'linear-gradient(135deg, var(--rescue-green), var(--ai-purple))',
                color: '#060610',
                width: 18, height: 18, borderRadius: '50%',
                fontSize: 10, fontWeight: 800,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 0 10px rgba(0,217,165,0.6)',
              }}>
                {unread}
              </div>
            )}
          </>
        )}
      </button>
    </>
  );
}
