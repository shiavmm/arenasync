import React, { useState } from 'react';
import {
  Users2,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Mail,
  MapPin,
  Trophy,
  Activity,
  Shield,
  Search,
  ExternalLink,
  ChevronRight,
  UserCheck,
  X
} from 'lucide-react';
import { Team, Player, Role } from '../types.js';
import { sportsApi } from '../services/api.js';

interface TeamsViewProps {
  teams: Team[];
  players: Player[];
  onRefresh: () => void;
  userRole: Role;
  onNavigate: (view: string) => void;
  onSelectPlayer: (player: Player) => void;
}

export const TeamsView: React.FC<TeamsViewProps> = ({
  teams,
  players,
  onRefresh,
  userRole,
  onNavigate,
  onSelectPlayer
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTeam, setSelectedTeam] = useState<Team | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [deletingTeam, setDeletingTeam] = useState<Team | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State for Add / Edit
  const [name, setName] = useState('');
  const [code, setCode] = useState('');
  const [coachName, setCoachName] = useState('');
  const [coachEmail, setCoachEmail] = useState('');
  const [homeVenue, setHomeVenue] = useState('Campus Sports Ground');
  const [primaryColor, setPrimaryColor] = useState('#2563eb');

  const filteredTeams = teams.filter(
    t =>
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.coachName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const openAddModal = () => {
    setName('');
    setCode('');
    setCoachName('');
    setCoachEmail('');
    setHomeVenue('Campus Sports Ground');
    setPrimaryColor('#2563eb');
    setErrorMsg('');
    setShowAddModal(true);
  };

  const openEditModal = (team: Team) => {
    setEditingTeam(team);
    setName(team.name);
    setCode(team.code);
    setCoachName(team.coachName || '');
    setCoachEmail(team.coachEmail || '');
    setHomeVenue(team.homeVenue || 'Campus Sports Ground');
    setPrimaryColor(team.primaryColor || '#2563eb');
    setErrorMsg('');
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !code.trim()) {
      setErrorMsg('Team name and 3-letter code are required');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await sportsApi.createTeam({
        name: name.trim(),
        code: code.trim().toUpperCase(),
        coachName: coachName.trim(),
        coachEmail: coachEmail.trim(),
        homeVenue: homeVenue.trim(),
        primaryColor
      });
      setShowAddModal(false);
      setName('');
      setCode('');
      setCoachName('');
      setCoachEmail('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to register team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingTeam) return;
    if (!name.trim() || !code.trim()) {
      setErrorMsg('Team name and code are required');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await sportsApi.updateTeam(editingTeam.id, {
        name: name.trim(),
        code: code.trim().toUpperCase(),
        coachName: coachName.trim(),
        coachEmail: coachEmail.trim(),
        homeVenue: homeVenue.trim(),
        primaryColor
      });
      setEditingTeam(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to update team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteTeam = async () => {
    if (!deletingTeam) return;
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await sportsApi.deleteTeam(deletingTeam.id);
      setDeletingTeam(null);
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to soft-delete team');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getTeamRoster = (teamId: string) => {
    return players.filter(p => p.teamId === teamId && p.status !== 'INACTIVE');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <Users2 className="h-6 w-6 text-cyan-400" />
            <span>Team Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Registered collegiate franchises, coach profiles, squad rosters, and season records.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="h-4 w-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search team or code..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="pl-9 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 w-48 sm:w-60"
            />
          </div>

          {userRole === 'ADMIN' && (
            <button
              onClick={openAddModal}
              className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              <span>Register Team</span>
            </button>
          )}
        </div>
      </div>

      {/* Teams Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {filteredTeams.map(team => {
          const roster = getTeamRoster(team.id);
          return (
            <div
              key={team.id}
              className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
            >
              <div>
                {/* Crest + Code + Actions */}
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    <img
                      src={team.logoUrl}
                      alt={team.name}
                      className="h-12 w-12 rounded-xl object-cover ring-2 ring-white/10 shadow-md"
                    />
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug">{team.name}</h3>
                      <span className="text-[11px] font-mono text-cyan-400 font-bold tracking-wider">
                        {team.code}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-3 w-3 rounded-full border border-slate-700 shrink-0"
                      style={{ backgroundColor: team.primaryColor }}
                      title={`Team Color: ${team.primaryColor}`}
                    />
                    {userRole === 'ADMIN' && (
                      <div className="flex items-center gap-1 ml-1">
                        <button
                          onClick={() => openEditModal(team)}
                          title="Edit Team"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-cyan-600/30 hover:text-cyan-400 text-slate-400 transition-colors"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setErrorMsg('');
                            setDeletingTeam(team);
                          }}
                          title="Delete Team"
                          className="p-1.5 rounded-lg bg-slate-800 hover:bg-rose-600/30 hover:text-rose-400 text-slate-400 transition-colors"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Coach & Venue */}
                <div className="space-y-1 text-xs text-slate-400 mb-4 pb-3 border-b border-slate-800/80">
                  <div className="flex items-center gap-1.5 truncate">
                    <Shield className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span>Coach: <strong className="text-slate-200">{team.coachName}</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5 truncate text-[11px]">
                    <MapPin className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    <span className="truncate">{team.homeVenue}</span>
                  </div>
                </div>

                {/* Team Statistics Grid */}
                <div className="grid grid-cols-4 gap-1 text-center py-2 bg-slate-950/60 rounded-xl border border-slate-800/80 mb-3 text-xs">
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">P</span>
                    <p className="font-bold text-slate-200 font-mono">{team.matchesPlayed}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">W</span>
                    <p className="font-bold text-emerald-400 font-mono">{team.wins}</p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">GD</span>
                    <p className="font-bold text-cyan-400 font-mono">
                      {team.goalDifference > 0 ? `+${team.goalDifference}` : team.goalDifference}
                    </p>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-500 font-mono">PTS</span>
                    <p className="font-extrabold text-white font-mono">{team.points}</p>
                  </div>
                </div>

                {/* Recent Form */}
                <div className="flex items-center justify-between text-[11px] mb-4">
                  <span className="text-slate-500 font-mono">Recent Form:</span>
                  <div className="flex items-center gap-1">
                    {team.recentForm && team.recentForm.slice(-4).map((f, i) => (
                      <span
                        key={i}
                        className={`h-4 w-4 rounded text-[9px] font-bold flex items-center justify-center text-white font-mono ${
                          f === 'W' ? 'bg-emerald-600' : f === 'D' ? 'bg-amber-600' : 'bg-rose-600'
                        }`}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Roster trigger button */}
              <button
                onClick={() => setSelectedTeam(team)}
                className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View Roster ({roster.length} Players)</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Team Roster Modal */}
      {selectedTeam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <img
                  src={selectedTeam.logoUrl}
                  alt={selectedTeam.name}
                  className="h-10 w-10 rounded-xl object-cover ring-1 ring-white/10"
                />
                <div>
                  <h3 className="text-base font-bold text-white font-['Chakra_Petch']">
                    {selectedTeam.name} Squad Roster
                  </h3>
                  <p className="text-xs text-slate-400">Head Coach: {selectedTeam.coachName} • {selectedTeam.coachEmail}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedTeam(null)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {/* Roster Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400 font-mono text-[11px]">
                    <th className="pb-2">#</th>
                    <th className="pb-2">Player</th>
                    <th className="pb-2">Position</th>
                    <th className="pb-2 text-center">Eligibility</th>
                    <th className="pb-2 text-center">Goals</th>
                    <th className="pb-2 text-center">Minutes</th>
                    <th className="pb-2 text-center">Risk Flag</th>
                    <th className="pb-2 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {getTeamRoster(selectedTeam.id).length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-6 text-center text-slate-500">
                        No active players registered yet for this team.
                      </td>
                    </tr>
                  ) : (
                    getTeamRoster(selectedTeam.id).map(player => (
                      <tr key={player.id} className="hover:bg-slate-800/40">
                        <td className="py-2.5 font-mono text-cyan-400 font-bold">#{player.jerseyNumber}</td>
                        <td className="py-2.5">
                          <div className="flex items-center gap-2">
                            <img
                              src={player.photoUrl}
                              alt={player.name}
                              className="h-6 w-6 rounded-full object-cover"
                            />
                            <span className="font-medium text-white">{player.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 text-slate-400">{player.position}</td>
                        <td className="py-2.5 text-center">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                              player.eligibilityStatus === 'VERIFIED'
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : player.eligibilityStatus === 'REJECTED'
                                ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            }`}
                          >
                            {player.eligibilityStatus}
                          </span>
                        </td>
                        <td className="py-2.5 text-center font-mono font-bold text-white">{player.goals}</td>
                        <td className="py-2.5 text-center font-mono text-slate-400">{player.minutesPlayed}&apos;</td>
                        <td className="py-2.5 text-center">
                          {player.injuryRisk?.riskLevel === 'HIGH' ? (
                            <span className="px-1.5 py-0.5 rounded bg-rose-500/20 text-rose-300 font-mono text-[10px] font-bold">
                              🔴 HIGH
                            </span>
                          ) : player.injuryRisk?.riskLevel === 'MODERATE' ? (
                            <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-mono text-[10px]">
                              🟡 MOD
                            </span>
                          ) : (
                            <span className="px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 font-mono text-[10px]">
                              🟢 LOW
                            </span>
                          )}
                        </td>
                        <td className="py-2.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedTeam(null);
                              onSelectPlayer(player);
                              onNavigate('players');
                            }}
                            className="text-cyan-400 hover:text-cyan-300 font-medium text-[11px]"
                          >
                            Profile →
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end">
              <button
                onClick={() => setSelectedTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
              >
                Close Roster
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Team Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <Users2 className="h-5 w-5 text-cyan-400" />
                <span>Register New Franchise / Team</span>
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

            <form onSubmit={handleCreateTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., Solar United"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">3-Letter Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    placeholder="SLU"
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                    />
                    <span className="text-[11px] font-mono text-slate-400">{primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coach Name</label>
                  <input
                    type="text"
                    placeholder="e.g., Marco Santos"
                    value={coachName}
                    onChange={e => setCoachName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coach Email</label>
                  <input
                    type="email"
                    placeholder="coach@sports.edu"
                    value={coachEmail}
                    onChange={e => setCoachEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Home Venue</label>
                <input
                  type="text"
                  value={homeVenue}
                  onChange={e => setHomeVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
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
                  {isSubmitting ? 'Registering...' : 'Register Team'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {editingTeam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <Edit2 className="h-5 w-5 text-cyan-400" />
                <span>Edit Team: {editingTeam.name}</span>
              </h3>
              <button onClick={() => setEditingTeam(null)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleUpdateTeam} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Team Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Code *</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={code}
                    onChange={e => setCode(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white uppercase font-mono placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Primary Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={primaryColor}
                      onChange={e => setPrimaryColor(e.target.value)}
                      className="h-9 w-12 rounded-lg bg-transparent cursor-pointer border border-slate-700"
                    />
                    <span className="text-[11px] font-mono text-slate-400">{primaryColor}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coach Name</label>
                  <input
                    type="text"
                    value={coachName}
                    onChange={e => setCoachName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Coach Email</label>
                  <input
                    type="email"
                    value={coachEmail}
                    onChange={e => setCoachEmail(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Home Venue</label>
                <input
                  type="text"
                  value={homeVenue}
                  onChange={e => setHomeVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setEditingTeam(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Team Confirmation Dialog */}
      {deletingTeam && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-rose-800/60 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3 text-rose-400">
              <AlertTriangle className="h-6 w-6 shrink-0" />
              <h3 className="text-base font-bold text-white font-['Chakra_Petch']">
                Confirm Soft-Delete Team
              </h3>
            </div>

            <p className="text-xs text-slate-300">
              Are you sure you want to deactivate <strong className="text-white">{deletingTeam.name} ({deletingTeam.code})</strong>?
              This team will be marked as <span className="font-mono text-amber-400 font-bold">INACTIVE</span>. Past match records and audit logs will remain intact.
            </p>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-800 text-xs text-rose-200">
                ⚠️ {errorMsg}
              </div>
            )}

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setDeletingTeam(null)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteTeam}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-rose-600/30 transition-all flex items-center gap-2"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isSubmitting ? 'Deleting...' : 'Confirm Soft Delete'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
