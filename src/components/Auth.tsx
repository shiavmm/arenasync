import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Role } from '../types';

export function Auth({ onLogin }: { onLogin: (session: any) => void }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<Role>('VIEWER');
  const [isLogin, setIsLogin] = useState(true);
  const [message, setMessage] = useState('');

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) setMessage(error.message);
      else if (data.session) {
        onLogin(data.session);
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            role: role,
          }
        }
      });
      if (error) setMessage(error.message);
      else setMessage('Check your email for the login link (or try logging in if auto-confirm is enabled)!');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-cyan-500/30 rounded-xl p-8 shadow-2xl shadow-cyan-500/10">
        <h2 className="text-3xl font-bold text-white mb-6 text-center font-['Chakra_Petch']">
          {isLogin ? 'Sign In' : 'Create Account'}
        </h2>
        {message && (
          <div className="bg-slate-800 text-cyan-400 p-3 rounded mb-4 text-sm border border-cyan-500/50">
            {message}
          </div>
        )}
        <form onSubmit={handleAuth} className="space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-500 transition-colors"
                  required={!isLogin}
                />
              </div>
              <div>
                <label className="block text-slate-400 text-sm mb-1">Role</label>
                <select
                  value={role}
                  onChange={(e) => setRole(e.target.value as Role)}
                  className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-500 transition-colors"
                >
                  <option value="VIEWER">Public Spectator (View Only)</option>
                  <option value="PLAYER">Athletic Player (Stats & Risk)</option>
                  <option value="COACH">Coach / Team Manager (Roster & Workload)</option>
                  <option value="REFEREE">Match Official / Referee (Live Scoring)</option>
                  <option value="ADMIN">Admin / Organizer (Full Rights)</option>
                </select>
              </div>
            </>
          )}
          <div>
            <label className="block text-slate-400 text-sm mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>
          <div>
            <label className="block text-slate-400 text-sm mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 text-white px-4 py-2 rounded focus:outline-none focus:border-cyan-500 transition-colors"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 px-4 rounded transition-colors disabled:opacity-50 mt-4"
          >
            {loading ? 'Processing...' : (isLogin ? 'Sign In' : 'Sign Up')}
          </button>
        </form>
        <p className="mt-4 text-center text-slate-400 text-sm">
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-cyan-400 hover:underline"
            type="button"
          >
            {isLogin ? 'Sign Up' : 'Sign In'}
          </button>
        </p>
      </div>
    </div>
  );
}
