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
    
    const bottomRef = useRef(null);
    const chartRef = useRef(null);

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
            setSessions(res.data.sessions || []);
        } catch (err) {
            console.error("Failed to load sessions", err);
            toast.error("Failed to sync chat history");
        }
    };

    const loadSession = async (id) => {
        setActiveSessionId(id);
        setLoading(true);
        // Reset payload until we find the last bot message
        setAnalyticsPayload(null);
        try {
            const res = await API.get(`chat/session/${id}/`);
            const history = res.data.history || [];
            
            // Rebuild message state
            const mappedMessages = [];
            let lastPayload = null;
            
            history.forEach(item => {
                if(item.role === 'user') {
                    mappedMessages.push({ role: 'user', text: item.text });
                } else if(item.role === 'bot') {
                    mappedMessages.push({ role: 'bot', data: item.data });
                    lastPayload = item.data;
                }
            });
            
            setMessages(mappedMessages);
            if(lastPayload) setAnalyticsPayload(lastPayload);
        } catch(err) {
            console.error("Failed to load session history", err);
        } finally {
            setLoading(false);
        }
    };

    const startNewChat = () => {
        setActiveSessionId(null);
        setMessages([]);
        setAnalyticsPayload(null);
    };

    const handleSend = async (e) => {
        e?.preventDefault();
        if (!input.trim()) return;

        const userMsg = input.trim();
        setInput("");
        setMessages(prev => [...prev, { role: "user", text: userMsg, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) }]);
        setLoading(true);
        setIsTyping(true);

        // Step 10.8: Immediate loading message
        const loadingId = Date.now();
        setMessages(prev => [...prev, { role: "bot", text: "Analyzing your data...", id: loadingId }]);

        try {
            const payload = { message: userMsg };
            if (activeSessionId) payload.session_id = activeSessionId;
            
            const res = await API.post("chat/query/", payload);
            
            // Remove loading message
            setMessages(prev => prev.filter(m => m.id !== loadingId));

            // If this is a new session, backend returns the generated session_id
            if (!activeSessionId && res.data.session_id) {
                setActiveSessionId(res.data.session_id);
                fetchSessions(); // Refresh left bar
            }

            const botData = res.data.data; // data payload containing summary, table, chart
            setMessages(prev => [...prev, { role: "bot", data: botData }]);
            setAnalyticsPayload(botData);

        } catch (err) {
            console.error("Chat error", err);
            // Remove loading message
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

    const renderChart = () => {
        if (!analyticsPayload?.chart || analyticsPayload.chart.length === 0) return null;
        
        const chartData = analyticsPayload.chart;
        const keys = Object.keys(chartData[0]);
        const xKey = keys[0];
        const yKeys = keys.slice(1).filter(k => typeof chartData[0][k] === 'number');
        
        if (yKeys.length === 0) return <p>Data structure incompatible with visualization.</p>;

        // STEP 10.12: AUTO CHART SELECTION LOGIC
        let chartType = 'bar';
        
        // Time series detection
        const firstX = String(chartData[0][xKey]).toLowerCase();
        if (firstX.match(/jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec|20\d{2}|date|month|year/)) {
            chartType = 'line';
        }
        // Distribution detection (Pie)
        else if (chartData.length >= 2 && chartData.length <= 6 && yKeys.length === 1) {
            chartType = 'pie';
        }

        return (
            <div ref={chartRef} style={{ width: '100%', height: 350 }}>
                <ResponsiveContainer>
                    {chartType === 'line' ? (
                        <LineChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={xKey} stroke="#9ca3af" tick={{fontSize: 12}} />
                            <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                            <Legend />
                            {yKeys.map((k, i) => (
                                <Line key={k} type="monotone" dataKey={k} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
                            ))}
                        </LineChart>
                    ) : chartType === 'pie' ? (
                        <PieChart>
                            <Pie
                                data={chartData}
                                dataKey={yKeys[0]}
                                nameKey={xKey}
                                cx="50%"
                                cy="50%"
                                outerRadius={120}
                                label={({name, percent}) => `${name} ${(percent * 100).toFixed(0)}%`}
                            >
                                {chartData.map((entry, index) => (
                                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                ))}
                            </Pie>
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                            <Legend />
                        </PieChart>
                    ) : (
                        <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                            <XAxis dataKey={xKey} stroke="#9ca3af" tick={{fontSize: 12}} />
                            <YAxis stroke="#9ca3af" tick={{fontSize: 12}} />
                            <Tooltip contentStyle={{ backgroundColor: '#111827', border: '1px solid #374151', borderRadius: '8px' }} />
                            <Legend />
                            {yKeys.map((k, i) => (
                                <Bar key={k} dataKey={k} fill={COLORS[i % COLORS.length]} radius={[4, 4, 0, 0]} />
                            ))}
                        </BarChart>
                    )}
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="dashboard">
            
            {/* PANEL 1: RECENT CHATS (Flex 1.5) */}
            <div className="recent-chats">
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
                    {sessions.length === 0 && <p style={{color: 'var(--text-secondary)', fontSize: '0.85rem', padding: '1rem'}}>No history found.</p>}
                </div>
            </div>

            {/* PANEL 2: CHAT WINDOW (Flex 2.5) */}
            <div className="chat-window">
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

            {/* PANEL 3: ANALYTICS CANVAS (Flex 3) */}
            <div className="analytics-canvas">
                {analyticsPayload ? (
                    <>
                        <div className="canvas-header">
                            <h2>Intelligence Canvas</h2>
                            {analyticsPayload.chart && analyticsPayload.chart.length > 0 && (
                                <button className="download-btn" onClick={downloadChart}>
                                    📥 Download SVG
                                </button>
                            )}
                        </div>

                        <div className="card">
                            <h3>🤖 Summary</h3>
                            <div className="analytics-summary">{analyticsPayload.summary}</div>
                        </div>

                        {analyticsPayload.chart && analyticsPayload.chart.length > 0 && (
                            <div className="card">
                                <h3>📈 Chart Visualization</h3>
                                {renderChart()}
                            </div>
                        )}

                        {analyticsPayload.table && analyticsPayload.table.length > 0 && (
                            <div className="card">
                                <h3>📋 Data Records ({analyticsPayload.table.length})</h3>
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
                    </>
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
