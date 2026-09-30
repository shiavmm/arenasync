import React, { useState } from 'react';
import {
  Trophy,
  Plus,
  Calendar,
  MapPin,
  Users2,
  FileText,
  CheckCircle,
  Clock,
  Sparkles,
  Trash2
} from 'lucide-react';
import { Tournament, TournamentFormat, Role } from '../types.js';
import { sportsApi } from '../services/api.js';

interface TournamentsViewProps {
  tournaments: Tournament[];
  onRefresh: () => void;
  userRole: Role;
  onNavigate: (view: string) => void;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({
  tournaments,
  onRefresh,
  userRole,
  onNavigate
}) => {
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Form State
  const [name, setName] = useState('');
  const [sport, setSport] = useState('Football / Soccer');
  const [format, setFormat] = useState<TournamentFormat>('SINGLE_ELIMINATION');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-15');
  const [venue, setVenue] = useState('Grand University Olympic Stadium & Complex');
  const [numTeams, setNumTeams] = useState(8);
  const [rules, setRules] = useState('Official standard championship rules. Knockout bracket with sudden death overtime in playoffs.');

  const handleDelete = async (id: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete the tournament "${name}"? This action cannot be undone.`)) {
      try {
        await sportsApi.deleteTournament(id);
        onRefresh();
      } catch (err: any) {
        alert(err.message || 'Failed to delete tournament');
      }
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Tournament name is required');
      return;
    }
    setErrorMsg('');
    setIsSubmitting(true);
    try {
      await sportsApi.createTournament({
        name,
        sport,
        format,
        startDate,
        endDate,
        venue,
        numTeams: Number(numTeams),
        rules
      });
      setShowCreateModal(false);
      setName('');
      onRefresh();
    } catch (err: any) {
      setErrorMsg(err.message || 'Failed to create tournament');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <Trophy className="h-6 w-6 text-cyan-400" />
            <span>Tournament Management</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure tournament types, seeding rules, bracket structures, and schedules.
          </p>
        </div>

        {userRole === 'ADMIN' && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all flex items-center gap-2 self-start sm:self-auto"
          >
            <Plus className="h-4 w-4" />
            <span>Create Tournament</span>
          </button>
        )}
      </div>

      {/* Tournaments Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {tournaments.map(tour => (
          <div
            key={tour.id}
            className="rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden shadow-xl hover:border-slate-700 transition-all flex flex-col"
          >
            {/* Banner */}
            <div className="relative h-40 overflow-hidden">
              <img
                src={tour.bannerUrl || 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=1200&auto=format&fit=crop&q=80'}
                alt={tour.name}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/50 to-transparent" />
              <div className="absolute top-3 right-3">
                <span
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wider font-mono uppercase ${
                    tour.status === 'IN_PROGRESS'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : tour.status === 'COMPLETED'
                      ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                      : 'bg-slate-700/60 text-slate-300'
                  }`}
                >
                  {tour.status.replace('_', ' ')}
                </span>
              </div>
              <div className="absolute bottom-3 left-4 right-4">
                <span className="text-[10px] font-mono text-cyan-400 font-semibold uppercase tracking-wider">
                  {tour.sport}
                </span>
                <h3 className="text-lg font-bold text-white font-['Chakra_Petch'] leading-tight">
                  {tour.name}
                </h3>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
              <div className="space-y-2 text-xs text-slate-300">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    {tour.startDate} to {tour.endDate}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
                  <span className="truncate">{tour.venue}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users2 className="h-4 w-4 text-slate-400 shrink-0" />
                  <span>
                    Format: <strong className="text-cyan-400 font-mono">{tour.format.replace('_', ' ')}</strong> ({tour.numTeams} Teams)
                  </span>
                </div>
                <div className="flex items-start gap-2 pt-1">
                  <FileText className="h-4 w-4 text-slate-400 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">{tour.rules}</p>
                </div>
              </div>

              {/* Tournament Actions */}
              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <div className="text-[11px] font-mono text-slate-500">
                  ID: {tour.id}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => onNavigate('standings')}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium transition-colors"
                  >
                    Standings
                  </button>
                  <button
                    onClick={() => onNavigate('fixtures')}
                    className="px-3 py-1.5 rounded-lg bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-semibold transition-colors"
                  >
                    View Brackets
                  </button>
                  {userRole === 'ADMIN' && (
                    <button
                      onClick={() => handleDelete(tour.id, tour.name)}
                      className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-500 border border-rose-500/20 transition-colors ml-1"
                      title="Delete Tournament"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-lg rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <Trophy className="h-5 w-5 text-cyan-400" />
                <span>Create New Tournament</span>
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white text-sm"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-2.5 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block text-slate-300 font-medium mb-1">Tournament Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g., University Winter Cup 2026"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Sport</label>
                  <select
                    value={sport}
                    onChange={e => setSport(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="Football / Soccer">Football / Soccer</option>
                    <option value="Basketball">Basketball</option>
                    <option value="Futsal">Futsal</option>
                    <option value="Volleyball">Volleyball</option>
                    <option value="Cricket">Cricket</option>
                  </select>
                </div>

                <div>
                  <label className="block text-slate-300 font-medium mb-1">Tournament Format</label>
                  <select
                    value={format}
                    onChange={e => setFormat(e.target.value as TournamentFormat)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="SINGLE_ELIMINATION">Single Elimination (Knockout)</option>
                    <option value="ROUND_ROBIN">Round Robin</option>
                    <option value="GROUP_KNOCKOUT">Group Stage + Knockout</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-medium mb-1">Start Date</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={e => setStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-medium mb-1">End Date</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={e => setEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Primary Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Number of Participating Teams</label>
                <select
                  value={numTeams}
                  onChange={e => setNumTeams(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value={4}>4 Teams</option>
                  <option value={8}>8 Teams (Standard Bracket)</option>
                  <option value={16}>16 Teams</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Rules & Regulations</label>
                <textarea
                  rows={2}
                  value={rules}
                  onChange={e => setRules(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500 text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
                >
                  {isSubmitting ? 'Creating...' : 'Launch Tournament'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
