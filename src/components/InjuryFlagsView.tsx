import React, { useState } from 'react';
import {
  AlertOctagon,
  AlertTriangle,
  CheckCircle2,
  ShieldAlert,
  Info,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  X,
  UserCheck,
  ShieldBan,
  Activity,
  User
} from 'lucide-react';
import { InjuryRiskFlag, Player, Role, User as UserType, FlagCategory, FlagSeverity, FlagStatus } from '../types.js';
import { sportsApi } from '../services/api.js';

interface InjuryFlagsViewProps {
  injuryFlags: InjuryRiskFlag[];
  players: Player[];
  onSelectPlayer: (player: Player) => void;
  onNavigate: (view: string) => void;
  userRole?: Role;
  currentUser?: UserType;
  onRefresh?: () => void;
}

export const InjuryFlagsView: React.FC<InjuryFlagsViewProps> = ({
  injuryFlags,
  players,
  onSelectPlayer,
  onNavigate,
  userRole,
  currentUser,
  onRefresh
}) => {
  const [filterRisk, setFilterRisk] = useState<string>('ALL');
  const [filterStatus, setFilterStatus] = useState<string>('ACTIVE');
  const [filterSource, setFilterSource] = useState<string>('ALL');

  // Modals
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState<InjuryRiskFlag | null>(null);
  const [voidingFlag, setVoidingFlag] = useState<InjuryRiskFlag | null>(null);

  // Form states
  const [selectedPlayerId, setSelectedPlayerId] = useState<string>('');
  const [category, setCategory] = useState<FlagCategory>('INJURY');
  const [severity, setSeverity] = useState<FlagSeverity>('HIGH');
  const [notes, setNotes] = useState<string>('');
  const [voidReason, setVoidReason] = useState<string>('');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const safeInjuryFlags: InjuryRiskFlag[] = Array.isArray(injuryFlags)
    ? injuryFlags
    : ((injuryFlags as any)?.flags || []);

  const canManageFlag = (flag: InjuryRiskFlag) => {
    if (flag.source === 'ACWR_AUTO') return false;
    if (userRole === 'ADMIN') return true;
    if (userRole === 'COACH') {
      return !!(currentUser?.teamId && currentUser.teamId === flag.teamId);
    }
    return false;
  };

  const canCreateFlag = () => {
    if (userRole === 'ADMIN') return true;
    if (userRole === 'COACH' && currentUser?.teamId) return true;
    return false;
  };

  // Available players for create
  const eligiblePlayersForCreate = players.filter(p => {
    if (p.status === 'INACTIVE') return false;
    if (userRole === 'ADMIN') return true;
    if (userRole === 'COACH') return currentUser?.teamId && p.teamId === currentUser.teamId;
    return false;
  });

  const filteredFlags = safeInjuryFlags.filter(f => {
    const risk = f.severity || f.riskLevel || 'LOW';
    const matchRisk = filterRisk === 'ALL' || risk === filterRisk;
    const matchStatus = filterStatus === 'ALL' || (f.status || 'ACTIVE') === filterStatus;
    const matchSource = filterSource === 'ALL' || (f.source || 'ACWR_AUTO') === filterSource;
    return matchRisk && matchStatus && matchSource;
  });

  const highRiskCount = safeInjuryFlags.filter(f => (f.severity === 'HIGH' || f.riskLevel === 'HIGH') && (f.status || 'ACTIVE') === 'ACTIVE').length;
  const modRiskCount = safeInjuryFlags.filter(f => (f.severity === 'MODERATE' || f.riskLevel === 'MODERATE') && (f.status || 'ACTIVE') === 'ACTIVE').length;
  const lowRiskCount = safeInjuryFlags.filter(f => (f.severity === 'LOW' || f.riskLevel === 'LOW') && (f.status || 'ACTIVE') === 'ACTIVE').length;

  const openAddModal = () => {
    setSelectedPlayerId(eligiblePlayersForCreate[0]?.id || '');
    setCategory('INJURY');
    setSeverity('HIGH');
    setNotes('');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (flag: InjuryRiskFlag) => {
    setEditingFlag(flag);
    setCategory(flag.category || 'INJURY');
    setSeverity(flag.severity || (flag.riskLevel as FlagSeverity) || 'HIGH');
    setNotes(flag.notes || '');
    setErrorMsg('');
  };

  const openVoidModal = (flag: InjuryRiskFlag) => {
    setVoidingFlag(flag);
    setVoidReason('');
    setErrorMsg('');
  };

  const handleCreateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayerId) {
      setErrorMsg('Please select a player.');
      return;
    }
    if (notes.length > 500) {
      setErrorMsg('Notes cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await sportsApi.createInjuryFlag(selectedPlayerId, {
        category,
        severity,
        notes
      });
      setShowAddModal(false);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create injury flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingFlag) return;
    if (notes.length > 500) {
      setErrorMsg('Notes cannot exceed 500 characters.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await sportsApi.updateInjuryFlag(editingFlag.id, {
        category,
        severity,
        notes
      });
      setEditingFlag(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update injury flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResolveFlag = async (flag: InjuryRiskFlag) => {
    if (!window.confirm(`Are you sure you want to resolve this flag for ${flag.playerName}?`)) return;
    try {
      await sportsApi.resolveInjuryFlag(flag.id);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to resolve flag');
    }
  };

  const handleVoidFlag = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!voidingFlag) return;
    if (!voidReason.trim()) {
      setErrorMsg('A reason is required to void this flag.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg('');
    try {
      await sportsApi.voidInjuryFlag(voidingFlag.id, voidReason.trim());
      setVoidingFlag(null);
      if (onRefresh) onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to void flag');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <AlertOctagon className="h-6 w-6 text-rose-400" />
            <span>Injury-Risk Flags & Fatigue Sentinel</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            ACWR automated overload indicators and technical staff manual medical/suspension flags.
          </p>
        </div>

        {/* Action button */}
        {canCreateFlag() && (
          <button
            onClick={openAddModal}
            className="flex items-center gap-2 bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-lg shadow-rose-900/30"
          >
            <Plus className="h-4 w-4" />
            <span>Add Manual Flag</span>
          </button>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-900/80 p-3 rounded-2xl border border-slate-800">
        {/* Status Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] font-mono text-slate-500 px-2">STATUS:</span>
          <button
            onClick={() => setFilterStatus('ACTIVE')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterStatus === 'ACTIVE' ? 'bg-cyan-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Active
          </button>
          <button
            onClick={() => setFilterStatus('RESOLVED')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterStatus === 'RESOLVED' ? 'bg-emerald-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Resolved
          </button>
          <button
            onClick={() => setFilterStatus('VOIDED')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterStatus === 'VOIDED' ? 'bg-slate-700 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Voided
          </button>
          <button
            onClick={() => setFilterStatus('ALL')}
            className={`px-3 py-1 rounded-lg font-medium transition-all ${
              filterStatus === 'ALL' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All
          </button>
        </div>

        {/* Source Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] font-mono text-slate-500 px-2">SOURCE:</span>
          <button
            onClick={() => setFilterSource('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterSource === 'ALL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            All Sources
          </button>
          <button
            onClick={() => setFilterSource('ACWR_AUTO')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterSource === 'ACWR_AUTO' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Auto (ACWR)
          </button>
          <button
            onClick={() => setFilterSource('MANUAL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterSource === 'MANUAL' ? 'bg-indigo-600 text-white' : 'text-slate-400 hover:text-white'
            }`}
          >
            Manual
          </button>
        </div>

        {/* Severity Filter */}
        <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <span className="text-[11px] font-mono text-slate-500 px-2">SEVERITY:</span>
          <button
            onClick={() => setFilterRisk('ALL')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterRisk === 'ALL' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
            }`}
          >
            All ({filteredFlags.length})
          </button>
          <button
            onClick={() => setFilterRisk('HIGH')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterRisk === 'HIGH' ? 'bg-rose-600 text-white shadow-sm' : 'text-rose-400 hover:text-white'
            }`}
          >
            🔴 High ({highRiskCount})
          </button>
          <button
            onClick={() => setFilterRisk('MODERATE')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterRisk === 'MODERATE' ? 'bg-amber-600 text-white shadow-sm' : 'text-amber-400 hover:text-white'
            }`}
          >
            🟡 Mod ({modRiskCount})
          </button>
          <button
            onClick={() => setFilterRisk('LOW')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all ${
              filterRisk === 'LOW' ? 'bg-emerald-600 text-white shadow-sm' : 'text-emerald-400 hover:text-white'
            }`}
          >
            🟢 Low ({lowRiskCount})
          </button>
        </div>
      </div>

      {/* Critical Scientific & Legal Disclaimer Box */}
      <div className="p-4 rounded-2xl bg-slate-900 border border-amber-500/40 flex items-start gap-3.5 shadow-lg">
        <Info className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
        <div className="text-xs space-y-1">
          <span className="font-bold text-amber-300 font-mono uppercase tracking-wider">
            Important Sports Science & Clinical Disclaimer
          </span>
          <p className="text-slate-300 leading-relaxed">
            Injury-risk flags are <strong>purely statistical workload heuristics or manual coaching staff logs</strong>. They serve as athletic decision-support indicators for athlete safety and rotation and are <strong>not a clinical medical diagnosis</strong> or medical prognosis.
          </p>
        </div>
      </div>

      {/* Empty State */}
      {filteredFlags.length === 0 && (
        <div className="p-12 text-center rounded-2xl bg-slate-900/50 border border-slate-800 text-slate-400">
          <AlertTriangle className="h-10 w-10 text-slate-500 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white mb-1">No Injury Flags Matching Filters</h3>
          <p className="text-xs text-slate-400">Try changing the status, source, or severity filters above.</p>
        </div>
      )}

      {/* Risk Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredFlags.map(flag => {
          const matchingPlayer = players.find(p => p.id === flag.playerId);
          const severityVal = flag.severity || flag.riskLevel || 'LOW';
          const isHigh = severityVal === 'HIGH';
          const isMod = severityVal === 'MODERATE';
          const isAuto = flag.source === 'ACWR_AUTO';
          const isManual = flag.source === 'MANUAL';
          const flagStatus = flag.status || 'ACTIVE';
          const isSuspension = flag.category === 'SUSPENSION';

          const canManage = canManageFlag(flag);
          const isEditable = isManual && flagStatus === 'ACTIVE' && canManage;

          return (
            <div
              key={flag.id || `${flag.playerId}-${flag.category}-${flag.createdAt}`}
              className={`rounded-2xl bg-slate-900 border p-5 shadow-xl flex flex-col justify-between transition-all ${
                flagStatus === 'VOIDED'
                  ? 'border-slate-800 opacity-60 bg-slate-950'
                  : flagStatus === 'RESOLVED'
                  ? 'border-emerald-800/40 bg-slate-900/80'
                  : isSuspension
                  ? 'border-purple-800/70 bg-gradient-to-b from-purple-950/20 to-slate-900'
                  : isHigh
                  ? 'border-rose-800/60 bg-gradient-to-b from-rose-950/20 to-slate-900'
                  : isMod
                  ? 'border-amber-800/60 bg-gradient-to-b from-amber-950/20 to-slate-900'
                  : 'border-slate-800'
              }`}
            >
              <div>
                {/* Badges Row */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {/* Source Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                        isAuto
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                      }`}
                    >
                      {isAuto ? '⚡ ACWR Auto' : '✍️ Manual'}
                    </span>

                    {/* Category Badge */}
                    <span className="px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-800 text-slate-300 border border-slate-700">
                      {flag.category || 'INJURY'}
                    </span>

                    {/* Status Badge */}
                    <span
                      className={`px-2.5 py-0.5 rounded-md text-[10px] font-mono font-bold uppercase tracking-wider ${
                        flagStatus === 'ACTIVE'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                          : flagStatus === 'RESOLVED'
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/40'
                          : 'bg-slate-700 text-slate-300 border border-slate-600'
                      }`}
                    >
                      {flagStatus}
                    </span>
                  </div>

                  {/* Severity Badge */}
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-bold font-mono tracking-wider flex items-center gap-1.5 shadow-sm ${
                      isHigh
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        : isMod
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    }`}
                  >
                    <span>{isHigh ? '🔴' : isMod ? '🟡' : '🟢'}</span>
                    <span>{severityVal} SEVERITY</span>
                  </span>
                </div>

                {/* Player Information */}
                <div className="flex items-center gap-3 mb-4">
                  <img
                    src={matchingPlayer?.photoUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                    alt={flag.playerName}
                    className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/10"
                  />
                  <div>
                    <h3 className="font-bold text-white text-base leading-tight">
                      {flag.playerName}
                    </h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {flag.teamName} • Position: {matchingPlayer?.position || 'Forward'}
                    </p>
                  </div>
                </div>

                {/* Kickoff Gate Blocking Notice */}
                {flagStatus === 'ACTIVE' && (isHigh || isSuspension) && (
                  <div className="mb-3 p-2.5 rounded-xl bg-rose-950/50 border border-rose-800/60 flex items-center gap-2 text-xs text-rose-200">
                    <ShieldBan className="h-4 w-4 text-rose-400 shrink-0" />
                    <span>
                      <strong>Kickoff Gate Block:</strong> This player is locked from match kickoff clearance until resolved/voided.
                    </span>
                  </div>
                )}

                {/* Notes or Trigger reasons */}
                <div className="space-y-2 text-xs mb-3">
                  <span className="font-bold text-slate-300 font-mono uppercase tracking-wider text-[11px]">
                    {isAuto ? 'Identified Overload Triggers:' : 'Clinical / Disciplinary Notes:'}
                  </span>
                  {flag.notes ? (
                    <div className="p-2.5 rounded-xl bg-slate-950 text-slate-200 border border-slate-800 font-sans text-xs">
                      {flag.notes}
                    </div>
                  ) : flag.reasons && flag.reasons.length > 0 ? (
                    <ul className="space-y-1.5">
                      {flag.reasons.map((r, i) => (
                        <li
                          key={i}
                          className={`p-2 rounded-xl flex items-start gap-2 ${
                            isHigh
                              ? 'bg-rose-950/40 text-rose-200 border border-rose-800/40'
                              : isMod
                              ? 'bg-amber-950/40 text-amber-200 border border-amber-800/40'
                              : 'bg-slate-950 text-slate-300 border border-slate-800'
                          }`}
                        >
                          <span className="shrink-0 mt-0.5">•</span>
                          <span className="leading-snug">{r}</span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>

                {/* Void Reason Display if Voided */}
                {flagStatus === 'VOIDED' && flag.voidReason && (
                  <div className="p-2.5 rounded-xl bg-slate-950 border border-rose-900/50 text-xs text-rose-300 mb-3">
                    <span className="font-bold font-mono uppercase text-[10px] block text-rose-400">Void Reason:</span>
                    {flag.voidReason}
                  </div>
                )}

                {/* Metadata & Audit Trail */}
                <div className="text-[11px] text-slate-400 space-y-0.5 bg-slate-950/60 p-2.5 rounded-xl border border-slate-800/60 font-mono">
                  <div>Logged: {flag.createdAt ? new Date(flag.createdAt).toLocaleString() : 'N/A'} by {flag.createdBy || 'SYSTEM'}</div>
                  {flag.updatedAt && (
                    <div>Updated: {new Date(flag.updatedAt).toLocaleString()} by {flag.updatedBy}</div>
                  )}
                  {flag.resolvedAt && (
                    <div className="text-emerald-400">Resolved: {new Date(flag.resolvedAt).toLocaleString()} by {flag.resolvedBy}</div>
                  )}
                  {flag.voidedAt && (
                    <div className="text-rose-400">Voided: {new Date(flag.voidedAt).toLocaleString()} by {flag.voidedBy}</div>
                  )}
                </div>
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 mt-4 border-t border-slate-800 flex flex-wrap items-center justify-between gap-2 text-xs">
                {matchingPlayer ? (
                  <button
                    onClick={() => {
                      onSelectPlayer(matchingPlayer);
                      onNavigate('players');
                    }}
                    className="text-cyan-400 hover:text-cyan-300 font-semibold text-[11px]"
                  >
                    View Player File →
                  </button>
                ) : <span />}

                {/* Edit, Resolve, Delete buttons for manual active flags */}
                {isEditable && (
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => openEditModal(flag)}
                      className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-all text-xs flex items-center gap-1"
                      title="Edit flag"
                    >
                      <Edit2 className="h-3.5 w-3.5 text-cyan-400" />
                      <span>Edit</span>
                    </button>
                    <button
                      onClick={() => handleResolveFlag(flag)}
                      className="p-1.5 rounded-lg bg-emerald-950 hover:bg-emerald-900 border border-emerald-700 text-emerald-300 transition-all text-xs flex items-center gap-1"
                      title="Resolve flag"
                    >
                      <CheckCircle className="h-3.5 w-3.5" />
                      <span>Resolve</span>
                    </button>
                    <button
                      onClick={() => openVoidModal(flag)}
                      className="p-1.5 rounded-lg bg-rose-950 hover:bg-rose-900 border border-rose-800 text-rose-300 transition-all text-xs flex items-center gap-1"
                      title="Void / Delete flag"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Void</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* ADD FLAG MODAL */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <AlertOctagon className="h-5 w-5 text-rose-400" />
                <span>Add Manual Flag</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreateFlag} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Select Player</label>
                <select
                  value={selectedPlayerId}
                  onChange={e => setSelectedPlayerId(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  required
                >
                  <option value="">-- Choose Player --</option>
                  {eligiblePlayersForCreate.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.teamName}) - #{p.jerseyNumber}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as FlagCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="INJURY">INJURY</option>
                    <option value="ILLNESS">ILLNESS</option>
                    <option value="SUSPENSION">SUSPENSION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as FlagSeverity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="HIGH">HIGH (Blocks Kickoff)</option>
                    <option value="MODERATE">MODERATE (Warning)</option>
                    <option value="LOW">LOW (Warning)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Notes / Reason (max 500 chars)</label>
                  <span className="text-[10px] text-slate-500">{notes.length}/500</span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  placeholder="e.g., Hamstring strain reported in training, awaiting MRI clearance."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold shadow-lg shadow-rose-900/30"
                >
                  {isSubmitting ? 'Creating...' : 'Create Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT FLAG MODAL */}
      {editingFlag && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-cyan-400" />
                <span>Edit Manual Flag ({editingFlag.playerName})</span>
              </h3>
              <button
                onClick={() => setEditingFlag(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateFlag} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Category</label>
                  <select
                    value={category}
                    onChange={e => setCategory(e.target.value as FlagCategory)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="INJURY">INJURY</option>
                    <option value="ILLNESS">ILLNESS</option>
                    <option value="SUSPENSION">SUSPENSION</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Severity</label>
                  <select
                    value={severity}
                    onChange={e => setSeverity(e.target.value as FlagSeverity)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="HIGH">HIGH (Blocks Kickoff)</option>
                    <option value="MODERATE">MODERATE (Warning)</option>
                    <option value="LOW">LOW (Warning)</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-slate-300 font-semibold">Notes / Reason (max 500 chars)</label>
                  <span className="text-[10px] text-slate-500">{notes.length}/500</span>
                </div>
                <textarea
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  maxLength={500}
                  rows={3}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingFlag(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* VOID FLAG CONFIRMATION MODAL */}
      {voidingFlag && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Trash2 className="h-5 w-5 text-rose-400" />
                <span>Void Injury Flag ({voidingFlag.playerName})</span>
              </h3>
              <button
                onClick={() => setVoidingFlag(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Voiding performs a <strong>soft delete</strong>. The record is retained for compliance and audit logs, but will no longer restrict the player at kickoff. A void reason is mandatory.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/50 border border-rose-800 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleVoidFlag} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Reason for Voiding *</label>
                <textarea
                  value={voidReason}
                  onChange={e => setVoidReason(e.target.value)}
                  rows={3}
                  required
                  placeholder="e.g., Flag entered in error by assistant coach; athlete cleared by club physician."
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setVoidingFlag(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-semibold"
                >
                  {isSubmitting ? 'Voiding...' : 'Confirm Void Flag'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
