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
        console.error('Sign in failed:', result.error);
        setError(result.error || 'Failed to sign in');
      }
    } catch (err: any) {
      console.error('Sign in exception:', err);
      setError(err.message || 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page-root">
      <div className="ambient-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="auth-container">
        <div className="auth-card glass-panel">
          <div className="auth-header">
            <div className="auth-logo">
              <Icons.Brain size={32} />
            </div>
            <h1 className="auth-title">Welcome Back</h1>
            <p className="auth-subtitle">Sign in to continue to Aether Canvas</p>
          </div>

          {error && (
            <div className="auth-error">
              <Icons.AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="email">Email</label>
              <div className="input-wrapper">
                <Icons.Mail size={18} />
                <input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <div className="input-wrapper">
                <Icons.Lock size={18} />
                <input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Icons.LogIn size={18} />
                  Sign In
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Don't have an account?{' '}
              <button
                onClick={() => onNavigate('signup')}
                className="auth-link"
                disabled={loading}
              >
                Sign Up
              </button>
            </p>
            <button
              onClick={() => onNavigate('landing')}
              className="auth-link back-link"
              disabled={loading}
            >
              <Icons.ArrowLeft size={14} />
              Back to Home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
