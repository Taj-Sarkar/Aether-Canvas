"use client";

import React, { useState } from 'react';
import { Icons } from './ui/Icons';
import './SignIn.css'; // Reuse same styles
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

    // Validation
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      const { signUp } = await import('../services/authService');
      const result = await signUp(email, password, name);

      if (result.success && result.user) {
        onSignUpSuccess(result.user);
      } else {
        setError(result.error || 'Failed to create account');
      }
    } catch (err: any) {
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
            <h1 className="auth-title">Create Account</h1>
            <p className="auth-subtitle">Join Aether Canvas and start organizing your thoughts</p>
          </div>

          {error && (
            <div className="auth-error">
              <Icons.AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <div className="input-wrapper">
                <Icons.User size={18} />
                <input
                  id="name"
                  type="text"
                  placeholder="John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

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
                  minLength={6}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <div className="input-wrapper">
                <Icons.Lock size={18} />
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
              </div>
            </div>

            <button type="submit" className="auth-button" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner"></div>
                  Creating account...
                </>
              ) : (
                <>
                  <Icons.UserPlus size={18} />
                  Sign Up
                </>
              )}
            </button>
          </form>

          <div className="auth-footer">
            <p>
              Already have an account?{' '}
              <button
                onClick={() => onNavigate('signin')}
                className="auth-link"
                disabled={loading}
              >
                Sign In
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
