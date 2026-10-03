import React, { useState } from 'react';
import {
  CalendarDays,
  Sparkles,
  Radio,
  Clock,
  MapPin,
  Shield,
  Trophy,
  ChevronRight,
  Filter,
  CheckCircle2,
  GitBranch,
  List
} from 'lucide-react';
import { Match, MatchStatus, Role } from '../types.js';
import { sportsApi } from '../services/api.js';

interface FixturesViewProps {
  matches: Match[];
  onRefresh: () => void;
  userRole: Role;
  onSelectMatch: (matchId: string) => void;
  onNavigate: (view: string) => void;
}

export const FixturesView: React.FC<FixturesViewProps> = ({
  matches,
  onRefresh,
  userRole,
  onSelectMatch,
  onNavigate
}) => {
  const [activeTab, setActiveTab] = useState<'LIST' | 'BRACKET'>('BRACKET');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  // Generation Modal fields
  const [format, setFormat] = useState('SINGLE_ELIMINATION');
  const [venue, setVenue] = useState('Campus Olympic Stadium');

  const filteredMatches = matches.filter(m => {
    if (statusFilter === 'ALL') return true;
    return m.status === statusFilter;
  });

  const handleGenerateFixtures = async () => {
    setIsGenerating(true);
    try {
      await sportsApi.generateFixtures({
        format,
        venue
      });
      setShowGenerateModal(false);
      onRefresh();
    } catch (err: any) {
      alert(err.message || 'Failed to generate fixtures');
    } finally {
      setIsGenerating(false);
    }
  };

  // Group matches for bracket view
  const qfMatches = matches.filter(m => m.roundIndex === 1);
  const sfMatches = matches.filter(m => m.roundIndex === 2);
  const finalMatch = matches.find(m => m.roundIndex === 3);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <CalendarDays className="h-6 w-6 text-cyan-400" />
            <span>Fixtures & Tournament Bracket</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated knockout pairing algorithm, referee assignments, and dynamic winner advancement.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {/* View Toggle */}
          <div className="flex items-center bg-slate-900 p-1 rounded-xl border border-slate-800 text-xs">
            <button
              onClick={() => setActiveTab('BRACKET')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'BRACKET' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitBranch className="h-3.5 w-3.5" />
              <span>Interactive Bracket</span>
            </button>
            <button
              onClick={() => setActiveTab('LIST')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition-all ${
                activeTab === 'LIST' ? 'bg-cyan-600 text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              <List className="h-3.5 w-3.5" />
              <span>List View</span>
            </button>
          </div>

          {userRole === 'ADMIN' && (
            <button
              onClick={() => setShowGenerateModal(true)}
              className="px-3.5 py-2 rounded-xl bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-semibold text-xs shadow-lg shadow-cyan-600/20 transition-all flex items-center gap-1.5"
            >
              <Sparkles className="h-4 w-4 text-cyan-200" />
              <span>Generate Fixtures</span>
            </button>
          )}
        </div>
      </div>

      {/* Bracket View */}
      {activeTab === 'BRACKET' && (
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-xl overflow-x-auto">
          <div className="min-w-[840px]">
            <div className="grid grid-cols-3 gap-8 pb-4 text-center border-b border-slate-800 font-mono text-xs font-bold text-slate-400">
              <div className="flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-cyan-400" />
                <span>QUARTER-FINALS (ROUND 1)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-blue-400" />
                <span>SEMI-FINALS (ROUND 2)</span>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="h-2 w-2 rounded-full bg-amber-400" />
                <span>CHAMPIONSHIP FINAL</span>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-8 pt-6 items-center">
              {/* Quarterfinals Column */}
              <div className="space-y-6">
                {qfMatches.map((match, idx) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    onSelectMatch={onSelectMatch}
                    onNavigate={onNavigate}
                    userRole={userRole}
                  />
                ))}
              </div>

              {/* Semifinals Column */}
              <div className="space-y-24">
                {sfMatches.map((match, idx) => (
                  <BracketMatchCard
                    key={match.id}
                    match={match}
                    onSelectMatch={onSelectMatch}
                    onNavigate={onNavigate}
                    userRole={userRole}
                  />
                ))}
              </div>

              {/* Final Column */}
              <div className="space-y-6">
                {finalMatch ? (
                  <div className="p-1 rounded-2xl bg-gradient-to-b from-amber-500/30 to-slate-900">
                    <BracketMatchCard
                      match={finalMatch}
                      isFinal
                      onSelectMatch={onSelectMatch}
                      onNavigate={onNavigate}
                      userRole={userRole}
                    />
                  </div>
                ) : (
                  <div className="p-6 rounded-xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    Championship Match pending semifinal results
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* List View */}
      {activeTab === 'LIST' && (
        <div className="space-y-4">
          {/* Filter pills */}
          <div className="flex items-center gap-2 text-xs">
            {['ALL', 'SCHEDULED', 'LIVE', 'COMPLETED'].map(st => (
              <button
                key={st}
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                  statusFilter === st ? 'bg-cyan-600 text-white shadow-sm' : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
                }`}
              >
                {st}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredMatches.map(match => (
              <div
                key={match.id}
                className="rounded-2xl bg-slate-900 border border-slate-800 p-5 shadow-lg hover:border-slate-700 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-cyan-400 uppercase">
                        {match.roundName}
                      </span>
                      <span className="text-slate-600">•</span>
                      <span className="text-[11px] text-slate-400">{match.tournamentName}</span>
                    </div>

                    <span
                      className={`px-2.5 py-0.5 rounded text-[10px] font-bold font-mono ${
                        match.status === 'LIVE'
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40 animate-pulse'
                          : match.status === 'COMPLETED'
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                          : 'bg-slate-800 text-slate-300 border border-slate-700'
                      }`}
                    >
                      {match.status}
                    </span>
                  </div>

                  {/* Teams vs Score */}
                  <div className="space-y-2.5 py-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={match.homeTeamLogo}
                          alt={match.homeTeamName}
                          className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <span className={`text-sm font-semibold ${match.winnerTeamId === match.homeTeamId ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                          {match.homeTeamName}
                        </span>
                      </div>
                      <span className="text-lg font-bold font-mono text-white">
                        {match.status === 'SCHEDULED' ? '-' : match.homeScore}
                      </span>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <img
                          src={match.awayTeamLogo}
                          alt={match.awayTeamName}
                          className="h-7 w-7 rounded-lg object-cover ring-1 ring-white/10"
                        />
                        <span className={`text-sm font-semibold ${match.winnerTeamId === match.awayTeamId ? 'text-cyan-300 font-bold' : 'text-slate-200'}`}>
                          {match.awayTeamName}
                        </span>
                      </div>
                      <span className="text-lg font-bold font-mono text-white">
                        {match.status === 'SCHEDULED' ? '-' : match.awayScore}
                      </span>
                    </div>
                  </div>

                  {/* Venue & Referee */}
                  <div className="pt-3 border-t border-slate-800/80 mt-3 text-xs text-slate-400 space-y-1">
                    <div className="flex items-center gap-1.5">
                      <Clock className="h-3.5 w-3.5 text-slate-500" />
                      <span>{match.date} • {match.time}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5 text-slate-500" />
                      <span className="truncate">{match.venue}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Shield className="h-3.5 w-3.5 text-amber-500" />
                      <span>Referee: <strong className="text-slate-200">{match.refereeName}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="pt-4 mt-3 border-t border-slate-800 flex items-center justify-end gap-2">
                  <button
                    onClick={() => {
                      onSelectMatch(match.id);
                      onNavigate('referee-console');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Referee Whistle
                  </button>
                  <button
                    onClick={() => {
                      onSelectMatch(match.id);
                      onNavigate('live-scoring');
                    }}
                    className="px-3.5 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold shadow-md transition-all"
                  >
                    Scoring Studio →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Generate Fixtures Modal */}
      {showGenerateModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 border border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="text-base font-bold text-white font-['Chakra_Petch'] flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-cyan-400" />
                <span>Automatic Fixture Generation</span>
              </h3>
              <button onClick={() => setShowGenerateModal(false)} className="text-slate-400 hover:text-white text-sm">
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-300 leading-relaxed">
                The algorithm automatically seeds registered teams, calculates quarter-final, semi-final, and championship pairings, and provisions referee assignments.
              </p>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Bracket Structure</label>
                <select
                  value={format}
                  onChange={e => setFormat(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="SINGLE_ELIMINATION">Single Elimination Knockout (Standard)</option>
                  <option value="ROUND_ROBIN">Round Robin League</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-300 font-medium mb-1">Tournament Venue</label>
                <input
                  type="text"
                  value={venue}
                  onChange={e => setVenue(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-white focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div className="p-3 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-[11px] text-cyan-300">
                ✨ Generating new fixtures links next match parent slots so winners automatically advance dynamically upon match completion.
              </div>
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                onClick={() => setShowGenerateModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateFixtures}
                disabled={isGenerating}
                className="px-4 py-2 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs shadow-lg shadow-cyan-600/30 transition-all"
              >
                {isGenerating ? 'Generating Brackets...' : 'Generate Brackets'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

interface BracketMatchCardProps {
  match: Match;
  isFinal?: boolean;
  onSelectMatch: (id: string) => void;
  onNavigate: (view: string) => void;
  userRole: Role;
}

const BracketMatchCard: React.FC<BracketMatchCardProps> = ({
  match,
  isFinal,
  onSelectMatch,
  onNavigate
}) => {
  const isLive = match.status === 'LIVE';
  const isCompleted = match.status === 'COMPLETED';

  return (
    <div
      onClick={() => {
        onSelectMatch(match.id);
        onNavigate(isLive ? 'live-scoring' : 'referee-console');
      }}
      className={`rounded-xl bg-slate-950/90 border p-3 shadow-md hover:border-cyan-500/50 transition-all cursor-pointer ${
        isFinal
          ? 'border-amber-500/50 shadow-amber-500/10'
          : isLive
          ? 'border-rose-500/60 shadow-rose-500/10 animate-pulse'
          : 'border-slate-800'
      }`}
    >
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-2">
        <span className="font-semibold text-cyan-400">{match.roundName}</span>
        <span
          className={`px-1.5 py-0.2 rounded font-bold ${
            isLive
              ? 'bg-rose-500 text-white'
              : isCompleted
              ? 'bg-emerald-500/20 text-emerald-400'
              : 'bg-slate-800 text-slate-400'
          }`}
        >
          {match.status}
        </span>
      </div>

      <div className="space-y-1.5">
        <div
          className={`flex items-center justify-between p-1.5 rounded-lg text-xs ${
            match.winnerTeamId === match.homeTeamId
              ? 'bg-cyan-950/40 text-cyan-300 font-bold ring-1 ring-cyan-500/30'
              : 'text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <img src={match.homeTeamLogo} alt="" className="h-4 w-4 rounded object-cover" />
            <span className="truncate">{match.homeTeamName}</span>
          </div>
          <span className="font-mono font-bold text-white text-xs">{match.homeScore}</span>
        </div>

        <div
          className={`flex items-center justify-between p-1.5 rounded-lg text-xs ${
            match.winnerTeamId === match.awayTeamId
              ? 'bg-cyan-950/40 text-cyan-300 font-bold ring-1 ring-cyan-500/30'
              : 'text-slate-300'
          }`}
        >
          <div className="flex items-center gap-2 truncate">
            <img src={match.awayTeamLogo} alt="" className="h-4 w-4 rounded object-cover" />
            <span className="truncate">{match.awayTeamName}</span>
          </div>
          <span className="font-mono font-bold text-white text-xs">{match.awayScore}</span>
        </div>
      </div>

      <div className="mt-2 pt-1.5 border-t border-slate-900 flex items-center justify-between text-[10px] text-slate-500">
        <span className="truncate">{match.refereeName}</span>
        <span className="text-cyan-400 hover:underline">Launch →</span>
      </div>
    </div>
  );
};
