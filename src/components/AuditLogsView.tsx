import React, { useState } from 'react';
import {
  FileText,
  Search,
  Filter,
  Shield,
  Clock,
  User,
  Layers,
  ArrowRight,
  Code,
  Copy,
  Check,
  X,
  ExternalLink,
  ChevronRight,
  Info,
  Calendar,
  Eye
} from 'lucide-react';
import { AuditLogEntry } from '../types.js';

interface AuditLogsViewProps {
  logs: AuditLogEntry[];
}

interface DiffItem {
  field: string;
  from?: any;
  to?: any;
  type: 'change' | 'add' | 'remove' | 'info';
  description?: string;
}

function parseJsonSafe(val?: string | null): any {
  if (!val) return null;
  if (typeof val !== 'string') return val;
  try {
    return JSON.parse(val);
  } catch {
    return val;
  }
}

function formatFieldName(key: string): string {
  const map: Record<string, string> = {
    jerseyNumber: 'Jersey #',
    homeScore: 'Home Score',
    awayScore: 'Away Score',
    score: 'Score',
    coachName: 'Coach',
    coachEmail: 'Coach Email',
    homeVenue: 'Venue',
    primaryColor: 'Primary Color',
    secondaryColor: 'Secondary Color',
    voidReason: 'Void Reason',
    eligibilityStatus: 'Eligibility',
    contactEmail: 'Email',
    matchesPlayed: 'Matches Played',
    minutesPlayed: 'Minutes',
    goalsFor: 'Goals For',
    goalsAgainst: 'Goals Against',
    goalDifference: 'Goal Diff',
    recentForm: 'Form',
    severity: 'Severity',
    category: 'Category',
    notes: 'Notes',
    status: 'Status',
    name: 'Name'
  };
  if (map[key]) return map[key];
  return key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());
}

function formatValue(v: any): string {
  if (v === null || v === undefined) return 'None';
  if (typeof v === 'boolean') return v ? 'Yes' : 'No';
  if (typeof v === 'object') {
    if (Array.isArray(v)) {
      if (v.length === 0) return '[]';
      if (typeof v[0] === 'string' || typeof v[0] === 'number') return v.join(', ');
      return `${v.length} items`;
    }
    return JSON.stringify(v);
  }
  return String(v);
}

