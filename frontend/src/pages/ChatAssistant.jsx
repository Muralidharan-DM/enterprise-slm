import React, { useState, useRef, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/ChatAnalytics.css';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';

const COLORS = ['#a78bfa', '#f472b6', '#38bdf8', '#fbbf24', '#34d399', '#f87171'];

const ChatBubble = ({ msg }) => {
    const isUser = msg.role === 'user';
    const timestamp = msg.timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    return (
        <div className={`message-wrapper ${isUser ? 'user' : 'bot'} `} style={{ display: 'flex', width: '100%', flexDirection: 'column', alignItems: isUser ? 'flex-end' : 'flex-start' }}>
            <div className={`chat-bubble ${isUser ? 'user' : 'bot'}`}>
                {isUser ? msg.text : "Analysis complete. Results displayed in the canvas."}
            </div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginTop: '4px', marginHorizontal: '8px' }}>
                {timestamp}
            </div>
        </div>
    );
};

const ChatAnalytics = () => {
    // Session State
    const [sessions, setSessions] = useState([]);
    const [activeSessionId, setActiveSessionId] = useState(null);
    
    // UI State
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [isTyping, setIsTyping] = useState(false);
    
    // Analytics Payload State (latest bot data to drive canvas)
    const [analyticsPayload, setAnalyticsPayload] = useState(null);
    const [showRecent, setShowRecent] = useState(true);
    const [chatWidth, setChatWidth] = useState(40); // Percentage for chat window vs analytics
    
    const bottomRef = useRef(null);
    const chartRef = useRef(null);
    const dashboardRef = useRef(null);
    const isDragging = useRef(false);

    // DB Connection State
    const [dbConfig, setDbConfig] = useState(null);

    useEffect(() => {
        const savedConfig = localStorage.getItem('db_config');
        if (savedConfig) {
            setDbConfig(JSON.parse(savedConfig));
        }
    }, []);

    const startDragging = (e) => {
        isDragging.current = true;
        document.body.style.cursor = 'col-resize';
        document.addEventListener('mousemove', handleDragging);
        document.addEventListener('mouseup', stopDragging);
    };

    const handleDragging = (e) => {
        if (!isDragging.current || !dashboardRef.current) return;
        
        const rect = dashboardRef.current.getBoundingClientRect();
        const offsetX = e.clientX - rect.left;
        
        // Calculate percentage relative to the dashboard container, not the window
        let newWidth = (offsetX / rect.width) * 100;
        
        // Account for recent-chats width if visible
        if (showRecent) {
            const recentPanelWidth = (260 / rect.width) * 100;
            const toggleWidth = (24 / rect.width) * 100;
            // The remaining percentage divided between chat and analytics
            // (offsetX - 260 - 24) / (rect.width - 260 - 24)
            // But let's keep it simple: newWidth should be between the right of toggle and the end
        }

        if (newWidth > 15 && newWidth < 85) {
            setChatWidth(newWidth);
        }
    };

    const stopDragging = () => {
        isDragging.current = false;
        document.body.style.cursor = 'default';
        document.removeEventListener('mousemove', handleDragging);
        document.removeEventListener('mouseup', stopDragging);
    };

    const scrollToBottom = () => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, loading]);

    // Fetch left panel sessions on mount
    useEffect(() => {
        fetchSessions();
    }, []);

    const fetchSessions = async () => {
        try {
            const res = await API.get("chat/sessions/");
            setSessions(res.data || []);
        } catch (err) {
            console.error("Failed to load sessions", err);
            toast.error("Failed to sync chat history");
        }
    };

    const loadSession = async (id) => {
        setActiveSessionId(id);
        setLoading(true);
        setAnalyticsPayload(null);
        try {
            const res = await API.get(`chat/session/${id}/`);
            const history = res.data || [];
            
            // Rebuild message state
            const mappedMessages = [];
            let lastPayload = null;
            
            history.forEach(item => {
                if(item.role === 'user') {
                    mappedMessages.push({ role: 'user', text: item.content.text });
                } else if(item.role === 'bot') {
                    mappedMessages.push({ role: 'bot', data: item.content });
                    lastPayload = item.content;
                }
            });
            
            setMessages(mappedMessages);
            if(lastPayload) setAnalyticsPayload(lastPayload);
        } catch(err) {
            console.error("Failed to load session history", err);
            toast.error("Failed to load conversation history");
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = async () => {
        setLoading(true);
        try {
            const res = await API.post("chat/session/create/");
            const newId = res.data.session_id;
            setActiveSessionId(newId);
            setMessages([]);
            setAnalyticsPayload(null);
            fetchSessions(); // Refresh left panel
            toast.success("New Session Initialized");
        } catch (err) {
            console.error("Failed to create new session", err);
            toast.error("Network Error: Could not create session");
        } finally {
            setLoading(false);
        }
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim() && !loading) return;
        
        // If no session started yet, auto-create
        if (!activeSessionId) {
            toast.error("Initializing session... please wait");
            await startNewChat();
            return;
        }

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setLoading(true);
        setIsTyping(true);

        const loadingId = Date.now();
        setMessages(prev => [...prev, { role: "bot", text: "Analyzing your data...", id: loadingId }]);

        try {
            const res = await API.post("chat/query/", {
                message: userMsg,
                session_id: activeSessionId,
                db_config: dbConfig // Pass dynamic connection info
            });
            
            // Remove loading message
            setMessages(prev => prev.filter(m => m.id !== loadingId));

            const botData = res.data; // Response is now flattened
            setMessages(prev => [...prev, { role: "bot", data: botData }]);
            setAnalyticsPayload(botData);

            // Auto-refresh sessions if this was the first message (title updated by backend)
            if (messages.length === 0) {
                fetchSessions();
            }

        } catch (err) {
            console.error("Chat error", err);
            setMessages(prev => prev.filter(m => m.id !== loadingId));
            toast.error("Analysis Engine Timeout");
            const errData = { summary: "System Error. Could not process query.", table: [], chart: [] };
            setMessages(prev => [...prev, { role: "bot", data: errData, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
            setAnalyticsPayload(errData);
        } finally {
            setLoading(false);
            setIsTyping(false);
        }
    };

    const downloadChart = () => {
        if (!chartRef.current) return;
        const svg = chartRef.current.querySelector("svg");
        if (!svg) return;

        const serializer = new XMLSerializer();
        const source = serializer.serializeToString(svg);
        const blob = new Blob([source], { type: "image/svg+xml;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = "chart.svg";
        link.click();
        toast.success("Intelligence Chart Exported");
    };

    const suggestions = [
        { label: "📦 Stock per warehouse", query: "inventory stock per warehouse" },
        { label: "💰 High Credit Customers", query: "customers with credit limit > 50000" },
        { label: "📈 Top Products", query: "top selling products" }
    ];

    const ChartComponent = ({ chart }) => {
        const { type, title, x, y, labels, values, color } = chart;
        
        // Transform data for Recharts
        const chartData = type === 'pie' 
            ? labels.map((l, i) => ({ name: l, value: values[i] }))
            : x.map((v, i) => ({ name: v, val: y[i] }));

        return (
            <div className="card chart-card">
                <h3>{title || "Analytics Visualization"}</h3>
                <div style={{ width: '100%', height: 300, marginTop: '1rem' }}>
                    <ResponsiveContainer>
                        {type === 'bar' ? (
                            <BarChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                <Bar dataKey="val" fill={color || COLORS[0]} radius={[4, 4, 0, 0]} />
                            </BarChart>
                        ) : type === 'line' ? (
                            <LineChart data={chartData}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                                <XAxis dataKey="name" stroke="#9ca3af" fontSize={12} />
                                <YAxis stroke="#9ca3af" fontSize={12} />
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                                <Line type="monotone" dataKey="val" stroke={color || COLORS[2]} strokeWidth={3} dot={{ r: 4 }} />
                            </LineChart>
                        ) : (
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    dataKey="value"
                                    nameKey="name"
                                    cx="50%"
                                    cy="50%"
                                    outerRadius={80}
                                    label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                    ))}
                                </Pie>
                                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: 'none', borderRadius: '8px' }} />
                            </PieChart>
                        )}
                    </ResponsiveContainer>
                </div>
            </div>
        );
    };

    return (
        <div className="dashboard" ref={dashboardRef}>
            
            {/* PANEL 1: RECENT CHATS (Toggleable) */}
            <div className="recent-chats" style={{ width: showRecent ? '260px' : '0', overflow: 'hidden' }}>
                <div className="recent-chats-inner" style={{ width: '260px' }}>
                    <div className="recent-chats-header">
                        <button className="new-chat-btn" onClick={startNewChat}>
                            ➕ New Chat
                        </button>
                    </div>
                    <div className="session-list">
                        {sessions.map(s => (
                            <div 
                                key={s.id} 
                                className={`session-item ${activeSessionId === s.id ? 'active' : ''}`}
                                onClick={() => loadSession(s.id)}
                            >
                                <div className="session-title">{s.title}</div>
                                <div className="session-date">{new Date(s.created_at).toLocaleDateString()}</div>
                            </div>
                        ))}
                        {sessions.length === 0 && <p className="text-secondary small p-4">No history found.</p>}
                    </div>
                </div>
            </div>

            {/* TOGGLE BUTTON */}
            <div className="toggle-wrapper">
                <button 
                    className="recent-toggle-btn"
                    onClick={() => setShowRecent(!showRecent)}
                >
                    {showRecent ? "◀" : "▶"}
                </button>
            </div>

            {/* PANEL 2: CHAT WINDOW */}
            <div className="chat-window" style={{ flex: `0 0 ${chatWidth}%`, minWidth: '300px' }}>
                <div className="chat-messages">
                    {messages.length === 0 ? (
                        <div style={{ margin: 'auto', textAlign: 'center', color: 'var(--text-secondary)' }}>
                            <span style={{ fontSize: '3rem' }}>🤖</span>
                            <h3>Enterprise AI Assistant</h3>
                            <p>Ask a business question in the box below.</p>
                        </div>
                    ) : (
                        messages.map((msg, idx) => <ChatBubble key={idx} msg={msg} />)
                    )}

                    {isTyping && (
                        <div className="message-wrapper bot" style={{ display: 'flex', width: '100%', justifyContent: 'flex-start' }}>
                            <div className="chat-bubble bot typing">
                                <span className="dot"></span>
                                <span className="dot"></span>
                                <span className="dot"></span>
                            </div>
                        </div>
                    )}
                    <div ref={bottomRef} />
                </div>
                
                <div className="chat-input-container">
                    <div className="chat-suggestions">
                        <div 
                            className="suggestion-chip recommendation"
                            onClick={() => { setInput(""); handleSend(); }}
                            style={{ background: 'rgba(99, 102, 241, 0.2)', borderColor: 'var(--accent-primary)', fontWeight: 600 }}
                        >
                            🔍 Recommend Datasets
                        </div>
                        {suggestions.map((s, i) => (
                            <div 
                                key={i} 
                                className="suggestion-chip"
                                onClick={() => setInput(s.query)}
                            >
                                {s.label}
                            </div>
                        ))}
                    </div>
                    
                    <form className="chat-input-form" onSubmit={handleSend}>
                        <input 
                            type="text" 
                            className="chat-input"
                            placeholder="Type your business query here..." 
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={loading}
                        />
                        <button type="submit" className="send-btn" disabled={loading || !input.trim()}>
                            ➤
                        </button>
                    </form>
                </div>
            </div>

            {/* DRAGGABLE RESIZER */}
            <div className="resizer" onMouseDown={startDragging} />

            {/* PANEL 3: ANALYTICS CANVAS */}
            <div className="analytics-canvas" style={{ flex: 1, minWidth: 0 }}>
                {/* Connection Status Banner */}
                <div className="connection-banner">
                    <div className="conn-info">
                        {dbConfig ? (
                            <>
                                <span className="conn-dot success"></span>
                                <span className="conn-text">Connected: <strong>{dbConfig.type.toUpperCase()}</strong> ({dbConfig.host})</span>
                            </>
                        ) : (
                            <>
                                <span className="conn-dot error"></span>
                                <span className="conn-text">No Database Connected. <a href="/chat">Connect now</a></span>
                            </>
                        )}
                    </div>
                </div>

                {analyticsPayload ? (
                    <div className="canvas-content" style={{ padding: '0 1rem 2rem' }}>
                        <div className="canvas-header">
                            <h2>Intelligence Canvas</h2>
                            <button className="download-btn" onClick={downloadChart}>
                                📥 Export Workspace
                            </button>
                        </div>

                        <div className="card">
                            <h3>🤖 Executive Summary</h3>
                            <div className="analytics-summary">{analyticsPayload.summary}</div>
                        </div>

                        {/* RENDER MULTIPLE CHARTS */}
                        {analyticsPayload.charts && analyticsPayload.charts.map((chart, i) => (
                            <ChartComponent key={i} chart={chart} />
                        ))}

                        {analyticsPayload.table && analyticsPayload.table.length > 0 && (
                            <div className="card">
                                <h3>📋 Data Discovery ({analyticsPayload.table.length} rows)</h3>
                                <div style={{ overflowX: 'auto', maxHeight: '500px' }}>
                                    <table className="chat-table">
                                        <thead>
                                            <tr>
                                                {Object.keys(analyticsPayload.table[0]).map(key => <th key={key}>{key}</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {analyticsPayload.table.map((row, i) => (
                                                <tr key={i}>
                                                    {Object.values(row).map((val, j) => <td key={j}>{val !== null ? val : 'NULL'}</td>)}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="empty-canvas">
                        <h2>Analytics Dashboard</h2>
                        <p>Awaiting query execution... data structures, visualizations, and dynamic tables will render here natively.</p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default ChatAnalytics;
