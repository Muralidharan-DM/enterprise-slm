import React, { useState, useEffect } from 'react';
import API from '../services/api';
import '../styles/DataStudio.css';

const DataStudio = () => {
    const [datasets, setDatasets] = useState([]);
    const [selectedTable, setSelectedTable] = useState(null);
    const [columns, setColumns] = useState([]);
    const [tableData, setTableData] = useState([]);
    const [loading, setLoading] = useState(false);
    const [connecting, setConnecting] = useState(false);
    
    const connectDB = async () => {
        setConnecting(true);
        try {
            const res = await API.get("data-studio/tables/");
            setDatasets(res.data.datasets);
            alert("Oracle Database Connected Successfully!");
        } catch (err) {
            console.error("Error connecting to DB", err);
            alert("Failed to connect to Oracle Database. Ensure the instance is reachable.");
        } finally {
            setConnecting(false);
        }
    };

    const loadTable = async (table) => {
        setSelectedTable(table);
        setLoading(true);
        try {
            const res = await API.get(`data-studio/table/${table}/`);
            setColumns(res.data.columns || []);
            setTableData(res.data.data || []);
        } catch (err) {
            console.error("Error loading table data", err);
            alert(`Failed to load data for ${table}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="data-studio-container">
            <div className="studio-sidebar">
                <div className="sidebar-header">
                    <img src="/logo.png" alt="Decision Minds" style={{ width: '50px', marginBottom: '1rem' }} />
                    <button 
                        className="connect-btn" 
                        onClick={connectDB} 
                        disabled={connecting}
                    >
                        {connecting ? 'Connecting...' : '🔌 Connect Oracle DB'}
                    </button>
                    <p style={{ fontSize: '0.75rem', color: '#666', marginTop: '1rem' }}>
                        {datasets.length} datasets found
                    </p>
                </div>
                
                <div className="dataset-list">
                    {datasets.map((table) => (
                        <div 
                            key={table} 
                            className={`dataset-item ${selectedTable === table ? 'active' : ''}`}
                            onClick={() => loadTable(table)}
                        >
                            📊 {table}
                        </div>
                    ))}
                    {datasets.length === 0 && !connecting && (
                        <p style={{ color: '#adb5bd', textAlign: 'center', marginTop: '2rem', fontSize: '0.85rem' }}>
                            Click Connect to explore datasets
                        </p>
                    )}
                </div>
            </div>

            <div className="studio-main">
                {selectedTable ? (
                    <>
                        <div className="table-header">
                            <div>
                                <h2 style={{ margin: 0, color: '#1a2a6c' }}>Explorer: {selectedTable}</h2>
                                <p style={{ margin: '0.25rem 0 0', color: '#666', fontSize: '0.85rem' }}>
                                    Showing top 50 records (Security filtering active)
                                </p>
                            </div>
                            <div className="table-actions">
                                <button className="add-btn" onClick={() => loadTable(selectedTable)}>Refresh</button>
                            </div>
                        </div>

                        {loading ? (
                            <div className="empty-state">
                                <div className="loader"></div>
                                <p>Loading data from Oracle...</p>
                            </div>
                        ) : tableData.length > 0 ? (
                            <div className="table-container">
                                <table className="oracle-table">
                                    <thead>
                                        <tr>
                                            {columns.map(col => <th key={col}>{col}</th>)}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {tableData.map((row, i) => (
                                            <tr key={i}>
                                                {columns.map(col => <td key={col}>{row[col] ?? 'NULL'}</td>)}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : (
                            <div className="empty-state">
                                <h2>No Data Available</h2>
                                <p>This table might be empty or restricted by your security groups.</p>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <img src="/logo.png" alt="Logo" style={{ width: '80px', opacity: 0.1 }} />
                        <h2>Data Studio Explorer</h2>
                        <p>Select a dataset from the sidebar to begin analysis.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default DataStudio;
