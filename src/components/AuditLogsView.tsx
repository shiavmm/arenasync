import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Layers,
  ArrowRight
} from 'lucide-react';
import { AuditLogEntry } from '../types.js';

interface AuditLogsViewProps {
  logs: AuditLogEntry[];
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');

  const filteredLogs = logs.filter(log => {
    const matchEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    const matchSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchEntity && matchSearch;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <FileText className="h-6 w-6 text-cyan-400" />
            <span>Enterprise Audit & Governance Trail</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Immutable log of score changes, document verifications, fixture generations, and administrative actions.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Shield className="h-4 w-4 text-emerald-400" />
          <span>Audit Engine Active • {logs.length} Operations Recorded</span>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search action, user, or note..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52 sm:w-64"
            />
          </div>

          <select
            value={entityFilter}
            onChange={e => setEntityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Entity Types</option>
            <option value="MATCH">Matches & Scoring</option>
            <option value="DOCUMENT">Documents & Clearances</option>
            <option value="PLAYER">Athletes / Players</option>
            <option value="TEAM">Teams & Franchises</option>
            <option value="TOURNAMENT">Tournaments & Brackets</option>
          </select>
        </div>

        <span className="text-xs font-mono text-slate-400">
          Showing <strong className="text-white">{filteredLogs.length}</strong> logged transactions
        </span>
      </div>

      {/* Audit Log Table */}
      <div className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-950/70 text-slate-400 font-mono text-[11px]">
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">User & Role</th>
                <th className="py-3 px-4">Action</th>
                <th className="py-3 px-4">Entity</th>
                <th className="py-3 px-4">State Transition (Before → After)</th>
                <th className="py-3 px-4">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-500">
                    No audit records match your query.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => (
                  <tr key={log.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleTimeString()}
                      <div className="text-[9px] text-slate-500">
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="font-semibold text-white">{log.userName}</div>
                      <span className="px-1.5 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-800 text-cyan-400 border border-slate-700">
                        {log.userRole}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-mono font-bold text-slate-200">
                      {log.action}
                    </td>

                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-950 border border-slate-800 text-slate-300 font-mono text-[10px]">
                        {log.entityType}
                      </span>
                      <div className="text-[10px] text-slate-500 font-mono mt-0.5">{log.entityId}</div>
                    </td>

                    <td className="py-3 px-4 text-[11px] font-mono">
                      {log.previousValue || log.newValue ? (
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded bg-rose-950/30 text-rose-300 border border-rose-900/50">
                            {JSON.stringify(log.previousValue)}
                          </span>
                          <ArrowRight className="h-3 w-3 text-slate-500 shrink-0" />
                          <span className="px-2 py-0.5 rounded bg-emerald-950/30 text-emerald-300 border border-emerald-900/50">
                            {JSON.stringify(log.newValue)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-500 italic">State creation</span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-slate-300 text-[11px] max-w-xs">
                      {log.notes || <span className="text-slate-600 italic">None</span>}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
