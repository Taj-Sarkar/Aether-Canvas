"use client";

import React, { useState } from 'react';
import { Icons } from './ui/Icons';
import './SignIn.css';
import type { AppView, User } from '../types';

interface SignInProps {
  onNavigate: (page: AppView) => void;
  onSignInSuccess: (user: User) => void;
}

export const SignIn: React.FC<SignInProps> = ({ onNavigate, onSignInSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { signIn } = await import('../services/authService');
      const result = await signIn(email, password);

      if (result.success && result.user) {
        onSignInSuccess(result.user);
      } else {
        setError(result.error || 'Failed to sign in');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      {/* LEFT SIDE: VISUAL */}
      <div className="auth-visual-side">
        <div className="visual-logo">
          <span style={{ color: '#00dbde' }}>❖</span> AETHER
        </div>
        <div className="visual-content">
          <h1 className="visual-heading">Access<br />The Hive.</h1>
          <p className="visual-quote">
            "The mind is not a vessel to be filled, but a fire to be kindled."
            <br />— Connecting your thoughts to reality.
          </p>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, fontFamily: 'monospace' }}>
          SYSTEM_READY // V.2.0.4
        </div>
      </div>

      {/* RIGHT SIDE: FORM */}
      <div className="auth-form-side">
        <div className="auth-header">
          <h2 className="auth-title">Identify</h2>
          <p className="auth-subtitle">Enter credentials to unlock workspace.</p>
        </div>

        {error && (
          <div className="auth-error">
            <Icons.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <div className="input-wrapper">
              <input
                id="email"
                type="email"
                placeholder="USER@DOMAIN.COM"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={loading}
              />
              <div className="input-icon"><Icons.Mail size={16} /></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Access Key</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
              />
              <div className="input-icon"><Icons.Lock size={16} /></div>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'INITIALIZE SESSION'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            No Access? 
            <button onClick={() => onNavigate('signup')} className="link-highlight" disabled={loading}>
              Create ID
            </button>
          </p>
          <button onClick={() => onNavigate('landing')} className="back-link" disabled={loading}>
             ESC / HOME
          </button>
        </div>
      </div>
    </div>
  );
};