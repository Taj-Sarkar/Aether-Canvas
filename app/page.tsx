"use client";

import React, { useState } from "react";
import { LandingPage } from "../components/LandingPage";
import { AppShell } from "../components/AppShell";
import { AppView } from "../types";

export default function HomePage() {
  const [view, setView] = useState<AppView>("landing");

  const handleNavigate = (next: AppView) => setView(next);
  const handleLogout = async () => {
    setView("landing");
  };

  if (view === "app") {
    return <AppShell onLogout={handleLogout} />;
  }

  return <LandingPage onNavigate={handleNavigate} />;
}
