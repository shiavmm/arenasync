import React, { useState } from 'react';
import {
  Trophy,
  Shield,
  Activity,
  Tv,
  Bell,
  UserCheck,
  RefreshCw,
  ChevronDown,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Radio
} from 'lucide-react';
import { User, Role, SystemAlert } from '../types.js';

interface HeaderProps {
  currentUser: User;
  onSwitchRole: (role: Role) => void;
  onOpenTvMode: () => void;
  alerts: SystemAlert[];
  onMarkAlertRead: (id: string) => void;
  onResetDemo: () => void;
  activeMatchesCount: number;
  onNavigate: (view: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  onSwitchRole,
  onOpenTvMode,
  alerts,
  onMarkAlertRead,
  onResetDemo,
  activeMatchesCount,
  onNavigate
}) => {
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [showAlertMenu, setShowAlertMenu] = useState(false);

  const unreadAlerts = alerts.filter(a => !a.read);

  const roleLabels: Record<Role, { label: string; badge: string; color: string }> = {
    ADMIN: { label: 'Admin / Organizer', badge: 'Full Admin Rights', color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30' },
    REFEREE: { label: 'Match Official / Referee', badge: 'Live Scoring & Reports', color: 'bg-amber-500/20 text-amber-400 border-amber-500/30' },
    COACH: { label: 'Coach / Team Manager', badge: 'Roster & Workload', color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
    PLAYER: { label: 'Athletic Player', badge: 'Personal Stats & Risk', color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
    VIEWER: { label: 'Public Spectator', badge: 'Scores & Standings', color: 'bg-slate-500/20 text-slate-300 border-slate-500/30' }
  };

  return (
    <header className="sticky top-0 z-40 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 lg:px-6 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Project Branding */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-600 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/20 ring-1 ring-white/20">
            <Trophy className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold tracking-tight text-white font-['Chakra_Petch'] text-lg">
                ARENA<span className="text-cyan-400">SYNC</span>
              </span>
              <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded font-mono">
                BIT-57
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Operations • Live Scoring • Workload • Injury Flags
            </p>
          </div>
        </div>

        {/* Live Match Beacon & Quick Actions */}
        <div className="flex items-center gap-2 sm:gap-3">
          {activeMatchesCount > 0 && (
            <button
              onClick={() => onNavigate('live-scoring')}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all text-xs font-medium animate-pulse"
              title="1 Live Match in Progress"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-500"></span>
              </span>
              <span className="font-semibold tracking-wide uppercase text-[11px]">Live Match</span>
            </button>
          )}

          {/* TV Display Mode Button */}
          <button
            onClick={onOpenTvMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700/60 text-xs font-medium transition-colors"
            title="Launch TV Display Mode"
          >
            <Tv className="h-4 w-4 text-cyan-400" />
            <span className="hidden md:inline">TV Mode</span>
          </button>

          {/* Reset Demo State Button */}
          <button
            onClick={onResetDemo}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 border border-slate-700/60 transition-colors"
            title="Reset Database to Pristine Capstone Demo State"
          >
            <RefreshCw className="h-4 w-4" />
          </button>

          {/* Alerts Notification Center */}
          <div className="relative">
            <button
              onClick={() => setShowAlertMenu(!showAlertMenu)}
              className="relative p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700/60 transition-colors"
              title="System Alerts & Warnings"
            >
              <Bell className="h-4 w-4" />
              {unreadAlerts.length > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-rose-500 text-[9px] font-bold text-white flex items-center justify-center animate-bounce">
                  {unreadAlerts.length}
                </span>
              )}
            </button>

            {/* Alerts Dropdown Drawer */}
            {showAlertMenu && (
              <div className="absolute right-0 mt-2 w-80 sm:w-96 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-3 z-50">
                <div className="flex items-center justify-between pb-2 border-b border-slate-800 mb-2">
                  <div className="flex items-center gap-2">
                    <Activity className="h-4 w-4 text-cyan-400" />
                    <span className="text-xs font-semibold text-white uppercase tracking-wider">System Alerts</span>
                  </div>
                  <span className="text-[11px] text-slate-400 font-mono">{unreadAlerts.length} unread</span>
                </div>

                <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                  {alerts.length === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4">No active notifications</p>
                  ) : (
                    alerts.slice(0, 5).map(alert => (
                      <div
                        key={alert.id}
                        className={`p-2.5 rounded-lg border text-xs transition-colors ${
                          alert.severity === 'critical'
                            ? 'bg-rose-950/30 border-rose-800/40 text-rose-200'
                            : alert.severity === 'warning'
                            ? 'bg-amber-950/30 border-amber-800/40 text-amber-200'
                            : 'bg-slate-800/60 border-slate-700 text-slate-300'
                        } ${!alert.read ? 'ring-1 ring-cyan-500/30' : 'opacity-75'}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 font-semibold text-[11px]">
                            {alert.severity === 'critical' ? (
                              <XCircle className="h-3.5 w-3.5 text-rose-400 shrink-0" />
                            ) : alert.severity === 'warning' ? (
                              <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                            ) : (
                              <CheckCircle2 className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                            )}
                            <span>{alert.title}</span>
                          </div>
                          {!alert.read && (
                            <button
                              onClick={() => onMarkAlertRead(alert.id)}
                              className="text-[10px] text-cyan-400 hover:underline shrink-0"
                            >
                              Mark read
                            </button>
                          )}
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-slate-400">{alert.message}</p>
                      </div>
                    ))
                  )}
                </div>

                <div className="pt-2 mt-2 border-t border-slate-800 flex justify-end">
                  <button
                    onClick={() => {
                      onNavigate('alerts');
                      setShowAlertMenu(false);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 font-medium"
                  >
                    View All Notifications →
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Role Switcher & Active User Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-800 border border-slate-700/80 transition-all text-left"
            >
              <img
                src={currentUser.avatarUrl || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100&auto=format&fit=crop&q=80'}
                alt={currentUser.name}
                className="h-7 w-7 rounded-lg object-cover ring-1 ring-cyan-500/40"
              />
              <div className="hidden sm:block">
                <div className="text-xs font-semibold text-white leading-tight flex items-center gap-1.5">
                  <span className="truncate max-w-[110px]">{currentUser.name.split(' ')[0]}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded border font-mono ${roleLabels[currentUser.role].color}`}>
                    {currentUser.role}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 truncate max-w-[130px]">
                  {roleLabels[currentUser.role].label}
                </div>
              </div>
              <ChevronDown className="h-3.5 w-3.5 text-slate-400 ml-1" />
            </button>

            {/* Role Switcher Menu for Capstone Demonstration */}
            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl p-2 z-50">
                <div className="px-3 py-2 border-b border-slate-800 mb-1">
                  <p className="text-[11px] uppercase tracking-wider font-semibold text-slate-400">
                    Capstone Evaluator Role Switcher
                  </p>
                  <p className="text-[10px] text-slate-500 mt-0.5">
                    Switch context instantly to test role-based access control:
                  </p>
                </div>

                {(['ADMIN', 'REFEREE', 'COACH', 'PLAYER', 'VIEWER'] as Role[]).map(role => (
                  <button
                    key={role}
                    onClick={() => {
                      onSwitchRole(role);
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors ${
                      currentUser.role === role ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-left font-medium">{roleLabels[role].label}</div>
                      <div className="text-[10px] text-slate-500 text-left">{roleLabels[role].badge}</div>
                    </div>
                    {currentUser.role === role && <UserCheck className="h-4 w-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
