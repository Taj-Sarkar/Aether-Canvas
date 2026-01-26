"use client";

import React, { useState, useEffect } from "react";
import { LandingPage } from "../components/LandingPage";
import { SignIn } from "../components/SignIn";
import { SignUp } from "../components/SignUp";
import { AppShell } from "../components/AppShell";
import { AppView, User } from "../types";
import { verifyAuth, logout, getToken } from "../services/authService";

export default function HomePage() {
  const [view, setView] = useState<AppView>("landing");
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Auto-login on mount if token exists
  useEffect(() => {
    const checkAuth = async () => {
      // Optimistic load from local storage
      const { getStoredUser } = await import("../services/authService");
      const storedUser = getStoredUser();
      
      if (storedUser) {
        setUser(storedUser);
        setView("app");
        setLoading(false); // Show app immediately
      }

      // Verify with server
      const result = await verifyAuth();
      if (result.success && result.user) {
        setUser(result.user);
        setView("app");
      } else {
        // Only log out if the token was actually removed (401 Unauthorized)
        // If token still exists, it might be a network error, so we stay logged in (optimistically)
        if (!getToken()) {
           setUser(null);
           setView("landing");
        }
      }
      setLoading(false);
    };
    checkAuth();
  }, []);

  const handleNavigate = (next: AppView) => setView(next);

  const handleSignInSuccess = (user: User) => {
    setUser(user);
    setView("app");
  };

  const handleSignUpSuccess = (user: User) => {
    setUser(user);
    setView("app");
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    setView("landing");
  };

  // Show loading state during initial auth check
  if (loading) {
    return (
      <div style={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a0f',
        color: '#e8e8f0'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '40px',
            height: '40px',
            border: '3px solid rgba(112, 0, 255, 0.3)',
            borderTopColor: '#7000ff',
            borderRadius: '50%',
            animation: 'spin 0.8s linear infinite',
            margin: '0 auto 1rem'
          }}></div>
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  if (view === "app" && user) {
    return <AppShell user={user} onLogout={handleLogout} />;
  }

  if (view === "signin") {
    return <SignIn onNavigate={handleNavigate} onSignInSuccess={handleSignInSuccess} />;
  }

  if (view === "signup") {
    return <SignUp onNavigate={handleNavigate} onSignUpSuccess={handleSignUpSuccess} />;
  }

  return <LandingPage user={user} onNavigate={handleNavigate} onLogout={handleLogout} />;
}

