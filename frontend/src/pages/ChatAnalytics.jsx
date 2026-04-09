import React, { useState, useRef, useEffect, useCallback } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/ChatAnalytics.css';
import {
    BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
    XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#6366f1', '#a78bfa', '#38bdf8', '#34d399', '#fbbf24', '#f472b6', '#f87171'];

// ── Chat Bubble ────────────────────────────────────────────────────────────────
const ChatBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    const isAccessDenied = !isUser && msg.data?.access_denied;
    const text = isUser
        ? msg.text
        : (msg.data?.summary || msg.text || 'Analysis complete.');
    const timestamp = msg.timestamp || '';

    return (
        <div className={`message-wrapper ${isUser ? 'user' : 'bot'}`}>
            <div className={`chat-bubble ${isUser ? 'user' : 'bot'}${isAccessDenied ? ' denied' : ''}`}>
                {isAccessDenied && <span className="denied-icon">🚫</span>}
                {text}
            </div>
            {timestamp && <div className="bubble-ts">{timestamp}</div>}
        </div>
    );
};

// ── Single Chart Component ─────────────────────────────────────────────────────
const ChartBlock = ({ chart }) => {
    const { type, title, x, y, labels, values, color } = chart;
    const barLineData = (x || []).map((v, i) => ({ name: v, val: (y || [])[i] }));
    const pieData = (labels || []).map((l, i) => ({ name: l, value: (values || [])[i] }));

    return (
        <div className="card chart-card">
            <h3>📈 {title || 'Chart'}</h3>
            <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer>
                    {type === 'pie' ? (
                        <PieChart>
                            <Pie data={pieData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85}
                                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}>
                                {pieData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                            <Legend />
                        </PieChart>
                    ) : type === 'line' ? (
                        <LineChart data={barLineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                            <YAxis stroke="#9ca3af" fontSize={11} />
                            <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                            <Legend />
                            <Line type="monotone" dataKey="val" stroke={color || COLORS[0]} strokeWidth={2} dot={{ r: 3 }} name="Value" />
                        </LineChart>
                    ) : (
                        <BarChart data={barLineData} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                            <XAxis dataKey="name" stroke="#9ca3af" fontSize={11} />
                            <YAxis stroke="#9ca3af" fontSize={11} />
                            <Tooltip contentStyle={{ background: 'var(--bg-panel)', border: '1px solid var(--border-color)', borderRadius: 8 }} />
                            <Legend />
                            <Bar dataKey="val" fill={color || COLORS[0]} radius={[4, 4, 0, 0]} name="Value" />
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// ── Main Page ─────────────────────────────────────────────────────────────────
const ChatAnalytics = () => {
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    const [analyticsPayload, setAnalyticsPayload] = useState(null);
    const [showRecent, setShowRecent] = useState(true);
    // Canvas width in px (right panel); chat takes remaining space
    const [canvasWidth, setCanvasWidth] = useState(420);

    const bottomRef = useRef(null);
    const containerRef = useRef(null);
    const isDragging = useRef(false);

    // ── Drag-to-resize (canvas width, fixed px) ──────────────────────────────
    const onResizerMouseDown = useCallback((e) => {
        e.preventDefault();
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';

        const onMove = (ev) => {
            if (!isDragging.current || !containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();
            // canvas starts from right; distance from mouse to right edge
            const newCanvas = rect.right - ev.clientX;
            if (newCanvas >= 280 && newCanvas <= rect.width * 0.65) {
                setCanvasWidth(Math.round(newCanvas));
            }
        };
        const onUp = () => {
            isDragging.current = false;
            document.body.style.cursor = '';
            document.body.style.userSelect = '';
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseup', onUp);
        };
        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseup', onUp);
    }, []);

    // cleanup on unmount
    useEffect(() => () => { document.body.style.cursor = ''; document.body.style.userSelect = ''; }, []);

    // ── Auto-scroll ───────────────────────────────────────────────────────────
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // ── Sessions ─────────────────────────────────────────────────────────────
    const fetchSessions = useCallback(async () => {
        try {
            const res = await API.get('chat/sessions/');
            setSessions(res.data || []);
        } catch { }
    }, []);

    useEffect(() => { fetchSessions(); }, [fetchSessions]);

    const loadSession = async (id) => {
        setActiveSessionId(id);
        setLoading(true);
        setAnalyticsPayload(null);
        try {
            const res = await API.get(`chat/session/${id}/`);
            const history = res.data || [];
            const mapped = [];
            let lastPayload = null;
            history.forEach(item => {
                if (item.role === 'user') mapped.push({ role: 'user', text: item.content.text });
                else if (item.role === 'bot') { mapped.push({ role: 'bot', data: item.content }); lastPayload = item.content; }
            });
            setMessages(mapped);
            if (lastPayload) setAnalyticsPayload(lastPayload);
        } catch { toast.error('Failed to load session'); }
        finally { setLoading(false); }
    };

    const startNewChat = async () => {
        setLoading(true);
        try {
            const res = await API.post('chat/session/create/');
            const newId = res.data.session_id;
            setActiveSessionId(newId);
            setMessages([]);
            setAnalyticsPayload(null);
            fetchSessions();
            return newId;
        } catch { toast.error('Could not create session'); return null; }
        finally { setLoading(false); }
    };

    // ── Send Message ─────────────────────────────────────────────────────────
    const sendMessage = async (text) => {
        if (!text.trim() || loading) return;

        let sessionId = activeSessionId;
        if (!sessionId) {
            sessionId = await startNewChat();
            if (!sessionId) return;
        }

        const ts = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { role: 'user', text, timestamp: ts }]);
        setInput('');
        setLoading(true);
        setIsTyping(true);

        const loadingId = Date.now();
        setMessages(prev => [...prev, { role: 'bot', text: 'Analyzing...', id: loadingId }]);

        try {
            const res = await API.post('chat/query/', { message: text, session_id: sessionId });
            setMessages(prev => prev.filter(m => m.id !== loadingId));
            const botData = res.data;
            const botTs = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            setMessages(prev => [...prev, { role: 'bot', data: botData, timestamp: botTs }]);
            if (!botData.access_denied) setAnalyticsPayload(botData);
            fetchSessions();
        } catch {
            setMessages(prev => prev.filter(m => m.id !== loadingId));
            const errData = { summary: 'System error. Could not process your query.', table: [], charts: [] };
            setMessages(prev => [...prev, { role: 'bot', data: errData }]);
            toast.error('Query failed');
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const handleSubmit = (e) => { e?.preventDefault(); sendMessage(input); };

    const suggestions = [
        { label: '📈 Revenue trend',   query: 'show revenue by period' },
        { label: '🛒 Order status',    query: 'show order status distribution' },
        { label: '👥 Customer value',  query: 'top customer lifetime value' },
        { label: '💰 Profit margins',  query: 'profit margin by business unit' },
        { label: '📦 Product catalog', query: 'show product catalog' },
        { label: '💸 Cost analysis',   query: 'cost analysis by category' },
        { label: '🔮 Forecasting',     query: 'show revenue forecast' },
        { label: '📊 Business trends', query: 'show business trends' },
    ];

    // ── Render ────────────────────────────────────────────────────────────────
    return (
        <div className="ca-root" ref={containerRef}>

            {/* ── LEFT: Session history ───────────────────────────────────── */}
            <div className={`ca-sidebar ${showRecent ? 'open' : 'closed'}`}>
                <div className="ca-sidebar-inner">
                    <div className="ca-sidebar-header">
                        <button className="new-chat-btn" onClick={startNewChat}>
                            <span>＋</span> New Chat
                        </button>
                    </div>
                    <div className="ca-session-list">
                        {sessions.length === 0 && (
                            <p className="ca-empty-sessions">No history yet.</p>
                        )}
                        {sessions.map(s => (
                            <div
                                key={s.id}
                                className={`ca-session-item ${activeSessionId === s.id ? 'active' : ''}`}
                                onClick={() => loadSession(s.id)}
                            >
                                <div className="ca-session-title">{s.title}</div>
                                <div className="ca-session-date">
                                    {new Date(s.created_at).toLocaleDateString()}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── TOGGLE ──────────────────────────────────────────────────── */}
            <button className="ca-toggle" onClick={() => setShowRecent(v => !v)} title={showRecent ? 'Hide history' : 'Show history'}>
                {showRecent ? '◀' : '▶'}
            </button>

            {/* ── CENTER: Chat ─────────────────────────────────────────────── */}
            <div className="ca-chat">
                <div className="ca-messages">
                    {messages.length === 0 ? (
                        <div className="ca-empty-chat">
                            <div className="ca-empty-icon">🤖</div>
                            <h3>Enterprise AI Assistant</h3>
                            <p>Ask a business question or click a suggestion below.</p>
                        </div>
                    ) : (
                        messages.map((msg, i) => <ChatBubble key={i} msg={msg} />)
                    )}

                    {isTyping && (
                        <div className="message-wrapper bot">
                            <div className="chat-bubble bot typing">
                                <span className="dot" /><span className="dot" /><span className="dot" />
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>

                <div className="ca-input-area">
                    <div className="ca-chips">
                        {suggestions.map((s, i) => (
                            <button key={i} className="ca-chip" onClick={() => sendMessage(s.query)} disabled={loading}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <form className="ca-form" onSubmit={handleSubmit}>
                        <input
                            className="ca-input"
                            placeholder="Ask a business question..."
                            value={input}
                            onChange={e => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="ca-send" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            </div>

            {/* ── RESIZER ──────────────────────────────────────────────────── */}
            <div className="ca-resizer" onMouseDown={onResizerMouseDown} />

            {/* ── RIGHT: Analytics Canvas ──────────────────────────────────── */}
            <div className="ca-canvas" style={{ width: canvasWidth, flexShrink: 0 }}>
                {analyticsPayload ? (
                    <div className="ca-canvas-content">
                        <div className="ca-canvas-header">
                            <h2>Intelligence Canvas</h2>
                        </div>

                        <div className="card">
                            <h3>🤖 Executive Summary</h3>
                            <div className="analytics-summary">{analyticsPayload.summary}</div>
                        </div>

                        {(analyticsPayload.charts || []).map((chart, i) => (
                            <ChartBlock key={i} chart={chart} />
                        ))}

                        {analyticsPayload.table && analyticsPayload.table.length > 0 && (
                            <div className="card">
                                <h3>📋 Data Records ({analyticsPayload.table.length})</h3>
                                <div style={{ overflowX: 'auto', maxHeight: 420 }}>
                                    <table className="chat-table">
                                        <thead>
                                            <tr>
                                                {Object.keys(analyticsPayload.table[0]).map(k => (
                                                    <th key={k}>{k}</th>
                                                ))}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsPayload.table.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((v, j) => (
                                                        <td key={j}>{v !== null && v !== undefined ? String(v) : '—'}</td>
                                                    ))}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="ca-canvas-empty">
                        <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📊</div>
                        <h2>Analytics Canvas</h2>
                        <p>Charts, summaries, and data tables will appear here after you ask a question.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default ChatAnalytics;
