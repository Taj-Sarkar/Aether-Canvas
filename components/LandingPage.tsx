 'use client';
import React from 'react';
import { Icons } from './ui/Icons';

import type { AppView } from '../types';

interface LandingPageProps {
  onNavigate: (page: AppView) => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onNavigate }) => {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navbar */}
      <nav className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white">
            <Icons.Brain size={20} />
          </div>
          <span className="text-xl font-bold tracking-tight">Aether Canvas</span>
        </div>
        <div className="flex gap-4">
          <button onClick={() => onNavigate('signin')} className="text-slate-600 hover:text-slate-900 font-medium">Sign In</button>
          <button onClick={() => onNavigate('signup')} className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Get Started
          </button>
        </div>
      </nav>

      {/* Hero */}
      <main className="max-w-7xl mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold tracking-tight text-slate-900 mb-6">
          Turn chaotic notes & data <br />
          <span className="text-indigo-600">into clear understanding.</span>
        </h1>
        <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto">
          Paste screenshots, messy notes, code, or datasets. A team of AI agents organizes, analyzes, and visualizes everything for you.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20">
          <button onClick={() => onNavigate('signup')} className="flex items-center gap-2 bg-indigo-600 text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-indigo-700 shadow-lg shadow-indigo-200 transition-all">
            Start Organizing
            <Icons.ChevronRight size={20} />
          </button>
          <button onClick={() => onNavigate('signin')} className="text-slate-600 font-medium hover:text-slate-900 px-6 py-4">
            Try Demo
          </button>
        </div>

        {/* Visual Mock */}
        <div className="relative max-w-4xl mx-auto bg-white rounded-2xl shadow-2xl border border-slate-200 overflow-hidden aspect-[16/9] mb-24">
          <div className="absolute inset-0 bg-slate-50/50 flex items-center justify-center">
             {/* Abstract UI Representation */}
             <div className="w-3/4 h-3/4 grid grid-cols-12 gap-4 opacity-90">
                <div className="col-span-3 bg-white shadow-sm rounded-lg border border-slate-200 p-4 space-y-2">
                   <div className="h-2 w-1/2 bg-slate-200 rounded"></div>
                   <div className="h-2 w-3/4 bg-slate-200 rounded"></div>
                   <div className="h-2 w-2/3 bg-slate-200 rounded"></div>
                </div>
                <div className="col-span-6 space-y-4">
                   <div className="bg-white shadow-md rounded-lg p-4 border border-indigo-100 flex gap-4 items-center">
                      <div className="w-12 h-12 bg-slate-100 rounded-md flex items-center justify-center text-slate-400"><Icons.Image size={24}/></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-2 w-full bg-slate-100 rounded"></div>
                        <div className="h-2 w-2/3 bg-slate-100 rounded"></div>
                      </div>
                   </div>
                   <div className="bg-white shadow-md rounded-lg p-4 border border-indigo-100">
                      <div className="h-32 bg-indigo-50 rounded-md flex items-end justify-around pb-2 px-2">
                         <div className="w-4 bg-indigo-300 h-1/3 rounded-t"></div>
                         <div className="w-4 bg-indigo-400 h-2/3 rounded-t"></div>
                         <div className="w-4 bg-indigo-500 h-1/2 rounded-t"></div>
                         <div className="w-4 bg-indigo-600 h-3/4 rounded-t"></div>
                      </div>
                   </div>
                </div>
                <div className="col-span-3 bg-white shadow-sm rounded-lg border border-slate-200 p-4">
                   <div className="flex items-center gap-2 mb-4">
                      <Icons.Sparkles size={16} className="text-indigo-500"/>
                      <span className="text-xs font-bold text-slate-700">AI Agents</span>
                   </div>
                   <div className="space-y-2">
                      <div className="flex items-center gap-2 text-xs text-slate-500"><Icons.Eye size={12}/> Vision Agent</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500"><Icons.Layout size={12}/> Structurer</div>
                      <div className="flex items-center gap-2 text-xs text-slate-500"><Icons.BarChart size={12}/> Data Viz</div>
                   </div>
                </div>
             </div>
          </div>
          
          {/* Floating Chips */}
          <div className="absolute top-1/4 left-10 bg-white shadow-lg border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-slate-700 animate-bounce" style={{animationDuration: '3s'}}>
             <div className="w-2 h-2 bg-green-500 rounded-full"></div> Vision Agent
          </div>
          <div className="absolute bottom-1/3 right-20 bg-white shadow-lg border border-slate-200 px-3 py-1.5 rounded-full flex items-center gap-2 text-sm font-medium text-slate-700 animate-bounce" style={{animationDuration: '4s'}}>
             <div className="w-2 h-2 bg-blue-500 rounded-full"></div> Structurer
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 mb-24 text-left">
           {[
             { icon: Icons.Layout, title: "Chaos to Structure", desc: "Turn messy notes into clean outlines instantly." },
             { icon: Icons.Eye, title: "Visual Understanding", desc: "Drag in screenshots and get detailed analysis." },
             { icon: Icons.BarChart, title: "Instant Insights", desc: "Drop a CSV and get recommended interactive charts." },
           ].map((feature, i) => (
             <div key={i} className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-lg flex items-center justify-center mb-4">
                  <feature.icon size={20} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-slate-500">{feature.desc}</p>
             </div>
           ))}
        </div>
        
        {/* Footer CTA */}
        <div className="py-10 border-t border-slate-200">
           <p className="text-slate-500 mb-4">Start organizing your chaos in minutes.</p>
           <button onClick={() => onNavigate('signup')} className="text-indigo-600 font-semibold hover:underline">Create your workspace &rarr;</button>
        </div>
      </main>
    </div>
  );
};