function getHumanReadableDiff(log: AuditLogEntry): { summary: string; diffs: DiffItem[] } {
  const prev = parseJsonSafe(log.previousValue);
  const next = parseJsonSafe(log.newValue);

  // 1. Auth Login
  if (log.action === 'USER_LOGIN') {
    return {
      summary: `Session authenticated for role ${log.userRole}`,
      diffs: [
        {
          field: 'Authentication',
          description: `User "${log.userName}" logged in successfully (${log.userRole})`,
          type: 'info'
        }
      ]
    };
  }

  // 2. Score Update
  if (log.action.includes('SCORE')) {
    const prevHome = prev?.homeScore ?? prev?.score?.home ?? '?';
    const prevAway = prev?.awayScore ?? prev?.score?.away ?? '?';
    const nextHome = next?.homeScore ?? next?.score?.home ?? '?';
    const nextAway = next?.awayScore ?? next?.score?.away ?? '?';
    const event = next?.eventType || log.notes || 'Score adjusted';
    return {
      summary: `Score updated: ${prevHome} - ${prevAway} → ${nextHome} - ${nextAway} (${event})`,
      diffs: [
        {
          field: 'Match Score',
          from: `${prevHome} - ${prevAway}`,
          to: `${nextHome} - ${nextAway}`,
          type: 'change'
        }
      ]
    };
  }

  // 3. Deletion / Void
  if (log.action.includes('DELETE') || log.action.includes('VOID')) {
    const targetName = prev?.name || next?.name || log.entityId;
    const reason = next?.voidReason || prev?.voidReason || log.notes || 'Status set to INACTIVE / VOIDED';
    return {
      summary: `Soft-deleted ${log.entityType.toLowerCase()}: "${targetName}" (Reason: ${reason})`,
      diffs: [
        {
          field: 'Status',
          from: prev?.status || 'ACTIVE',
          to: next?.status || (log.action.includes('VOID') ? 'VOIDED' : 'INACTIVE'),
          type: 'change'
        },
        ...(next?.voidReason ? [{ field: 'Reason', description: next.voidReason, type: 'info' as const }] : [])
      ]
    };
  }

  // 4. Resolve Injury Flag
  if (log.action.includes('RESOLVE')) {
    return {
      summary: `Injury flag resolved by ${next?.resolvedBy || log.userName}`,
      diffs: [
        { field: 'Status', from: prev?.status || 'ACTIVE', to: 'RESOLVED', type: 'change' }
      ]
    };
  }

  // 5. Creation / Add
  if ((!prev || Object.keys(prev).length === 0) && next && typeof next === 'object') {
    const name = next.name || next.code || next.category || log.entityId;
    return {
      summary: `Registered new ${log.entityType.toLowerCase()}: "${name}"`,
      diffs: [
        {
          field: log.entityType,
          description: `Initial state created with status: ${next.status || 'ACTIVE'}`,
          type: 'add'
        }
      ]
    };
  }

  // 6. Object-to-Object update comparison
  if (prev && typeof prev === 'object' && next && typeof next === 'object') {
    const diffs: DiffItem[] = [];
    const ignoredKeys = new Set([
      'updatedAt',
      'lastUpdated',
      'version',
      'id',
      'teamId',
      'tournamentId',
      'workload',
      'documents',
      'participation',
      'stats',
      'recentForm',
      'matches',
      'assignedMatchIds',
      'createdAt',
      'deletedAt'
    ]);
    const allKeys = Array.from(new Set([...Object.keys(prev), ...Object.keys(next)]));

    for (const key of allKeys) {
      if (ignoredKeys.has(key)) continue;
      const vPrev = prev[key];
      const vNext = next[key];

      // Exclude nested complex objects (e.g. workload, sub-arrays) from inline summary
      if (
        (vPrev !== null && typeof vPrev === 'object') ||
        (vNext !== null && typeof vNext === 'object')
      ) {
        continue;
      }

      const strPrev = JSON.stringify(vPrev);
      const strNext = JSON.stringify(vNext);

      if (strPrev !== strNext) {
        diffs.push({
          field: formatFieldName(key),
          from: formatValue(vPrev),
          to: formatValue(vNext),
          type: 'change'
        });
      }
    }

    if (diffs.length > 0) {
      const first = diffs[0];
      const summary =
        diffs.length === 1
          ? `${first.field} changed from "${first.from}" → "${first.to}"`
          : `${diffs.length} fields updated (${diffs.slice(0, 2).map(d => `${d.field}: "${d.from}" → "${d.to}"`).join(', ')}${diffs.length > 2 ? '...' : ''})`;
      return { summary, diffs };
    }
  }

  // 7. Primitive / string fallback
  if (prev || next) {
    if (prev && next) {
      return {
        summary: `Changed from "${formatValue(prev)}" → "${formatValue(next)}"`,
        diffs: [{ field: 'Value', from: formatValue(prev), to: formatValue(next), type: 'change' }]
      };
    }
    return {
      summary: formatValue(next || prev),
      diffs: [{ field: 'Value', description: formatValue(next || prev), type: 'info' }]
    };
  }

  return {
    summary: log.notes || 'State transition recorded',
    diffs: []
  };
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ logs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [entityFilter, setEntityFilter] = useState('ALL');
  const [selectedPayloadLog, setSelectedPayloadLog] = useState<AuditLogEntry | null>(null);
  const [activePayloadTab, setActivePayloadTab] = useState<'diff' | 'raw'>('diff');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const filteredLogs = logs.filter(log => {
    const matchEntity = entityFilter === 'ALL' || log.entityType === entityFilter;
    const matchSearch =
      log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.entityType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (log.notes && log.notes.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchEntity && matchSearch;
  });

  const handleCopy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

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
            <option value="AUTH">Authentication / Access</option>
            <option value="RISK_FLAG">Injury & Risk Flags</option>
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
                <th className="py-3 px-4 w-28 whitespace-nowrap">Timestamp</th>
                <th className="py-3 px-4 w-44 whitespace-nowrap">User & Role</th>
                <th className="py-3 px-4 w-36 whitespace-nowrap">Action</th>
                <th className="py-3 px-4 w-28 whitespace-nowrap">Target Entity</th>
                <th className="py-3 px-4">Summary / Changes</th>
                <th className="py-3 px-4 w-52 text-right whitespace-nowrap">Payload</th>
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
                filteredLogs.map(log => {
                  const diffResult = getHumanReadableDiff(log);

                  return (
                    <tr key={log.id} className="hover:bg-slate-800/30 transition-colors">
                      {/* Timestamp */}
                      <td className="py-3.5 px-4 font-mono text-slate-400 text-[11px] whitespace-nowrap">
                        <div className="text-slate-200 font-medium">{new Date(log.timestamp).toLocaleTimeString()}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">
                          {new Date(log.timestamp).toLocaleDateString()}
                        </div>
                      </td>

                      {/* User & Role */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-white">{log.userName}</div>
                        <div className="mt-1">
                          <span className="px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-slate-800/80 text-cyan-400 border border-slate-700">
                            {log.userRole}
                          </span>
                        </div>
                      </td>

                      {/* Action */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-1 rounded-md bg-slate-950 border border-slate-700/80 font-mono font-bold text-slate-200 text-[11px]">
                          {log.action}
                        </span>
                      </td>

                      {/* Target Entity */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="px-2 py-0.5 rounded bg-slate-800/70 border border-slate-700 text-slate-300 font-mono text-[10px]">
                          {log.entityType}
                        </span>
                        <div className="text-[10px] text-slate-500 font-mono mt-1">{log.entityId}</div>
                      </td>

                      {/* Human-Readable Diff / Summary with Neutral Card Borders */}
                      <td className="py-3.5 px-4">
                        {diffResult.diffs.length > 0 ? (
                          <div className="flex flex-col gap-1.5 max-w-lg">
                            {diffResult.diffs.slice(0, 3).map((diff, idx) => (
                              <div
                                key={idx}
                                className="inline-flex items-center gap-2 flex-wrap p-1.5 rounded-lg border border-slate-700/80 bg-slate-950/60 text-[11px] font-mono text-slate-300"
                              >
                                <span className="text-slate-400 font-medium">{diff.field}:</span>
                                {diff.from !== undefined ? (
                                  <>
                                    <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-900 text-slate-300">
                                      {diff.from}
                                    </span>
                                    <ArrowRight className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                                    <span className="px-2 py-0.5 rounded border border-slate-700 bg-slate-800 text-cyan-300 font-semibold">
                                      {diff.to}
                                    </span>
                                  </>
                                ) : (
                                  <span className="text-slate-300">{diff.description}</span>
                                )}
                              </div>
                            ))}
                            {diffResult.diffs.length > 3 && (
                              <button
                                onClick={() => setSelectedPayloadLog(log)}
                                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-mono text-left underline"
                              >
                                +{diffResult.diffs.length - 3} more fields changed (click to view)
                              </button>
                            )}
                          </div>
                        ) : (
                          <div className="p-1.5 rounded-lg border border-slate-700/80 bg-slate-950/60 text-slate-300 text-[11px] inline-block">
                            {diffResult.summary}
                          </div>
                        )}
                        {log.notes && (
                          <p className="text-[10px] text-slate-400 italic mt-1 truncate">
                            Note: {log.notes}
                          </p>
                        )}
                      </td>

                      {/* Payload Drawer Trigger */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap w-52">
                        <button
                          onClick={() => setSelectedPayloadLog(log)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-700/80 bg-slate-800/80 hover:bg-slate-700 text-slate-200 hover:text-white transition-all text-[11px] font-medium shadow-sm hover:border-slate-600"
                        >
                          <Code className="h-3.5 w-3.5 text-cyan-400" />
                          <span>View Full JSON Payload</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Modal / Drawer for Full JSON Payload */}
      {selectedPayloadLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="relative w-full max-w-3xl max-h-[90vh] flex flex-col rounded-2xl bg-slate-900 border border-slate-700 shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="h-9 w-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
                  <Code className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-white font-mono">
                      {selectedPayloadLog.action}
                    </h3>
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-slate-800 border border-slate-700 text-slate-300">
                      {selectedPayloadLog.entityType}: {selectedPayloadLog.entityId}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Triggered by <span className="text-slate-200 font-medium">{selectedPayloadLog.userName}</span> ({selectedPayloadLog.userRole}) at {new Date(selectedPayloadLog.timestamp).toLocaleString()}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Tabs */}
            <div className="flex items-center gap-2 px-6 pt-3 border-b border-slate-800 bg-slate-900/60">
              <button
                onClick={() => setActivePayloadTab('diff')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activePayloadTab === 'diff'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Layers className="h-3.5 w-3.5" />
                <span>State Transition Diff</span>
              </button>
              <button
                onClick={() => setActivePayloadTab('raw')}
                className={`px-3 py-2 text-xs font-medium border-b-2 transition-colors flex items-center gap-1.5 ${
                  activePayloadTab === 'raw'
                    ? 'border-cyan-400 text-cyan-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Code className="h-3.5 w-3.5" />
                <span>Raw Audit Record</span>
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto space-y-4 max-h-[calc(90vh-140px)]">
              {/* Human-Readable Diff Callout with Neutral Card Borders */}
              <div className="p-4 rounded-xl border border-slate-700/80 bg-slate-950/70 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-300 uppercase tracking-wide font-mono flex items-center gap-1.5">
                    <Info className="h-3.5 w-3.5 text-cyan-400" />
                    Human-Readable Summary
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    ID: {selectedPayloadLog.id}
                  </span>
                </div>
                <p className="text-sm font-semibold text-white">
                  {getHumanReadableDiff(selectedPayloadLog).summary}
                </p>
                {selectedPayloadLog.notes && (
                  <p className="text-xs text-slate-400 border-t border-slate-800 pt-2 mt-2">
                    <strong className="text-slate-300">Notes / Reason:</strong> {selectedPayloadLog.notes}
                  </p>
                )}
              </div>

              {activePayloadTab === 'diff' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Previous State */}
                  <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 text-xs">
                      <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-slate-500" />
                        Previous State (Before)
                      </span>
                      {selectedPayloadLog.previousValue && (
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(parseJsonSafe(selectedPayloadLog.previousValue), null, 2),
                              'prev'
                            )
                          }
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedKey === 'prev' ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                      {selectedPayloadLog.previousValue
                        ? JSON.stringify(parseJsonSafe(selectedPayloadLog.previousValue), null, 2)
                        : '// No prior state (initial creation)'}
                    </pre>
                  </div>

                  {/* New State */}
                  <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 text-xs">
                      <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                        <span className="h-2 w-2 rounded-full bg-cyan-400" />
                        New State (After)
                      </span>
                      {selectedPayloadLog.newValue && (
                        <button
                          onClick={() =>
                            handleCopy(
                              JSON.stringify(parseJsonSafe(selectedPayloadLog.newValue), null, 2),
                              'next'
                            )
                          }
                          className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                        >
                          {copiedKey === 'next' ? (
                            <>
                              <Check className="h-3 w-3 text-emerald-400" />
                              <span className="text-emerald-400">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="h-3 w-3" />
                              <span>Copy JSON</span>
                            </>
                          )}
                        </button>
                      )}
                    </div>
                    <pre className="p-3 text-[11px] font-mono text-slate-300 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-72">
                      {selectedPayloadLog.newValue
                        ? JSON.stringify(parseJsonSafe(selectedPayloadLog.newValue), null, 2)
                        : '// No resulting payload recorded'}
                    </pre>
                  </div>
                </div>
              ) : (
                /* Raw Complete Audit Record */
                <div className="rounded-xl border border-slate-700/80 bg-slate-950/80 overflow-hidden flex flex-col">
                  <div className="flex items-center justify-between px-3 py-2 border-b border-slate-800 bg-slate-900/90 text-xs">
                    <span className="font-mono text-slate-300 font-semibold flex items-center gap-1.5">
                      <Code className="h-3.5 w-3.5 text-cyan-400" />
                      Complete AuditLogEntry JSON
                    </span>
                    <button
                      onClick={() => handleCopy(JSON.stringify(selectedPayloadLog, null, 2), 'raw')}
                      className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white transition-colors"
                    >
                      {copiedKey === 'raw' ? (
                        <>
                          <Check className="h-3 w-3 text-emerald-400" />
                          <span className="text-emerald-400">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="h-3 w-3" />
                          <span>Copy JSON</span>
                        </>
                      )}
                    </button>
                  </div>
                  <pre className="p-3 text-[11px] font-mono text-cyan-300/90 overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-96">
                    {JSON.stringify(selectedPayloadLog, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
              <span className="text-[11px] text-slate-500 font-mono">
                Audit record is cryptographically signed and immutable.
              </span>
              <button
                onClick={() => setSelectedPayloadLog(null)}
                className="px-4 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors border border-slate-700"
              >
                Close Drawer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
