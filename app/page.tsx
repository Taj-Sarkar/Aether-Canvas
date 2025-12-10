"use client";

import React, { useState } from "react";
import { LandingPage } from "../components/LandingPage";
import { AuthPage } from "../components/AuthPages";
import { AppShell } from "../components/AppShell";
import { AppView } from "../types";

export default function HomePage() {
  const [view, setView] = useState<AppView>("landing");
  const [authed, setAuthed] = useState(false);
  const [checking, setChecking] = useState(true);

  React.useEffect(() => {
    const check = async () => {
      try {
        const res = await fetch("/api/auth/session");
        if (res.ok) {
          setAuthed(true);
          setView("app");
        }
      } catch {
        /* ignore */
      } finally {
        setChecking(false);
      }
    };
    check();
  }, []);

  const handleNavigate = (next: AppView) => setView(next);
  const handleAuthSuccess = () => {
    setAuthed(true);
    setView("app");
  };
  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch {/* ignore */}
    setAuthed(false);
    setView("landing");
  };

  if (checking) {
    return <div className="min-h-screen flex items-center justify-center text-slate-500">Loading...</div>;
  }

  if (view === "app" && authed) {
    return <AppShell onLogout={handleLogout} />;
  }

  if (view === "signin" || view === "signup") {
    return (
      <AuthPage
        type={view}
        onNavigate={handleNavigate}
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return <LandingPage onNavigate={handleNavigate} />;
}

