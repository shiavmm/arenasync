import React, { useState } from 'react';
import {
  Bell,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Clock,
  Filter,
  CheckCheck
} from 'lucide-react';
import { SystemAlert } from '../types.js';

interface AlertsViewProps {
  alerts: SystemAlert[];
  onMarkAlertRead: (id: string) => void;
  onMarkAllRead: () => void;
  onNavigate: (view: string) => void;
}

export const AlertsView: React.FC<AlertsViewProps> = ({
  alerts,
  onMarkAlertRead,
  onMarkAllRead,
  onNavigate
}) => {
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');

  const filteredAlerts = alerts.filter(a => {
    if (severityFilter === 'ALL') return true;
    if (severityFilter === 'UNREAD') return !a.read;
    return a.severity === severityFilter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl lg:text-2xl font-bold text-white tracking-tight font-['Chakra_Petch'] flex items-center gap-2.5">
            <Bell className="h-6 w-6 text-cyan-400" />
            <span>Operational Alerts & Event Notifications</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Automated alerts for missing documents, high injury-risk flags, match start triggers, and fixture changes.
          </p>
        </div>

        <button
          onClick={onMarkAllRead}
          className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-medium transition-colors flex items-center gap-1.5 self-start sm:self-auto"
        >
          <CheckCheck className="h-4 w-4 text-cyan-400" />
          <span>Mark All as Read</span>
        </button>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 bg-slate-900 p-1.5 rounded-2xl border border-slate-800 text-xs w-fit">
        {['ALL', 'UNREAD', 'critical', 'warning', 'info'].map(sev => (
          <button
            key={sev}
            onClick={() => setSeverityFilter(sev)}
            className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
              severityFilter === sev
                ? 'bg-cyan-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {sev === 'critical' ? '🔴 Critical' : sev === 'warning' ? '🟡 Warning' : sev === 'info' ? '🔵 Info' : sev}
          </button>
        ))}
      </div>

      {/* Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-2xl bg-slate-900 border border-slate-800 text-center text-slate-500 text-xs">
            No alerts matching your filter criteria.
          </div>
        ) : (
          filteredAlerts.map(alert => (
            <div
              key={alert.id}
              className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                alert.severity === 'critical'
                  ? 'bg-rose-950/20 border-rose-800/40 text-rose-200'
                  : alert.severity === 'warning'
                  ? 'bg-amber-950/20 border-amber-800/40 text-amber-200'
                  : 'bg-slate-900 border-slate-800 text-slate-300'
              } ${!alert.read ? 'ring-1 ring-cyan-500/40' : 'opacity-75'}`}
            >
              <div className="flex items-start gap-3.5">
                <div className="mt-0.5 shrink-0">
                  {alert.severity === 'critical' ? (
                    <XCircle className="h-5 w-5 text-rose-400" />
                  ) : alert.severity === 'warning' ? (
                    <AlertTriangle className="h-5 w-5 text-amber-400" />
                  ) : (
                    <CheckCircle2 className="h-5 w-5 text-cyan-400" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-white text-sm">{alert.title}</span>
                    <span className="px-2 py-0.2 rounded text-[9px] font-mono uppercase bg-slate-800/80 border border-slate-700 text-slate-300">
                      {alert.type}
                    </span>
                    {!alert.read && (
                      <span className="px-1.5 py-0.2 rounded bg-cyan-500 text-slate-950 font-bold font-mono text-[9px]">
                        NEW
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.message}</p>
                  <div className="flex items-center gap-2 text-[10px] text-slate-500 font-mono pt-1">
                    <Clock className="h-3 w-3" />
                    <span>{new Date(alert.timestamp).toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                {alert.linkTo && (
                  <button
                    onClick={() => onNavigate(alert.linkTo!)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-400 hover:text-cyan-300 text-xs font-medium transition-colors"
                  >
                    Investigate →
                  </button>
                )}
                {!alert.read && (
                  <button
                    onClick={() => onMarkAlertRead(alert.id)}
                    className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition-colors"
                  >
                    Mark Read
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
