import React from 'react';
import { Icons } from './ui/Icons';

import type { AppView } from '../types';

interface AuthPageProps {
  type: 'signin' | 'signup';
  onNavigate: (page: AppView) => void;
  onAuthSuccess: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ type, onNavigate, onAuthSuccess }) => {
  const isSignIn = type === 'signin';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulation of auth
    setTimeout(() => {
      onAuthSuccess();
    }, 800);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6">
      <div className="mb-8 text-center cursor-pointer" onClick={() => onNavigate('/')}>
        <div className="inline-flex items-center justify-center w-12 h-12 bg-indigo-600 rounded-xl text-white mb-4">
          <Icons.Brain size={28} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900">Aether Canvas</h1>
        <p className="text-slate-500">Multimodal AI thinking canvas</p>
      </div>

      <div className="bg-white w-full max-w-md p-8 rounded-2xl shadow-xl border border-slate-100">
        <h2 className="text-xl font-semibold mb-6 text-slate-900">
          {isSignIn ? 'Welcome back' : 'Create an account'}
        </h2>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {!isSignIn && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Full Name</label>
              <input type="text" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="John Doe" required />
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
            <input type="email" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="you@example.com" required />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Password</label>
            <input type="password" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" required />
          </div>

          {!isSignIn && (
             <div>
               <label className="block text-sm font-medium text-slate-700 mb-1">Confirm Password</label>
               <input type="password" className="w-full px-4 py-2 rounded-lg border border-slate-300 focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all" placeholder="••••••••" required />
             </div>
          )}

          <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-medium py-2.5 rounded-lg transition-colors mt-2">
            {isSignIn ? 'Sign In' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-slate-500">
          {isSignIn ? (
            <>
              Don't have an account?{' '}
              <button onClick={() => onNavigate('signup')} className="text-indigo-600 font-medium hover:underline">Sign up</button>
            </>
          ) : (
            <>
              Already have an account?{' '}
              <button onClick={() => onNavigate('signin')} className="text-indigo-600 font-medium hover:underline">Sign in</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};
