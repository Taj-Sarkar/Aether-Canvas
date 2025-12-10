import React, { useState } from 'react';
import { LandingPage } from './components/LandingPage';
import { AuthPage } from './components/AuthPages';
import { AppShell } from './components/AppShell';
import { AppView } from './types';

const App = () => {
  // Simple view state routing for demo purposes
  // In a real Next.js app, this would be handled by the file-system router
  const [view, setView] = useState<AppView>('landing');

  const handleNavigate = (next: AppView) => setView(next);

  const handleAuthSuccess = () => {
    setView('app');
  };

  if (view === 'app') {
    return <AppShell />;
  }

  if (view === 'signin' || view === 'signup') {
    return (
      <AuthPage 
        type={view} 
        onNavigate={handleNavigate} 
        onAuthSuccess={handleAuthSuccess}
      />
    );
  }

  return <LandingPage onNavigate={handleNavigate} />;
};

export default App;
