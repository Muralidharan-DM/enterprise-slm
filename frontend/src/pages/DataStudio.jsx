import React, { useState, useEffect } from 'react';
import API from '../services/api';
import toast from 'react-hot-toast';
import '../styles/DataStudio.css';

const DataStudio = () => {
    const [datasets, setDatasets] = useState([]);
    const [datasetFilter, setDatasetFilter] = useState("");
    const [selectedTable, setSelectedTable] = useState(null);
    const [columns, setColumns] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [loading, setLoading] = useState(false);
    
    useEffect(() => {
        // Auto connect on mount since this is an enterprise internal tool
        connectDB();
    }, []);
    
    const connectDB = async () => {
        setLoading(true);
        try {
            const res = await API.get("data-studio/tables/");
            setDatasets(res.data.datasets || []);
            toast.success("Synchronized with Oracle Database");
        } catch (err) {
            console.error("Error connecting to DB", err);
            toast.error("Database Connection Failed");
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
            toast.error(`Unauthorized access for asset: ${table}`);
        } finally {
            setLoading(false);
        }
    };

    const downloadCSV = () => {
        if (!tableData.length) return;
        const headers = columns.join(",");
        const rows = tableData.map(row => 
            columns.map(col => `"${String(row[col] ?? 'NULL').replace(/"/g, '""')}"`).join(",")
        );
        const csvContent = [headers, ...rows].join("\n");
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.setAttribute("href", url);
        link.setAttribute("download", `${selectedTable}_export.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        toast.success("CSV Export Triggered");
    };

    const formatDate = () => {
        const d = new Date();
        return `${d.toLocaleDateString('en-GB')} ${d.toLocaleTimeString('en-GB')}`;
    };

    return (
        <div className="data-studio-container">
            {/* Top Bar identical to Image 3/5 */}
            <header className="studio-topbar">
                <div className="status-indicator">
                    <span className="status-dot"></span>
                    <span className="status-text">
                        Oracle Database (192.168.0.205) — {datasets.length} assets
                    </span>
                    <span className="status-meta">🕑 {formatDate()}</span>
                </div>
                <div className="topbar-actions">
                    <button className="btn-secondary" onClick={() => {
                        setDatasets([]);
                        setSelectedTable(null);
                        setTableData([]);
                        toast.error("Disconnected from Session");
                    }}>Disconnect</button>
                    <button className="btn-primary" onClick={connectDB} disabled={loading}>
                        {loading ? '...' : 'Sync Data'}
                    </button>
                </div>
            </header>

            <main className="studio-body">
                {/* Left Sidebar */}
                <aside className="studio-sidebar">
                    <div className="sidebar-filter">
                        <input 
                            type="text" 
                            placeholder="Filter Assets..."
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
                                    style={{ borderRadius: 'var(--radius-md)', margin: '4px 0' }}
                                >
                                    <span>📚</span>
                                    {table}
                                </div>
                            ))}
                    </div>
                </aside>

                {/* Main Content Area */}
                <section className="studio-main">
                    {selectedTable ? (
                        <>
                            <div className="main-header">
                                <div className="main-header-top">
                                    <h2 className="main-title">{selectedTable}</h2>
                                    <div className="main-controls">
                                        <div className="search-wrapper">
                                            <span className="search-icon">🔍</span>
                                            <input 
                                                type="text" 
                                                className="search-input" 
                                                placeholder="Search records..." 
                                                value={searchTerm}
                                                onChange={(e) => setSearchTerm(e.target.value)}
                                            />
                                        </div>
                                        <button className="icon-btn" title="Download CSV" onClick={downloadCSV}>
                                            📥
                                        </button>
                                    </div>
                                </div>
                                <div className="main-meta">
                                    <div className="csg-pill" style={{ background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.3)' }}>
                                        <span>🛡️</span>
                                        CSG Enforced Access ({columns.length} columns)
                                    </div>
                                    <span className="records-count" style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>{tableData.length} records retrieved</span>
                                </div>
                            </div>

                            {loading ? (
                                <div className="empty-state">
                                    <p>Loading table data...</p>
                                </div>
                            ) : (
                                <div className="table-container card" style={{ padding: 0, overflow: 'hidden' }}>
                                    <table className="enterprise-table">
                                        <thead>
                                            <tr>
                                                {columns.map(col => (
                                                    <th key={col}>
                                                        <div className="col-header">
                                                            <span>⊞</span> {col}
                                                        </div>
                                                    </th>
                                                ))}
                                            </tr>
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
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="empty-state">
                            <h2>Select an Asset</h2>
                            <p>Choose a dataset from the authorized schema assets list to begin.</p>
                        </div>
                    )}
                </section>
            </main>
        </div>
    );
};

export default DataStudio;
