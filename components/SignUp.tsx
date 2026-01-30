"use client";

import React, { useState } from 'react';
import { Icons } from './ui/Icons';
import './SignIn.css'; // Uses the new Tech CSS
import type { AppView, User } from '../types';

interface SignUpProps {
  onNavigate: (page: AppView) => void;
  onSignUpSuccess: (user: User) => void;
}

export const SignUp: React.FC<SignUpProps> = ({ onNavigate, onSignUpSuccess }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (password.length < 6) {
      setError('Password sequence too short (min 6 chars)');
      return;
    }
    if (password !== confirmPassword) {
      setError('Access keys do not match');
      return;
    }

    setLoading(true);

    try {
      const { signUp } = await import('../services/authService');
      const result = await signUp(email, password, name);

      if (result.success && result.user) {
        onSignUpSuccess(result.user);
      } else {
        setError(result.error || 'Registration failed');
      }
    } catch (err: any) {
      setError(err.message || 'System error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      {/* LEFT SIDE: VISUAL */}
      <div className="auth-visual-side">
        <div className="visual-logo">
          <span style={{ color: '#7000ff' }}>❖</span> AETHER
        </div>
        <div className="visual-content">
          <h1 className="visual-heading">Expand<br />Your Mind.</h1>
          <p className="visual-quote">
            "Intelligence is the ability to adapt to change."
            <br />— Building your second brain starts here.
          </p>
        </div>
        <div style={{ fontSize: '0.8rem', opacity: 0.5, fontFamily: 'monospace' }}>
          NEW_USER_PROTOCOL // INIT
        </div>
      </div>

      {/* RIGHT SIDE: FORM */}
      <div className="auth-form-side">
        <div className="auth-header">
          <h2 className="auth-title">Registration</h2>
          <p className="auth-subtitle">Create your digital identity.</p>
        </div>

        {error && (
          <div className="auth-error">
            <Icons.AlertCircle size={16} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="name">Designation (Full Name)</label>
            <div className="input-wrapper">
              <input
                id="name"
                type="text"
                placeholder="JOHN DOE"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                disabled={loading}
              />
              <div className="input-icon"><Icons.User size={16} /></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Communication Link (Email)</label>
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
            <label htmlFor="password">Set Access Key</label>
            <div className="input-wrapper">
              <input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <div className="input-icon"><Icons.Lock size={16} /></div>
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Verify Access Key</label>
            <div className="input-wrapper">
              <input
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                disabled={loading}
                minLength={6}
              />
              <div className="input-icon"><Icons.Check size={16} /></div>
            </div>
          </div>

          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? <div className="spinner"></div> : 'ESTABLISH LINK'}
          </button>
        </form>

        <div className="auth-footer">
          <p>
            Already connected? 
            <button onClick={() => onNavigate('signin')} className="link-highlight" disabled={loading}>
              Log In
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