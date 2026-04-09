import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/DataStudio.css';

const DB_TYPES = [
    { type: 'oracle', name: 'Oracle Database', icon: '💎', color: '#ff0000', defaultPort: '1521', desc: 'Real-time Oracle SQL integration (OE/HR schemas).' },
    { type: 'mysql', name: 'MySQL Server', icon: '🐬', color: '#00758f', defaultPort: '3306', desc: 'Managed MySQL database connectivity.' },
    { type: 'postgres', name: 'PostgreSQL Server', icon: '🐘', color: '#336791', defaultPort: '5432', desc: 'Multi-tenant PostgreSQL schema explorer.' }
];

const DataStudio = () => {
    // View State: 'selection' | 'form' | 'dashboard'
    const [view, setView] = useState('selection');
    const [selectedDB, setSelectedDB] = useState(null);
    const [loading, setLoading] = useState(false);
    
    // Connection Form State
    const [formData, setFormData] = useState({
        host: '',
        port: '',
        user: '',
        password: '',
        service_name: '',
        database: ''
    });

    // Dashboard State
    const [datasets, setDatasets] = useState([]);
    const [datasetFilter, setDatasetFilter] = useState("");
    const [selectedTable, setSelectedTable] = useState(null);
    const [columns, setColumns] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [connInfo, setConnInfo] = useState(null);

    const openForm = (dbType) => {
        const config = DB_TYPES.find(d => d.type === dbType);
        setSelectedDB(config);
        const isOracle = dbType === 'oracle';
        setFormData(prev => ({
            ...prev,
            type: dbType,
            port: config.defaultPort,
            host: isOracle ? '192.168.0.205' : 'localhost',
            user: isOracle ? 'SYSTEM' : '',
            service_name: isOracle ? 'xepdb1' : '',
            password: '',
        }));
        setView('form');
    };

    const handleConnect = async (e) => {
        e?.preventDefault();
        setLoading(true);
        try {
            const payload = {
                type: formData.type,
                host: formData.host,
                port: formData.port,
                user: formData.user,
                password: formData.password,
                service_name: formData.service_name,
                database: formData.database,
            };
            const res = await API.post("data-studio/connect/", payload);
            if (res.data.success) {
                setConnInfo({ type: selectedDB.name, host: formData.host });
                toast.success(`✅ Connected to ${selectedDB.name}`);
                await fetchTables(true);
            } else {
                toast.error(res.data.error || "Connection failed");
            }
        } catch (err) {
            toast.error(err.response?.data?.error || "❌ Connection refused — check credentials");
        } finally {
            setLoading(false);
        }
    };

    const fetchTables = async (fromConnect = false) => {
        if (!fromConnect) setLoading(true);
        try {
            const res = await API.get("data-studio/tables/");
            setDatasets(res.data.datasets || []);
            setView('dashboard');
        } catch (err) {
            toast.error("❌ Session lost — please reconnect");
            setView('selection');
        } finally {
            setLoading(false);
        }
    };

    const loadTable = async (table) => {
        setSelectedTable(table);
        setSearchTerm("");
        setLoading(true);
        try {
            const res = await API.get(`data-studio/table/${table}/`);
            setColumns(res.data.columns || []);
            setTableData(res.data.data || []);
            if (res.data.message) toast(res.data.message, { icon: '🛡️' });
        } catch (err) {
            console.error("Error loading table data", err);
            toast.error(`⚠️ Access Denied for: ${table}`);
        } finally {
            setLoading(false);
        }
    };

    const disconnect = () => {
        setView('selection');
        setSelectedDB(null);
        setDatasets([]);
        setSelectedTable(null);
        setTableData([]);
        toast.error("Unlinked from Database Engine");
    };

    const exportCSV = () => {
        if (!tableData.length) return;
        const header = columns.join(',');
        const rows = tableData.map(row =>
            columns.map(col => JSON.stringify(row[col] ?? '')).join(',')
        );
        const csv = [header, ...rows].join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${selectedTable}.csv`;
        a.click();
        URL.revokeObjectURL(url);
        toast.success(`Exported ${selectedTable}.csv`);
    };

    // ──────────────────────────────────────────────────────────────────────────
    // SUB-COMPONENTS
    // ──────────────────────────────────────────────────────────────────────────

    const SelectionView = () => (
        <div className="selection-view">
            <h1 className="selection-title">Data Studio Explorer</h1>
            <p className="selection-subtitle">Select a verified source to begin real-time data discovery.</p>
            <div className="db-cards">
                {DB_TYPES.map(db => (
                    <div key={db.type} className="db-card" onClick={() => openForm(db.type)}>
                        <div className="db-icon">{db.icon}</div>
                        <div className="db-name">{db.name}</div>
                        <p>{db.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    );

    const FormView = () => (
        <div className="form-view">
            <div className="connection-form">
                <div className="form-header">
                    <span className="db-icon">{selectedDB.icon}</span>
                    <h2>Connect to {selectedDB.name}</h2>
                </div>
                <form onSubmit={handleConnect} className="form-grid">
                    <div className="form-group full">
                        <label>Target Machine Path</label>
                        <input className="form-input" value={formData.host} onChange={e => setFormData({...formData, host: e.target.value})} placeholder="e.g. 192.168.0.205" />
                    </div>
                    <div className="form-group">
                        <label>Service Port</label>
                        <input className="form-input" value={formData.port} onChange={e => setFormData({...formData, port: e.target.value})} placeholder="1521" />
                    </div>
                    <div className="form-group">
                        <label>User Identity</label>
                        <input className="form-input" value={formData.user} onChange={e => setFormData({...formData, user: e.target.value})} placeholder="e.g. SYSTEM" />
                    </div>
                    
                    <div className="form-group full">
                        <label>{selectedDB.type === 'oracle' ? 'Service SID / Name' : 'Schema Database'}</label>
                        <input className="form-input" value={selectedDB.type === 'oracle' ? formData.service_name : formData.database} 
                               onChange={e => selectedDB.type === 'oracle' ? setFormData({...formData, service_name: e.target.value}) : setFormData({...formData, database: e.target.value})} 
                               placeholder={selectedDB.type === 'oracle' ? "xepdb1" : "public_schema"} />
                    </div>

                    <div className="form-group full">
                        <label>Security Key (Password)</label>
                        <input type="password" className="form-input" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} placeholder="••••••••" />
                    </div>

                    <p style={{ gridColumn: 'span 2', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.5rem' }}>
                        * Connection will utilize secure credentials verified in the system .env file.
                    </p>

                    <div className="form-actions">
                        <button type="button" className="btn-secondary" onClick={() => setView('selection')}>Back</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Initializing...' : 'Verify & Connect'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );

    const DashboardView = () => (
        <div className="dashboard-view" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header className="studio-topbar">
                <div className="status-indicator">
                    <div className="status-dot"></div>
                    <span className="status-text">
                        <strong>LIVE SQL ACTIVE:</strong> {connInfo?.type} | {datasets.length} Objects Discovered
                    </span>
                </div>
                <div className="btn-group">
                    <button className="btn-secondary" onClick={disconnect}>Disconnect</button>
                    <button className="btn-primary" onClick={() => fetchTables()} disabled={loading}>Refresh Tables</button>
                </div>
            </header>

            <main className="studio-body">
                <aside className="studio-sidebar">
                    <div style={{ padding: '1.25rem' }}>
                        <input 
                            type="text" 
                            className="form-input" 
                            style={{ width: '100%' }}
                            placeholder="Search Tables..."
                            value={datasetFilter}
                            onChange={(e) => setDatasetFilter(e.target.value)}
                        />
                    </div>
                    <div className="dataset-list">
                        {datasets
                            .filter(t => t.toLowerCase().includes(datasetFilter.toLowerCase()))
                            .map((table) => (
                                <div 
                                    key={table} 
                                    className={`dataset-item ${selectedTable === table ? 'active' : ''}`}
                                    onClick={() => loadTable(table)}
                                >
                                    <span style={{opacity: 0.6}}>🗂️</span> {table}
                                </div>
                            ))}
                    </div>
                </aside>

                <section className="studio-main">
                    {selectedTable ? (
                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            <div className="studio-main-header">
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
                                    <h2 style={{ fontSize: '1.5rem', fontWeight: 800 }}>{selectedTable}</h2>
                                    {!loading && tableData.length > 0 && (
                                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', background: 'var(--bg-app)', padding: '0.3rem 0.8rem', borderRadius: 20, border: '1px solid var(--border-color)' }}>
                                            {tableData.length} records
                                        </span>
                                    )}
                                </div>
                                <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', marginTop: '1rem', flexWrap: 'wrap' }}>
                                    <div className="csg-pill">
                                        🛡️ ROW/COL SECURITY ACTIVE
                                    </div>
                                    <input
                                        type="text"
                                        className="form-input"
                                        placeholder="Filter rows..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        style={{ height: '36px', maxWidth: '260px' }}
                                    />
                                    {tableData.length > 0 && (
                                        <button className="btn-secondary" onClick={exportCSV} style={{ height: '36px', padding: '0 1rem', fontSize: '0.85rem' }}>
                                            ⬇️ Export CSV
                                        </button>
                                    )}
                                </div>
                            </div>

                            <div className="table-container">
                                {loading ? (
                                    <div style={{ padding: '4rem', textAlign: 'center' }}>
                                        <div className="typing-indicator" style={{marginBottom: '10px'}}>
                                            <span></span><span></span><span></span>
                                        </div>
                                        Fetching live records from {selectedTable}...
                                    </div>
                                ) : (
                                    <table className="enterprise-table">
                                        <thead>
                                            <tr>{columns.map(col => <th key={col}>{col}</th>)}</tr>
                                        </thead>
                                        <tbody>
                                            {tableData
                                                .filter(row => columns.some(col => String(row[col] ?? '').toLowerCase().includes(searchTerm.toLowerCase())))
                                                .map((row, i) => (
                                                    <tr key={i}>
                                                        {columns.map(col => <td key={col}>{row[col] ?? 'NULL'}</td>)}
                                                    </tr>
                                                ))}
                                        </tbody>
                                    </table>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div style={{ margin: 'auto', textAlign: 'center', opacity: 0.4 }}>
                            <div style={{ fontSize: '5rem', marginBottom: '1rem' }}>🔍</div>
                            <h3 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Oracle Intelligence Hub</h3>
                            <p>Select a table object from the directory to initiate a real-time data stream.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );

    return (
        <div className="data-studio-container">
            {view === 'selection' && <SelectionView />}
            {view === 'form' && <FormView />}
            {view === 'dashboard' && <DashboardView />}
        </div>
    );
};

export default DataStudio;
