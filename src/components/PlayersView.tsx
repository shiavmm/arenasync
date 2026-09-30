import React, { useState } from 'react';
import {
  UserSquare2,
  Plus,
  Search,
  Filter,
  ShieldCheck,
  ShieldAlert,
  Flame,
  AlertOctagon,
  FileCheck,
  Mail,
  Phone,
  Trophy,
  Activity,
  X
} from 'lucide-react';
import { Player, Team, Role } from '../types.js';
import { sportsApi } from '../services/api.js';

interface PlayersViewProps {
  players: Player[];
  teams: Team[];
  onRefresh: () => void;
  userRole: Role;
  selectedPlayer: Player | null;
  onSelectPlayer: (player: Player | null) => void;
  onNavigate: (view: string) => void;
}

export const PlayersView: React.FC<PlayersViewProps> = ({
  players,
  teams,
  onRefresh,
  userRole,
  selectedPlayer,
  onSelectPlayer,
  onNavigate
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeamFilter, setSelectedTeamFilter] = useState('ALL');
  const [selectedEligibilityFilter, setSelectedEligibilityFilter] = useState('ALL');
  const [showAddModal, setShowAddModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Add Player Form
  const [name, setName] = useState('');
  const [teamId, setTeamId] = useState(teams[0]?.id || '');
  const [jerseyNumber, setJerseyNumber] = useState(10);
  const [position, setPosition] = useState('Midfielder');
  const [age, setAge] = useState(20);
  const [contactEmail, setContactEmail] = useState('');
  const [contactPhone, setContactPhone] = useState('');

  const filteredPlayers = players.filter(p => {
    const matchSearch =
      p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.playerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.teamName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchTeam = selectedTeamFilter === 'ALL' || p.teamId === selectedTeamFilter;
    const matchEligibility = selectedEligibilityFilter === 'ALL' || p.eligibilityStatus === selectedEligibilityFilter;
    return matchSearch && matchTeam && matchEligibility;
  });

  const handleAddPlayer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !teamId) {
      setErrorMsg('Name and team are required');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await sportsApi.createPlayer({
        name,
        teamId,
        jerseyNumber: Number(jerseyNumber),
        position,
        age: Number(age),
        contactEmail,
        contactPhone
      });
      setShowAddModal(false);
      setName('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to add player');
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
            <UserSquare2 className="h-6 w-6 text-cyan-400" />
            <span>Player Registry & Profiles</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Official collegiate rosters, document clearances, minutes played, and workload tracking.
          </p>
        </div>

        {(userRole === 'ADMIN' || userRole === 'COACH') && (
          <button
            onClick={() => {
              if (teams.length > 0 && !teamId) setTeamId(teams[0].id);
              setShowAddModal(true);
            }}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Add Athlete / Player</span>
          </button>
        )}
      </div>

      {/* Filters & Search */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search athlete, ID or club..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-52 sm:w-64"
            />
          </div>

          {/* Team Filter */}
          <select
            value={selectedTeamFilter}
            onChange={e => setSelectedTeamFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Franchises / Clubs</option>
            {teams.map(t => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>

          {/* Eligibility Filter */}
          <select
            value={selectedEligibilityFilter}
            onChange={e => setSelectedEligibilityFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white focus:outline-none focus:border-cyan-500"
          >
            <option value="ALL">All Clearances</option>
            <option value="VERIFIED">Verified Clearances</option>
            <option value="PENDING">Pending Verification</option>
            <option value="REJECTED">Rejected / Ineligible</option>
          </select>
        </div>

        <div className="text-xs font-mono text-slate-400">
          Showing <strong className="text-white">{filteredPlayers.length}</strong> athletes
        </div>
      </div>

      {/* Players Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredPlayers.map(player => {
          const isHighRisk = player.injuryRisk?.riskLevel === 'HIGH';
          const isModRisk = player.injuryRisk?.riskLevel === 'MODERATE';

          return (
            <div
              key={player.id}
              onClick={() => onSelectPlayer(player)}
              className={`rounded-2xl bg-slate-900 border p-4 shadow-lg hover:border-slate-700 transition-all cursor-pointer flex flex-col justify-between ${
                isHighRisk ? 'border-rose-800/50 bg-rose-950/10' : 'border-slate-800'
              }`}
            >
              <div>
                {/* Header: Photo + Jersey + Eligibility */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={player.photoUrl}
                      alt={player.name}
                      className="h-12 w-12 rounded-2xl object-cover ring-2 ring-white/10 shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-white text-sm leading-tight hover:text-cyan-400 transition-colors">
                        {player.name}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className="text-[11px] font-mono text-cyan-400 font-bold">
                          #{player.jerseyNumber}
                        </span>
                        <span className="text-slate-500">•</span>
                        <span className="text-[11px] text-slate-400 truncate max-w-[120px]">
                          {player.teamName}
                        </span>
                      </div>
                    </div>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-bold font-mono tracking-wider ${
                      player.eligibilityStatus === 'VERIFIED'
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : player.eligibilityStatus === 'REJECTED'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                    }`}
                  >
                    {player.eligibilityStatus}
                  </span>
                </div>

                {/* Role / Position */}
                <div className="flex items-center justify-between text-xs text-slate-400 mb-3 pb-2.5 border-b border-slate-800/80">
                  <span>{player.position}</span>
                  <span className="font-mono text-[11px] text-slate-500">{player.playerId}</span>
                </div>

                {/* Match Stats */}
                <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 text-xs">
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono">APP</span>
                    <p className="font-bold text-slate-200 font-mono">{player.matchesPlayed}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono">GOALS</span>
                    <p className="font-bold text-emerald-400 font-mono">{player.goals}</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono">MINS</span>
                    <p className="font-bold text-cyan-400 font-mono">{player.minutesPlayed}&apos;</p>
                  </div>
                  <div>
                    <span className="text-[9px] text-slate-500 font-mono">RATING</span>
                    <p className="font-extrabold text-white font-mono">{player.rating}</p>
                  </div>
                </div>

                {/* Workload / Risk Badge */}
                <div className="flex items-center justify-between text-[11px] pt-1">
                  <div className="flex items-center gap-1.5">
                    <Flame className="h-3.5 w-3.5 text-amber-400" />
                    <span className="text-slate-400">ACWR:</span>
                    <strong className="text-white font-mono">{player.workload?.breakdown.acwr || '1.00'}</strong>
                  </div>

                  <div>
                    {isHighRisk ? (
                      <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold flex items-center gap-1">
                        <span>🔴</span>
                        <span>HIGH RISK</span>
                      </span>
                    ) : isModRisk ? (
                      <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px] flex items-center gap-1">
                        <span>🟡</span>
                        <span>MOD RISK</span>
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px] flex items-center gap-1">
                        <span>🟢</span>
                        <span>LOW RISK</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* View Profile Action Link */}
              <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-[11px] text-slate-500">
                  {player.documents.length} Document(s)
                </span>
                <span className="text-cyan-400 font-medium hover:underline text-[11px]">
                  Full Profile & Documents →
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Detailed Player Profile Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-4">
                <img
                  src={selectedPlayer.photoUrl}
                  alt={selectedPlayer.name}
                  className="h-16 w-16 rounded-2xl object-cover ring-2 ring-cyan-500/40 shadow-lg"
                />
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white font-['Chakra_Petch']">
                      {selectedPlayer.name}
                    </h3>
                    <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-400 font-bold">
                      #{selectedPlayer.jerseyNumber}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedPlayer.position} • {selectedPlayer.teamName} (Age: {selectedPlayer.age})
                  </p>
                  <p className="text-[11px] font-mono text-slate-500 mt-0.5">Player ID: {selectedPlayer.playerId}</p>
                </div>
              </div>
              <button
                onClick={() => onSelectPlayer(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Eligibility & Clearance Status Banner */}
            <div
              className={`p-4 rounded-xl border flex items-center justify-between gap-4 ${
                selectedPlayer.eligibilityStatus === 'VERIFIED'
                  ? 'bg-emerald-950/30 border-emerald-800/40 text-emerald-200'
                  : selectedPlayer.eligibilityStatus === 'REJECTED'
                  ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                  : 'bg-amber-950/30 border-amber-800/40 text-amber-200'
              }`}
            >
              <div className="flex items-center gap-3">
                {selectedPlayer.eligibilityStatus === 'VERIFIED' ? (
                  <ShieldCheck className="h-6 w-6 text-emerald-400 shrink-0" />
                ) : (
                  <ShieldAlert className="h-6 w-6 text-amber-400 shrink-0" />
                )}
                <div>
                  <div className="text-xs font-bold font-mono">
                    ELIGIBILITY STATUS: {selectedPlayer.eligibilityStatus}
                  </div>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    {selectedPlayer.eligibilityStatus === 'VERIFIED'
                      ? 'All academic ID and medical documents verified. Cleared for official tournament matches.'
                      : selectedPlayer.eligibilityStatus === 'REJECTED'
                      ? 'Document rejected. Player is ineligible for match participation.'
                      : 'Pending review by Sports Director before match clearance.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => {
                  onSelectPlayer(null);
                  onNavigate('documents');
                }}
                className="px-3 py-1.5 rounded-lg bg-slate-900/80 hover:bg-slate-900 border border-white/20 text-xs font-medium text-white shrink-0"
              >
                Verification Desk
              </button>
            </div>

            {/* Performance Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono">MATCHES</span>
                <p className="text-xl font-bold text-white font-mono mt-1">{selectedPlayer.matchesPlayed}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono">MINUTES PLAYED</span>
                <p className="text-xl font-bold text-cyan-400 font-mono mt-1">{selectedPlayer.minutesPlayed}&apos;</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono">GOALS</span>
                <p className="text-xl font-bold text-emerald-400 font-mono mt-1">{selectedPlayer.goals}</p>
              </div>
              <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                <span className="text-[10px] text-slate-500 font-mono">ASSISTS</span>
                <p className="text-xl font-bold text-purple-400 font-mono mt-1">{selectedPlayer.assists}</p>
              </div>
            </div>

            {/* Workload & Injury Risk Model */}
            {selectedPlayer.injuryRisk && selectedPlayer.workload && (
              <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
                  <div className="flex items-center gap-2 font-bold text-white font-['Chakra_Petch']">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span>Workload Intelligence (ACWR Engine)</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded font-mono text-[10px] font-bold ${
                      selectedPlayer.injuryRisk.riskLevel === 'HIGH'
                        ? 'bg-rose-500/20 text-rose-300'
                        : selectedPlayer.injuryRisk.riskLevel === 'MODERATE'
                        ? 'bg-amber-500/20 text-amber-300'
                        : 'bg-emerald-500/20 text-emerald-300'
                    }`}
                  >
                    Risk Flag: {selectedPlayer.injuryRisk.riskLevel}
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Acute Load (7d):</span>
                    <p className="text-white font-bold">{selectedPlayer.workload.breakdown.acuteLoadMinutes} mins</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Matches in 48h:</span>
                    <p className="text-white font-bold">{selectedPlayer.workload.breakdown.matchesInLast48h} matches</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">Recovery Gap:</span>
                    <p className="text-white font-bold">{selectedPlayer.workload.breakdown.recoveryGapHours} hours</p>
                  </div>
                  <div className="p-2 rounded-lg bg-slate-900 border border-slate-800">
                    <span className="text-slate-500 text-[10px]">ACWR Ratio:</span>
                    <p className="text-cyan-400 font-bold">{selectedPlayer.workload.breakdown.acwr}</p>
                  </div>
                </div>

                <div className="space-y-1">
                  <span className="text-slate-400 text-[11px] font-medium">Risk Signal Breakdown:</span>
                  <ul className="space-y-1 text-[11px] text-slate-300 list-disc list-inside">
                    {selectedPlayer.injuryRisk.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>

                <p className="text-[10px] text-slate-500 italic pt-1 border-t border-slate-800/80">
                  {selectedPlayer.injuryRisk.disclaimer}
                </p>
              </div>
            )}

            {/* Documents List */}
            <div>
              <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono mb-2">
                Attached Eligibility Documents ({selectedPlayer.documents.length})
              </h4>
              <div className="space-y-2">
                {selectedPlayer.documents.map(doc => (
                  <div
                    key={doc.id}
                    className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <div className="font-medium text-white flex items-center gap-2">
                        <FileCheck className="h-4 w-4 text-cyan-400" />
                        <span>{doc.fileName}</span>
                      </div>
                      <p className="text-[10px] text-slate-400 mt-0.5">
                        Uploaded: {doc.uploadDate} • Type: {doc.documentType} ({doc.fileSize})
                      </p>
                      {doc.notes && <p className="text-[10px] text-amber-300/80 mt-1">Note: {doc.notes}</p>}
                    </div>

                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                        doc.status === 'VERIFIED'
                          ? 'bg-emerald-500/20 text-emerald-400'
                          : doc.status === 'REJECTED'
                          ? 'bg-rose-500/20 text-rose-400'
                          : 'bg-amber-500/20 text-amber-400'
                      }`}
                    >
                      {doc.status}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => onSelectPlayer(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <UserSquare2 className="h-5 w-5 text-cyan-400" />
                <span>Register Athlete / Player</span>
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddPlayer} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Alex Morata"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Assigned Team *</label>
                  <select
                    value={teamId}
                    onChange={e => setTeamId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    {teams.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} ({t.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Jersey Number</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    value={jerseyNumber}
                    onChange={e => setJerseyNumber(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Position</label>
                  <select
                    value={position}
                    onChange={e => setPosition(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Forward / Striker">Forward / Striker</option>
                    <option value="Attacking Midfielder">Attacking Midfielder</option>
                    <option value="Central Midfielder">Central Midfielder</option>
                    <option value="Defensive Midfielder">Defensive Midfielder</option>
                    <option value="Center Back">Center Back</option>
                    <option value="Full Back">Full Back</option>
                    <option value="Goalkeeper">Goalkeeper</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Age</label>
                  <input
                    type="number"
                    min={17}
                    max={30}
                    value={age}
                    onChange={e => setAge(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white font-mono focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Contact Email</label>
                <input
                  type="email"
                  placeholder="student@university.edu"
                  value={contactEmail}
                  onChange={e => setContactEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                ℹ️ Newly added players start with <strong>PENDING</strong> eligibility and require college ID/medical proof verification before match kickoff clearance.
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
                >
                  {isSubmitting ? 'Adding...' : 'Register Player'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
