import React from 'react';
import {
  LayoutDashboard,
  Trophy,
  Users2,
  UserSquare2,
  FileCheck,
  CalendarDays,
  Megaphone,
  Radio,
  Tv,
  BarChart3,
  Flame,
  AlertOctagon,
  Bell,
  FileText,
  Terminal,
  ShieldAlert
} from 'lucide-react';
import { Role } from '../types.js';

interface SidebarProps {
  currentView: string;
  onNavigate: (view: string) => void;
  userRole: Role;
  unreadAlertsCount: number;
  liveMatchesCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  userRole,
  unreadAlertsCount,
  liveMatchesCount
}) => {
  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, category: 'CORE' },
    { id: 'tournaments', label: 'Tournaments', icon: Trophy, category: 'OPERATIONS' },
    { id: 'teams', label: 'Teams', icon: Users2, category: 'OPERATIONS' },
    { id: 'players', label: 'Players', icon: UserSquare2, category: 'OPERATIONS' },
    { id: 'documents', label: 'Eligibility Docs', icon: FileCheck, category: 'OPERATIONS' },
    { id: 'fixtures', label: 'Fixtures & Brackets', icon: CalendarDays, category: 'MATCHES' },
    {
      id: 'referee-console',
      label: 'Referee Console',
      icon: Megaphone,
      category: 'MATCHES',
      badge: userRole === 'REFEREE' ? 'Assigned' : undefined,
      badgeColor: 'bg-amber-500/20 text-amber-400'
    },
    {
      id: 'live-scoring',
      label: 'Live Scoring',
      icon: Radio,
      category: 'MATCHES',
      badge: liveMatchesCount > 0 ? `${liveMatchesCount} LIVE` : undefined,
      badgeColor: 'bg-rose-500/20 text-rose-400 animate-pulse'
    },
    { id: 'tv-display', label: 'TV / Display Mode', icon: Tv, category: 'MATCHES' },
    { id: 'standings', label: 'Standings', icon: Trophy, category: 'METRICS' },
    { id: 'analytics', label: 'Performance Analytics', icon: BarChart3, category: 'METRICS' },
    { id: 'workload', label: 'Workload & ACWR', icon: Flame, category: 'INTELLIGENCE' },
    {
      id: 'injury-flags',
      label: 'Injury-Risk Flags',
      icon: AlertOctagon,
      category: 'INTELLIGENCE',
      badge: 'Workload Signals',
      badgeColor: 'bg-rose-500/10 text-rose-400'
    },
    {
      id: 'alerts',
      label: 'Alerts',
      icon: Bell,
      category: 'INTELLIGENCE',
      badge: unreadAlertsCount > 0 ? `${unreadAlertsCount}` : undefined,
      badgeColor: 'bg-rose-500 text-white'
    },
    { id: 'audit-logs', label: 'Audit Logs', icon: FileText, category: 'GOVERNANCE', adminOnly: true },
    { id: 'capstone-specs', label: 'BIT-57 Capstone / API', icon: Terminal, category: 'GOVERNANCE' }
  ];

  const categories = ['CORE', 'OPERATIONS', 'MATCHES', 'METRICS', 'INTELLIGENCE', 'GOVERNANCE'];

  return (
    <aside className="w-64 shrink-0 bg-slate-900 border-r border-slate-800 flex flex-col min-h-[calc(100vh-61px)]">
      <div className="flex-1 py-4 px-3 space-y-6 overflow-y-auto">
        {categories.map(category => {
          const items = navItems.filter(item => {
            if (item.category !== category) return false;
            if (item.adminOnly && userRole !== 'ADMIN') return false;
            return true;
          });

          if (items.length === 0) return null;

          return (
            <div key={category} className="space-y-1">
              <h3 className="px-3 text-[10px] font-semibold text-slate-500 uppercase tracking-wider font-mono">
                {category}
              </h3>
              <div className="space-y-0.5">
                {items.map(item => {
                  const Icon = item.icon;
                  const isActive = currentView === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => onNavigate(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition-all group ${
                        isActive
                          ? 'bg-gradient-to-r from-cyan-500/20 to-blue-500/10 text-cyan-300 border border-cyan-500/30 shadow-sm'
                          : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon
                          className={`h-4 w-4 transition-colors ${
                            isActive ? 'text-cyan-400' : 'text-slate-500 group-hover:text-slate-300'
                          }`}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-medium ${item.badgeColor}`}>
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {/* Capstone BIT-57 System Badge */}
      <div className="p-3 border-t border-slate-800/80 bg-slate-950/40">
        <div className="rounded-xl p-2.5 bg-slate-800/60 border border-slate-700/60 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-semibold text-slate-200 text-[11px]">B.Sc. IT Capstone</span>
            <span className="text-[10px] text-cyan-400 font-mono font-bold">BIT-57</span>
          </div>
          <p className="text-[10px] text-slate-400 mt-1 leading-snug">
            ArenaSync Sports Management Engine
          </p>
        </div>
      </div>
    </aside>
  );
};
