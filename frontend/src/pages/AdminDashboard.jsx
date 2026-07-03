import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5000/api";

export default function AdminDashboard() {
  const { token, user } = useAuth();
  const { showToast } = useToast();
  
  const [activeTab, setActiveTab] = useState('analytics'); // 'analytics' | 'audit-logs'
  const [auditLogs, setAuditLogs] = useState([]);
  const [logPagination, setLogPagination] = useState({ page: 1, limit: 10, total: 0, pages: 1 });
  const [logFilters, setLogFilters] = useState({ action: '', performedBy: '', page: 1 });
  const [voterAnalytics, setVoterAnalytics] = useState(null);
  const [electionAnalytics, setElectionAnalytics] = useState(null);
  
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Fetch Voter & Election Analytics
  const fetchAnalytics = async () => {
    setLoadingAnalytics(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      
      const [voterRes, electionRes] = await Promise.all([
        fetch(`${API_BASE}/admin/analytics/voters?days=30`, { headers }),
        fetch(`${API_BASE}/admin/analytics/elections`, { headers })
      ]);
      
      if (voterRes.ok && electionRes.ok) {
        const voterData = await voterRes.json();
        const electionData = await electionRes.json();
        setVoterAnalytics(voterData.data);
        setElectionAnalytics(electionData.data);
      } else {
        showToast('Failed to fetch admin analytics data', 'error');
      }
    } catch (err) {
      console.error('Error fetching admin analytics:', err);
      showToast('Error connecting to backend analytics', 'error');
    } finally {
      setLoadingAnalytics(false);
    }
  };

  // Fetch Audit Logs
  const fetchAuditLogs = async (page = 1) => {
    setLoadingLogs(true);
    try {
      const headers = { Authorization: `Bearer ${token}` };
      let url = `${API_BASE}/admin/audit-logs?page=${page}&limit=10`;
      if (logFilters.action) url += `&action=${logFilters.action}`;
      if (logFilters.performedBy) url += `&performedBy=${logFilters.performedBy}`;
      
      const res = await fetch(url, { headers });
      if (res.ok) {
        const resData = await res.json();
        setAuditLogs(resData.data);
        setLogPagination(resData.pagination);
      } else {
        showToast('Failed to fetch audit logs', 'error');
      }
    } catch (err) {
      console.error('Error fetching audit logs:', err);
      showToast('Error connecting to backend logs', 'error');
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    if (token) {
      if (activeTab === 'analytics') {
        fetchAnalytics();
      } else {
        fetchAuditLogs(logFilters.page);
      }
    }
  }, [token, activeTab, logFilters.page]);

  const handleFilterSubmit = (e) => {
    e.preventDefault();
    setLogFilters(prev => ({ ...prev, page: 1 }));
    fetchAuditLogs(1);
  };

  const handleResetFilters = () => {
    setLogFilters({ action: '', performedBy: '', page: 1 });
    fetchAuditLogs(1);
  };

  // Calculate Voter Trend SVG Coordinates
  const renderVoterChart = () => {
    if (!voterAnalytics || !voterAnalytics.dailyTrend || voterAnalytics.dailyTrend.length === 0) {
      return (
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-slate-400">
          No voting data available for the last 30 days.
        </div>
      );
    }

    const trend = voterAnalytics.dailyTrend;
    const maxCount = Math.max(...trend.map(d => d.count), 5);
    const width = 500;
    const height = 200;
    const padding = 30;

    const points = trend.map((d, i) => {
      const x = padding + (i / (trend.length - 1 || 1)) * (width - padding * 2);
      const y = height - padding - (d.count / maxCount) * (height - padding * 2);
      return { x, y, label: d._id, count: d.count };
    });

    const pathData = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Gradient fill path data (goes down to bottom of chart area)
    const fillPathData = points.length > 0 
      ? `${pathData} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : '';

    return (
      <div className="relative w-full">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64 overflow-visible">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * (height - padding * 2);
            const val = Math.round(maxCount * (1 - ratio));
            return (
              <g key={idx}>
                <line 
                  x1={padding} 
                  y1={y} 
                  x2={width - padding} 
                  y2={y} 
                  className="stroke-gray-200 dark:stroke-slate-800" 
                  strokeDasharray="4 4" 
                />
                <text 
                  x={padding - 10} 
                  y={y + 4} 
                  textAnchor="end" 
                  className="text-[9px] fill-gray-400 dark:fill-slate-500 font-semibold"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Gradient area */}
          {fillPathData && <path d={fillPathData} fill="url(#chartGrad)" />}

          {/* Trend line */}
          {pathData && (
            <path 
              d={pathData} 
              fill="none" 
              className="stroke-indigo-600 dark:stroke-indigo-400" 
              strokeWidth="2.5" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
            />
          )}

          {/* Highlight dots */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="4" 
                className="fill-indigo-600 dark:fill-indigo-400 stroke-white dark:stroke-slate-900" 
                strokeWidth="1.5" 
              />
              <circle 
                cx={p.x} 
                cy={p.y} 
                r="8" 
                className="fill-indigo-600 opacity-0 group-hover:opacity-20 transition-opacity" 
              />
              
              {/* Tooltip */}
              <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 pointer-events-none">
                <rect 
                  x={Math.max(10, p.x - 45)} 
                  y={p.y - 32} 
                  width="90" 
                  height="22" 
                  rx="4" 
                  className="fill-gray-900 dark:fill-white" 
                />
                <text 
                  x={Math.max(10, p.x - 45) + 45} 
                  y={p.y - 17} 
                  textAnchor="middle" 
                  className="text-[9px] font-bold fill-white dark:fill-gray-900"
                >
                  {p.label}: {p.count} votes
                </text>
              </g>
            </g>
          ))}

          {/* Bottom Labels (dates) */}
          {points.filter((_, idx) => idx === 0 || idx === Math.floor(points.length / 2) || idx === points.length - 1).map((p, idx) => (
            <text 
              key={idx} 
              x={p.x} 
              y={height - 10} 
              textAnchor="middle" 
              className="text-[10px] fill-gray-400 dark:fill-slate-500 font-semibold"
            >
              {p.label}
            </text>
          ))}
        </svg>
      </div>
    );
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      
      {/* Header section with Glassmorphic gradient banner */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 p-8 md:p-12 shadow-2xl border border-indigo-500/10 mb-8">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_120%,rgba(99,102,241,0.15),transparent_40%)]" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-400/20 text-xs font-semibold tracking-wider uppercase mb-3">
              SuperAdmin Command Center
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Platform Governance Dashboard
            </h1>
            <p className="mt-2 text-indigo-200 text-sm max-w-xl">
              Monitor real-time network transaction integrity, verify system audit logs, and evaluate voter trends.
            </p>
          </div>
          <div className="flex items-center space-x-3 bg-white/5 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/30 flex items-center justify-center border border-indigo-500/20">
              <span className="text-lg">🛡️</span>
            </div>
            <div>
              <div className="text-xs text-indigo-300 font-semibold uppercase tracking-wider">Current Admin</div>
              <div className="text-sm font-bold text-white max-w-[160px] truncate">{user?.address}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-2 border-b border-gray-200 dark:border-slate-800 mb-8 p-1 bg-gray-100 dark:bg-slate-900/60 rounded-2xl max-w-sm">
        <button
          onClick={() => setActiveTab('analytics')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'analytics'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📈 System Analytics
        </button>
        <button
          onClick={() => setActiveTab('audit-logs')}
          className={`flex-1 py-2.5 px-4 rounded-xl text-sm font-bold transition-all duration-200 ${
            activeTab === 'audit-logs'
              ? 'bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
              : 'text-gray-500 dark:text-slate-400 hover:text-gray-900 dark:hover:text-white'
          }`}
        >
          📜 Audit Logs
        </button>
      </div>

      {/* ANALYTICS TAB CONTENT */}
      {activeTab === 'analytics' && (
        <div className="space-y-8 animate-fade-in">
          {loadingAnalytics ? (
            <div className="flex flex-col items-center justify-center py-24 space-y-4">
              <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-500 dark:text-slate-400 font-semibold">Aggregating platform statistics...</p>
            </div>
          ) : (
            <>
              {/* Analytics Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Total Elections */}
                <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Total Elections Created</span>
                    <span className="text-2xl">🗳️</span>
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {electionAnalytics?.totalElections || 0}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-medium">
                    Cumulative contracts indexed since deployment
                  </p>
                </div>

                {/* Total Votes */}
                <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Total Votes Cast</span>
                    <span className="text-2xl">⚡</span>
                  </div>
                  <div className="text-4xl font-extrabold text-gray-900 dark:text-white">
                    {voterAnalytics?.totalVotes || 0}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-2 font-medium">
                    Authenticated vote casting transactions
                  </p>
                </div>

                {/* Queue/Timelock Status */}
                <div className="bg-white dark:bg-[#111827] p-6 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-md">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-bold text-gray-500 dark:text-slate-400">Active Proposals Status</span>
                    <span className="text-2xl">⏳</span>
                  </div>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {electionAnalytics?.statusDistribution?.map((dist) => {
                      let badgeColor = 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300';
                      if (dist._id === 'active') badgeColor = 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-300';
                      if (dist._id === 'closed') badgeColor = 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300';
                      return (
                        <div key={dist._id} className={`flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-bold ${badgeColor}`}>
                          <span>{dist._id || 'unknown'}:</span>
                          <span>{dist.count}</span>
                        </div>
                      );
                    }) || <span className="text-gray-400 dark:text-slate-500 text-sm">No data available</span>}
                  </div>
                  <p className="text-xs text-gray-400 dark:text-slate-500 mt-3 font-medium">
                    Overview of global proposals by lifecycle stage
                  </p>
                </div>

              </div>

              {/* Voter Analytics Chart Card */}
              <div className="bg-white dark:bg-[#111827] p-6 rounded-3xl border border-gray-200 dark:border-slate-800 shadow-lg">
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white">Voter Participation Trend</h3>
                    <p className="text-xs text-gray-500 dark:text-slate-400">Daily number of votes cast over the last 30 days</p>
                  </div>
                  <span className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400 rounded-lg text-xs font-bold">
                    Last 30 Days
                  </span>
                </div>
                
                {renderVoterChart()}
              </div>
            </>
          )}
        </div>
      )}

      {/* AUDIT LOGS TAB CONTENT */}
      {activeTab === 'audit-logs' && (
        <div className="space-y-6 animate-fade-in">
          
          {/* Filtering controls */}
          <form onSubmit={handleFilterSubmit} className="bg-white dark:bg-[#111827] p-5 rounded-2xl border border-gray-200 dark:border-slate-800 shadow-md">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Action Type
                </label>
                <select
                  value={logFilters.action}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, action: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                >
                  <option value="">All Actions</option>
                  <option value="ELECTION_CREATED">Election Created</option>
                  <option value="PROPOSAL_CREATED">Proposal Created</option>
                  <option value="PROPOSAL_QUEUED">Proposal Queued</option>
                  <option value="PROPOSAL_EXECUTED">Proposal Executed</option>
                  <option value="PROPOSAL_CANCELLED">Proposal Cancelled</option>
                  <option value="PROPOSAL_FINALIZED">Proposal Finalized</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 dark:text-slate-400 uppercase tracking-wide mb-2">
                  Performed By (Wallet)
                </label>
                <input
                  type="text"
                  placeholder="0x..."
                  value={logFilters.performedBy}
                  onChange={(e) => setLogFilters(prev => ({ ...prev, performedBy: e.target.value }))}
                  className="w-full px-3 py-2 bg-gray-50 dark:bg-slate-900 border border-gray-200 dark:border-slate-800 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-900 dark:text-white"
                />
              </div>
              <div className="flex space-x-2">
                <button
                  type="submit"
                  className="flex-1 py-2 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm rounded-xl transition-all shadow-md"
                >
                  Apply Filters
                </button>
                <button
                  type="button"
                  onClick={handleResetFilters}
                  className="py-2 px-4 bg-gray-100 hover:bg-gray-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-gray-600 dark:text-slate-300 font-bold text-sm rounded-xl transition-all"
                >
                  Reset
                </button>
              </div>
            </div>
          </form>

          {/* Logs Table */}
          <div className="bg-white dark:bg-[#111827] rounded-3xl border border-gray-200 dark:border-slate-800 shadow-lg overflow-hidden">
            {loadingLogs ? (
              <div className="flex flex-col items-center justify-center py-20 space-y-4">
                <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                <p className="text-gray-500 dark:text-slate-400 font-medium">Loading system events...</p>
              </div>
            ) : auditLogs.length === 0 ? (
              <div className="py-20 text-center text-gray-400 dark:text-slate-500 font-medium">
                No matching system log records discovered.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 dark:bg-slate-900/80 text-gray-400 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-gray-200 dark:border-slate-800">
                      <th className="px-6 py-4">Action</th>
                      <th className="px-6 py-4">Performed By</th>
                      <th className="px-6 py-4">Target Resource</th>
                      <th className="px-6 py-4">Metadata</th>
                      <th className="px-6 py-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60">
                    {auditLogs.map((log) => (
                      <tr 
                        key={log._id} 
                        className="hover:bg-gray-50/50 dark:hover:bg-slate-800/20 text-sm transition-colors text-gray-700 dark:text-slate-300"
                      >
                        <td className="px-6 py-4 font-bold">
                          <span className="inline-block px-2.5 py-0.5 rounded-md bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400 text-xs uppercase tracking-wider">
                            {log.action.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs max-w-[150px] truncate" title={log.performedBy}>
                          {log.performedBy}
                        </td>
                        <td className="px-6 py-4 font-mono text-xs max-w-[180px] truncate" title={log.targetResource}>
                          {log.targetResource}
                        </td>
                        <td className="px-6 py-4 text-xs font-semibold text-gray-500 dark:text-slate-400 max-w-[200px] truncate">
                          {log.metadata ? JSON.stringify(log.metadata) : '-'}
                        </td>
                        <td className="px-6 py-4 text-xs text-gray-400 dark:text-slate-500 font-semibold">
                          {new Date(log.timestamp).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination Controls */}
            {logPagination.pages > 1 && (
              <div className="bg-gray-50 dark:bg-slate-900/40 px-6 py-4 border-t border-gray-200 dark:border-slate-800 flex justify-between items-center">
                <span className="text-xs text-gray-500 dark:text-slate-400 font-semibold">
                  Page {logPagination.page} of {logPagination.pages} ({logPagination.total} total logs)
                </span>
                <div className="flex space-x-2">
                  <button
                    disabled={logPagination.page === 1}
                    onClick={() => setLogFilters(prev => ({ ...prev, page: logPagination.page - 1 }))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-40 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    Previous
                  </button>
                  <button
                    disabled={logPagination.page === logPagination.pages}
                    onClick={() => setLogFilters(prev => ({ ...prev, page: logPagination.page + 1 }))}
                    className="px-3 py-1.5 bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 disabled:opacity-40 text-gray-700 dark:text-slate-300 font-bold text-xs rounded-lg shadow-sm hover:bg-gray-50 dark:hover:bg-slate-750 transition-colors"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
