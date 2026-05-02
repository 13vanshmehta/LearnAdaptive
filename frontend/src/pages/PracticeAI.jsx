import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Bot, User, Lock, Sparkles, MessageSquareDiff, Trash2, History, X } from 'lucide-react';
import { useSearchParams, useLocation } from 'react-router-dom';
import { apiService } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import ReactMarkdown from 'react-markdown';
import Typewriter from '../components/Typewriter';


/* ── helpers ───────────────────────────────────────────────────── */
const makeSessionId = () => `sess_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

/** Derive a stable key for localStorage so we can resume the same session */
const storageKey = (pathname, topic) =>
  pathname === '/practice' && topic ? `chat_session_${topic}` : `chat_session_general`;

/* ─────────────────────────────────────────────────────────────── */

/* ── helpers ───────────────────────────────────────────────────── */

const PracticeAI = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { user } = useAuth();

  const isLockedMode = location.pathname === '/practice' && searchParams.get('locked') === 'true';
  const rawTopic = searchParams.get('topic') || '';
  const topicLabel = rawTopic.replace(/_/g, ' ').toUpperCase();
  const level = parseInt(searchParams.get('level') || '1', 10);

  /* ── session id: persist per topic so we resume the same thread ── */
  const [sessionId, setSessionId] = useState(() => {
    const key = storageKey(location.pathname, rawTopic);
    return localStorage.getItem(key) || makeSessionId();
  });

  const accentColor = isLockedMode ? '#818cf8' : '#60a5fa';
  const accentGlow = isLockedMode ? 'rgba(129,140,248,0.3)' : 'rgba(96,165,250,0.3)';
  const headerBg = isLockedMode
    ? 'linear-gradient(135deg, #1e1b4b 0%, #312e81 100%)'
    : 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)';
  const botGradient = isLockedMode
    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
    : 'linear-gradient(135deg, #10b981, #059669)';
  const botGlow = isLockedMode
    ? '0 4px 12px rgba(99,102,241,0.35)'
    : '0 4px 12px rgba(16,185,129,0.35)';
  const sendBg = isLockedMode
    ? 'linear-gradient(135deg, #6366f1, #4f46e5)'
    : 'linear-gradient(135deg, #3b82f6, #1d4ed8)';

  const welcomeMessage = useCallback(() => {
    if (isLockedMode && rawTopic) {
      return {
        role: 'assistant',
        content: `👋 Hello! I'm your dedicated AI tutor for **${topicLabel}**.\n\nI'll strictly help you with questions, concepts, and problems related to **${topicLabel}** only. Let's dive deep — ask me anything about this topic!`,
      };
    }
    return {
      role: 'assistant',
      content: `👋 Hi there! I'm your **Ask AI** assistant — your general-purpose learning companion.\n\nYou can ask me anything across all topics — concepts, doubts, problems, or just curious questions. How can I help you today?`,
    };
  }, [isLockedMode, rawTopic, topicLabel]);

  const [messages, setMessages] = useState([welcomeMessage()]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionsList, setSessionsList] = useState([]);

  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  /* ── Persist session id ──────────────────────────────────────── */
  useEffect(() => {
    const key = storageKey(location.pathname, rawTopic);
    localStorage.setItem(key, sessionId);
  }, [sessionId, location.pathname, rawTopic]);

  /* ── On route/topic change: reset + load new session ────────── */
  useEffect(() => {
    const key = storageKey(location.pathname, rawTopic);
    const storedId = localStorage.getItem(key) || makeSessionId();
    setSessionId(storedId);
    setMessages([welcomeMessage()]);
    setInput('');
    setHistoryLoading(true);

    apiService.getChatSession(storedId)
      .then((res) => {
        const loaded = res.data.messages || [];
        if (loaded.length > 0) {
          setMessages([welcomeMessage(), ...loaded.map((m) => ({ role: m.role, content: m.content }))]);
        }
      })
      .catch(() => { /* no previous session — start fresh */ })
      .finally(() => setHistoryLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname, rawTopic]);

  /* ── Scroll to bottom on new messages ───────────────────────── */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  /* ── Fetch session list for the history panel ────────────────── */
  const loadSessionsList = async () => {
    try {
      const res = await apiService.getChatHistoryList();
      setSessionsList(res.data.sessions || []);
    } catch { /* silent */ }
  };

  const handleOpenHistory = () => {
    setShowHistory(true);
    loadSessionsList();
  };

  /* ── Load a past session ─────────────────────────────────────── */
  const handleLoadSession = async (sid) => {
    try {
      const res = await apiService.getChatSession(sid);
      const msgs = res.data.messages || [];
      setMessages([welcomeMessage(), ...msgs.map((m) => ({ role: m.role, content: m.content }))]);
      setSessionId(sid);
      // also update localStorage so refresh persists
      const key = storageKey(location.pathname, rawTopic);
      localStorage.setItem(key, sid);
    } catch { /* silent */ }
    setShowHistory(false);
  };

  /* ── Delete a past session ───────────────────────────────────── */
  const handleDeleteSession = async (e, sid) => {
    e.stopPropagation();
    try {
      await apiService.deleteChatSession(sid);
      setSessionsList((prev) => prev.filter((s) => s.session_id !== sid));
      // If deleting the active session, start a brand-new one
      if (sid === sessionId) {
        const newId = makeSessionId();
        setSessionId(newId);
        setMessages([welcomeMessage()]);
        const key = storageKey(location.pathname, rawTopic);
        localStorage.setItem(key, newId);
      }
    } catch { /* silent */ }
  };

  /* ── Clear current chat (start new session) ─────────────────── */
  const handleNewChat = () => {
    const newId = makeSessionId();
    setSessionId(newId);
    setMessages([welcomeMessage()]);
    const key = storageKey(location.pathname, rawTopic);
    localStorage.setItem(key, newId);
  };

  /* ── Send message ────────────────────────────────────────────── */
  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const historyPayload = messages.slice(-8).map((m) => ({ role: m.role, content: m.content }));
      const topicForRequest = isLockedMode ? rawTopic.replace(/_/g, ' ') : 'general';

      const response = await apiService.chat(
        topicForRequest,
        userMessage,
        historyPayload,
        isLockedMode ? level : 1,
        isLockedMode ? 'topic_locked' : 'general',
        sessionId,
      );

      setMessages((prev) => [...prev, { role: 'assistant', content: response.data.response, isNew: true }]);
    } catch (error) {
      console.error(error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: '⚠️ Something went wrong. Please try again.' },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  /* ── Render ──────────────────────────────────────────────────── */
  return (
    <div className="practice-container">

      {/* ── History Popup Modal ──────────────────────────────────── */}
      {showHistory && (
        <>
          {/* Backdrop */}
          <div
            onClick={() => setShowHistory(false)}
            className="history-backdrop"
          />
          {/* Centered Modal */}
          <div className="history-modal">
            {/* Modal Header */}
            <div className="history-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div className="history-icon-badge" style={{
                  background: `${accentColor}18`,
                  border: `1px solid ${accentColor}33`,
                  color: accentColor,
                }}>
                  <History size={16} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontWeight: 700, fontSize: '0.95rem' }}>Chat History</h3>
                  <p style={{ margin: 0, fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                    {sessionsList.length} session{sessionsList.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowHistory(false)}
                className="history-close-btn"
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                <X size={16} />
              </button>
            </div>

            {/* Session List */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.875rem' }}>
              {sessionsList.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '2.5rem 1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '16px',
                    background: `${accentColor}11`,
                    border: `1px solid ${accentColor}22`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: accentColor, margin: '0 auto 0.875rem',
                  }}>
                    <History size={22} />
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', margin: 0 }}>
                    No saved sessions yet.
                  </p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
                    Start chatting and your history will appear here.
                  </p>
                </div>
              ) : (
                sessionsList.map((s) => (
                  <div
                    key={s.session_id}
                    onClick={() => handleLoadSession(s.session_id)}
                    className="session-item"
                    style={{
                      border: s.session_id === sessionId
                        ? `1.5px solid ${accentColor}`
                        : '1px solid var(--border-color)',
                      background: s.session_id === sessionId
                        ? `${accentColor}0d`
                        : 'transparent',
                    }}
                    onMouseEnter={(e) => {
                      if (s.session_id !== sessionId) e.currentTarget.style.background = 'var(--border-color)';
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = s.session_id === sessionId ? `${accentColor}0d` : 'transparent';
                    }}
                  >
                    <div style={{ minWidth: 0, flex: 1 }}>
                      <p style={{
                        margin: 0, fontWeight: 700, fontSize: '0.75rem',
                        color: accentColor, textTransform: 'uppercase',
                        letterSpacing: '0.06em', marginBottom: '0.2rem',
                      }}>
                        {s.topic === 'general' ? '✦ Ask AI' : `📘 ${s.topic.replace(/_/g, ' ')}`}
                      </p>
                      <p style={{
                        margin: 0, fontSize: '0.85rem', fontWeight: 500,
                        color: 'var(--text-main)',
                        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                      }}>
                        {s.preview || 'Empty session'}
                      </p>
                      <p style={{ margin: '0.2rem 0 0', fontSize: '0.7rem', color: 'var(--text-secondary)' }}>
                        {s.updated_at ? new Date(s.updated_at).toLocaleString() : ''}
                      </p>
                    </div>
                    <button
                      onClick={(e) => handleDeleteSession(e, s.session_id)}
                      title="Delete session"
                      style={{
                        flexShrink: 0, width: 30, height: 30,
                        borderRadius: '8px', border: '1px solid transparent',
                        background: 'transparent', cursor: 'pointer',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: '#94a3b8', transition: 'all 0.15s',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = 'rgba(239,68,68,0.1)';
                        e.currentTarget.style.color = '#ef4444';
                        e.currentTarget.style.borderColor = 'rgba(239,68,68,0.25)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                        e.currentTarget.style.color = '#94a3b8';
                        e.currentTarget.style.borderColor = 'transparent';
                      }}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: '1rem 1.25rem',
              borderTop: '1px solid var(--border-color)',
              display: 'flex', gap: '0.5rem',
            }}>
              <button
                onClick={() => { handleNewChat(); setShowHistory(false); }}
                style={{
                  flex: 1, padding: '0.7rem 1rem',
                  borderRadius: '12px', border: 'none',
                  background: sendBg, color: '#fff',
                  fontWeight: 700, fontSize: '0.875rem',
                  cursor: 'pointer', display: 'flex',
                  alignItems: 'center', justifyContent: 'center', gap: '0.5rem',
                  boxShadow: `0 4px 14px ${accentGlow}`,
                  transition: 'opacity 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.88'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                + New Chat
              </button>
              <button
                onClick={() => setShowHistory(false)}
                style={{
                  padding: '0.7rem 1.1rem',
                  borderRadius: '12px',
                  border: '1px solid var(--border-color)',
                  background: 'transparent',
                  color: 'var(--text-secondary)',
                  fontWeight: 600, fontSize: '0.875rem',
                  cursor: 'pointer',
                  transition: 'background 0.15s',
                }}
                onMouseEnter={(e) => e.currentTarget.style.background = 'var(--border-color)'}
                onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
              >
                Close
              </button>
            </div>
          </div>
        </>
      )}

      {/* ── Header ──────────────────────────────────────────────── */}
      <div className="practice-header" style={{
        background: headerBg,
        boxShadow: `0 8px 32px ${accentGlow}`,
        border: `1px solid ${accentColor}22`,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
          <div style={{
            width: 40, height: 40, borderRadius: '12px',
            background: `${accentColor}22`, border: `1px solid ${accentColor}44`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: accentColor,
          }}>
            {isLockedMode ? <Lock size={20} /> : <Sparkles size={20} />}
          </div>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#f1f5f9', margin: 0 }}>
              {isLockedMode ? `${topicLabel} — AI Tutor` : 'Ask AI'}
            </h1>
            <p style={{ fontSize: '0.75rem', color: '#94a3b8', margin: 0, marginTop: '1px' }}>
              {isLockedMode
                ? `🔒 Strictly scoped to ${topicLabel}`
                : '💬 Ask anything — general-purpose assistant'}
            </p>
          </div>
        </div>

        {/* Header Actions */}
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {isLockedMode && (
            <span style={{
              padding: '0.3rem 0.8rem', borderRadius: '999px', fontSize: '0.75rem',
              fontWeight: 700, background: '#f43f5e22', border: '1px solid #f43f5e44',
              color: '#f43f5e', display: 'flex', alignItems: 'center', gap: '0.35rem',
            }}>
              <Lock size={11} /> Topic Locked
            </span>
          )}
          <button
            onClick={handleOpenHistory}
            title="Chat History"
            style={{
              width: 36, height: 36, borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.16)';
              e.currentTarget.style.color = '#fff';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <History size={16} />
          </button>
          <button
            onClick={handleNewChat}
            title="New Chat"
            style={{
              width: 36, height: 36, borderRadius: '10px',
              border: '1px solid rgba(255,255,255,0.15)',
              background: 'rgba(255,255,255,0.08)',
              color: '#cbd5e1',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(239,68,68,0.18)';
              e.currentTarget.style.color = '#fca5a5';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.08)';
              e.currentTarget.style.color = '#cbd5e1';
            }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>

      {/* ── Chat Window ─────────────────────────────────────────── */}
      <div className="card" style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', padding: 0 }}>

        {/* Messages */}
        <div className="chat-messages">

          {historyLoading ? (
            <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.875rem' }}>
              Loading chat history…
            </div>
          ) : (
            messages.map((msg, index) => (
              <div
                key={index}
                className="message-wrapper"
                style={{
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                }}
              >
                {/* Avatar */}
                <div className="message-avatar" style={{
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #3b82f6, #1d4ed8)' : botGradient,
                  boxShadow: msg.role === 'user'
                    ? '0 4px 12px rgba(59,130,246,0.35)' : botGlow,
                }}>
                  {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
                </div>

                {/* Bubble */}
                <div className="message-bubble" style={{
                  borderTopLeftRadius: msg.role === 'assistant' ? 0 : '18px',
                  borderTopRightRadius: msg.role === 'user' ? 0 : '18px',
                  background: msg.role === 'user'
                    ? 'linear-gradient(135deg, #2563eb, #1d4ed8)'
                    : 'var(--bg-card, #f8fafc)',
                  color: msg.role === 'user' ? '#fff' : 'var(--text-main)',
                  boxShadow: msg.role === 'user'
                    ? '0 8px 24px -4px rgba(37,99,235,0.35)'
                    : '0 2px 12px rgba(0,0,0,0.07)',
                }}>
                  {msg.role === 'assistant' ? (
                    <Typewriter
                      text={msg.content}
                      animate={msg.isNew === true}
                      speed={15}
                      className="prose"
                    />
                  ) : msg.content}
                </div>
              </div>
            ))
          )}

          {/* Typing indicator */}
          {loading && (
            <div style={{ display: 'flex', gap: '0.875rem', alignItems: 'flex-start' }}>
              <div style={{
                width: 36, height: 36, borderRadius: '50%',
                background: botGradient, color: '#fff',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: botGlow,
              }}>
                <Bot size={18} />
              </div>
              <div style={{
                padding: '0.9rem 1.2rem', background: 'var(--bg-card, #f8fafc)',
                borderRadius: '18px', borderTopLeftRadius: 0,
                boxShadow: '0 2px 12px rgba(0,0,0,0.07)',
                display: 'flex', gap: '6px', alignItems: 'center',
              }}>
                {[0, 0.2, 0.4].map((delay, i) => (
                  <span key={i} style={{
                    width: 8, height: 8, borderRadius: '50%',
                    background: accentColor,
                    animation: `typingDot 1.2s ${delay}s infinite`,
                    display: 'inline-block',
                  }} />
                ))}
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* ── Input Bar ───────────────────────────────────────── */}
        <div className="chat-input-bar">
          {isLockedMode && (
            <p style={{
              fontSize: '0.7rem', color: accentColor,
              marginBottom: '0.5rem',
              display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600,
            }}>
              <Lock size={10} /> Responses are strictly scoped to {topicLabel}
            </p>
          )}
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '0.6rem' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <MessageSquareDiff size={17} style={{
                position: 'absolute', left: '1rem', top: '50%',
                transform: 'translateY(-50%)',
                color: 'var(--text-secondary)', pointerEvents: 'none',
              }} />
              <input
                ref={inputRef}
                type="text"
                className="input-field"
                placeholder={isLockedMode
                  ? `Ask anything about ${topicLabel}…`
                  : 'Ask anything — any topic, any concept…'}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                disabled={loading || historyLoading}
                style={{ borderRadius: 'var(--radius-full)', paddingLeft: '2.75rem', width: '100%', boxSizing: 'border-box' }}
              />
            </div>
            <button
              type="submit"
              disabled={loading || historyLoading || !input.trim()}
              style={{
                flexShrink: 0,
                width: 44,
                height: 44,
                borderRadius: '50%',
                border: 'none',
                background: (loading || historyLoading || !input.trim()) ? '#94a3b8' : sendBg,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: (loading || historyLoading || !input.trim()) ? 'not-allowed' : 'pointer',
                boxShadow: (loading || historyLoading || !input.trim())
                  ? 'none'
                  : `0 4px 14px ${accentGlow}`,
                transition: 'background 0.2s, box-shadow 0.2s, transform 0.15s',
                outline: 'none',
              }}
              onMouseEnter={(e) => { if (!e.currentTarget.disabled) e.currentTarget.style.transform = 'scale(1.08)'; }}
              onMouseLeave={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
              onMouseDown={(e) => { e.currentTarget.style.transform = 'scale(0.95)'; }}
              onMouseUp={(e) => { e.currentTarget.style.transform = 'scale(1)'; }}
            >
              <Send size={17} />
            </button>
          </form>
        </div>
      </div>

      <style>{`
        /* Typewriter/Prose overrides if needed */
      `}</style>
    </div>
  );
};

export default PracticeAI;
