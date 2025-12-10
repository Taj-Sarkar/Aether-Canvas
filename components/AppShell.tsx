'use client';
import React, { useState, type ChangeEvent } from 'react';
import { Icons } from './ui/Icons';
import { 
  AgentState, AgentType, AgentStatus, 
  CanvasBlock, BlockType, TextBlock, ImageBlock, DatasetBlock, 
  BreakdownData, ChartConfig, Message, Workspace, Flashcard
} from '../types';
import { analyzeTextStructure, analyzeImage, generateChartRecommendation, chatWithWorkspace, isApiConfigured, generateImage } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// --- Sub-Components ---

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#312e81', '#6366f1'];

const AgentCard = ({ agent }: { agent: AgentState }) => {
  const isWorking = agent.status === AgentStatus.WORKING;
  const isCompleted = agent.status === AgentStatus.COMPLETED;
  
  return (
    <div className={`p-3 rounded-lg border transition-all duration-300 ${isWorking ? 'border-indigo-400 bg-indigo-50 shadow-md scale-105' : 'border-slate-200 bg-white'}`}>
      <div className="flex items-center gap-3">
        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${isWorking ? 'bg-indigo-100 text-indigo-700 animate-pulse' : 'bg-slate-100 text-slate-500'}`}>
          {agent.type === AgentType.VISION && <Icons.Eye size={16} />}
          {agent.type === AgentType.STRUCTURER && <Icons.Layout size={16} />}
          {agent.type === AgentType.DATA_VIZ && <Icons.BarChart size={16} />}
          {agent.type === AgentType.CODE && <Icons.Code size={16} />}
          {agent.type === AgentType.ROUTER && <Icons.Sparkles size={16} />}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-slate-900 truncate">{agent.type}</p>
          <p className="text-xs text-slate-500 truncate">
            {agent.status === AgentStatus.IDLE && 'Idle'}
            {agent.status === AgentStatus.WORKING && (agent.message || 'Processing...')}
            {agent.status === AgentStatus.COMPLETED && 'Done'}
          </p>
        </div>
      </div>
    </div>
  );
};

// --- Main App Component ---

interface AppShellProps {
  onLogout?: () => void;
}

export const AppShell = ({ onLogout }: AppShellProps) => {
  // --- State ---
  const [activeTab, setActiveTab] = useState<'chat' | 'breakdown' | 'viz' | 'agents' | 'flashcards'>('chat');
  type WorkspaceData = {
    blocks: CanvasBlock[];
    chatHistory: Message[];
    breakdown: BreakdownData | null;
    visualizations: ChartConfig[];
    flashcards: Flashcard[];
  };
  const initialWorkspaceData: WorkspaceData = {
    blocks: [
      { id: '1', type: BlockType.TEXT, title: 'Project Notes', content: 'Met with the team today regarding the Q4 rollout. \nIssues: \n- Server latency is high during peak hours.\n- The mobile login flow is confusing users.\nAction items:\n- Investigate Redis caching layer.\n- Redesign login UX.' },
    ],
    chatHistory: [
      { id: '0', role: 'model', content: 'Hello! I\'m ready to help you organize this workspace.', timestamp: Date.now() }
    ],
    breakdown: null,
    visualizations: [],
    flashcards: [],
  };
  const [workspaceData, setWorkspaceData] = useState<Record<string, WorkspaceData>>({
    'ws-1': initialWorkspaceData,
    'ws-2': { ...initialWorkspaceData, blocks: [{ id: '2', type: BlockType.TEXT, title: 'Marketing Ideas', content: 'Brainstorm campaign angles and Q4 promos.' }], chatHistory: [{ id: '0b', role: 'model', content: 'Let\'s plan your marketing ideas.', timestamp: Date.now() }], breakdown: null, visualizations: [], flashcards: [] },
    'ws-3': { ...initialWorkspaceData, blocks: [{ id: '3', type: BlockType.TEXT, title: 'Personal Notes', content: 'Daily notes and tasks.' }], chatHistory: [{ id: '0c', role: 'model', content: 'Personal workspace ready.', timestamp: Date.now() }], breakdown: null, visualizations: [], flashcards: [] },
  });
  const [chatInput, setChatInput] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([
    { id: 'ws-1', name: 'System Design', icon: 'layers', lastActive: new Date() },
    { id: 'ws-2', name: 'Q4 Marketing', icon: 'layers', lastActive: new Date() },
    { id: 'ws-3', name: 'Personal Notes', icon: 'layers', lastActive: new Date() },
  ]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-1');
  const [workspaceMenuId, setWorkspaceMenuId] = useState<string | null>(null);
  const [blockMenuId, setBlockMenuId] = useState<string | null>(null);
  
  // Agent States
  const [agents, setAgents] = useState<Record<string, AgentState>>({
    [AgentType.VISION]: { type: AgentType.VISION, status: AgentStatus.IDLE },
    [AgentType.STRUCTURER]: { type: AgentType.STRUCTURER, status: AgentStatus.IDLE },
    [AgentType.DATA_VIZ]: { type: AgentType.DATA_VIZ, status: AgentStatus.IDLE },
    [AgentType.CODE]: { type: AgentType.CODE, status: AgentStatus.IDLE },
  });

  const updateAgent = (type: AgentType, status: AgentStatus, message?: string) => {
    setAgents(prev => ({ ...prev, [type]: { ...prev[type], status, message } }));
  };

  const resetAgents = () => {
     Object.values(AgentType).forEach(t => updateAgent(t as AgentType, AgentStatus.IDLE));
  }

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || workspaces[0];
  const currentData = workspaceData[activeWorkspaceId] || initialWorkspaceData;
  const blocks = currentData.blocks;
  const chatHistory = currentData.chatHistory;
  const breakdown = currentData.breakdown;
  const visualizations = currentData.visualizations;
  const flashcards = currentData.flashcards;

  const setWorkspaceSlice = (updater: (data: WorkspaceData) => WorkspaceData) => {
    setWorkspaceData(prev => ({
      ...prev,
      [activeWorkspaceId]: updater(prev[activeWorkspaceId] || initialWorkspaceData),
    }));
  };

  const handleCreateWorkspace = () => {
    const name = window.prompt('Workspace name?');
    if (!name || !name.trim()) return;
    const newWorkspace: Workspace = {
      id: Date.now().toString(),
      name: name.trim(),
      icon: 'layers',
      lastActive: new Date(),
    };
    setWorkspaces(prev => [...prev, newWorkspace]);
    setWorkspaceData(prev => ({
      ...prev,
      [newWorkspace.id]: {
        blocks: [],
        chatHistory: [{ id: `${Date.now()}-greet`, role: 'model', content: 'New workspace ready. Add notes or ask anything.', timestamp: Date.now() }],
        breakdown: null,
        visualizations: [],
        flashcards: [],
      },
    }));
    setActiveWorkspaceId(newWorkspace.id);
  };

  const handleRenameWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    const name = window.prompt('Rename workspace', ws.name);
    if (name === null || !name.trim()) return;
    setWorkspaces(prev => prev.map(w => (w.id === id ? { ...w, name: name.trim() } : w)));
  };

  const handleDeleteWorkspace = (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    if (workspaces.length <= 1) {
      alert('Keep at least one workspace.');
      return;
    }
    if (!window.confirm(`Delete workspace "${ws.name}"?`)) return;
    const next = workspaces.filter(w => w.id !== id);
    setWorkspaces(next);
    if (activeWorkspaceId === id) {
      setActiveWorkspaceId(next[0]?.id || '');
    }
  };

  // --- Handlers ---

  const handleAddBlock = (type: BlockType) => {
    const newBlock: CanvasBlock = {
      id: Date.now().toString(),
      type,
      title: type === BlockType.TEXT ? 'New Note' : type === BlockType.IMAGE ? 'New Image' : 'New Dataset'
    } as CanvasBlock;

    if (type === BlockType.TEXT) (newBlock as TextBlock).content = '';
    if (type === BlockType.IMAGE) {
        (newBlock as ImageBlock).src = 'https://picsum.photos/400/300'; 
        (newBlock as ImageBlock).mimeType = 'image/jpeg';
    }
    if (type === BlockType.DATASET) {
        (newBlock as DatasetBlock).fileName = 'data.csv';
        (newBlock as DatasetBlock).rowCount = 150;
        (newBlock as DatasetBlock).columns = ['Date', 'Sales', 'Region'];
        (newBlock as DatasetBlock).description = 'Monthly sales data for North America region';
    }

    setWorkspaceSlice(data => ({ ...data, blocks: [...data.blocks, newBlock] }));
  };

  const handleDeleteBlock = (id: string) => {
    setWorkspaceSlice(data => ({ ...data, blocks: data.blocks.filter(b => b.id !== id) }));
  };

  const handleSaveLastResponseToNote = () => {
    const lastModel = [...currentData.chatHistory].reverse().find(m => m.role === 'model');
    if (!lastModel) return;
    const newNote: TextBlock = {
      id: Date.now().toString(),
      type: BlockType.TEXT,
      title: 'AI Note',
      content: lastModel.content,
    };
    setWorkspaceSlice(data => ({ ...data, blocks: [...data.blocks, newNote] }));
    setActiveTab('chat');
  };

  const handleAnalyzeText = async (block: TextBlock) => {
    resetAgents();
    setActiveTab('agents');
    updateAgent(AgentType.STRUCTURER, AgentStatus.WORKING, 'Analyzing text structure...');
    
    try {
      const result = await analyzeTextStructure(block.content);
      setWorkspaceSlice(data => ({ ...data, breakdown: result }));
      updateAgent(AgentType.STRUCTURER, AgentStatus.COMPLETED);
      setTimeout(() => setActiveTab('breakdown'), 1000);
    } catch (e) {
      updateAgent(AgentType.STRUCTURER, AgentStatus.ERROR, 'Failed to analyze');
    }
  };

  const handleAnalyzeImage = async (block: ImageBlock) => {
     resetAgents();
     setActiveTab('agents');
     updateAgent(AgentType.VISION, AgentStatus.WORKING, 'Extracting insights...');
     
     try {
       // Fetch the blob to get base64 (simulated here since we use a URL in this demo)
       // In a real app, user uploads a file. Here we fetch the placeholder.
       // For demo safety, we'll just skip the fetch and pass a placeholder string or handle it if it's a real data URL.
       const isDataUrl = block.src.startsWith('data:');
       let base64 = '';
       
       if (isDataUrl) {
          base64 = block.src.split(',')[1];
       } else {
          // Mocking the base64 for the URL image to avoid CORS issues in this strict environment
          // In real code: await fetch(block.src).then(r => r.blob())...
          // For this demo, we'll just send a text prompt saying "Analyze this" if we can't get image data
          // But Gemini needs image data. 
          // We will simulate the success response for the URL case to avoid crashing on CORS.
          if(block.src.includes('picsum')) {
             await new Promise(r => setTimeout(r, 1500)); // Fake delay
             const mockResponse = "The image appears to be a random landscape or abstract scene (placeholder). It contains natural colors and lighting.";
             setWorkspaceSlice(data => ({
               ...data,
               chatHistory: [...data.chatHistory, {
                  id: Date.now().toString(),
                  role: 'model',
                  content: `**Vision Analysis:** ${mockResponse}`,
                  timestamp: Date.now()
               }]
             }));
             updateAgent(AgentType.VISION, AgentStatus.COMPLETED);
             setTimeout(() => setActiveTab('chat'), 1000);
             return;
          }
       }

       const description = await analyzeImage(base64, block.mimeType, "Describe this image.");
       setWorkspaceSlice(data => ({
         ...data,
         chatHistory: [...data.chatHistory, {
            id: Date.now().toString(),
            role: 'model',
            content: `**Vision Analysis:** ${description}`,
            timestamp: Date.now()
         }]
       }));
       updateAgent(AgentType.VISION, AgentStatus.COMPLETED);
       setTimeout(() => setActiveTab('chat'), 1000);
     } catch (e) {
       updateAgent(AgentType.VISION, AgentStatus.ERROR);
     }
  };

  const handleRecommendCharts = async (block: DatasetBlock) => {
      resetAgents();
      setActiveTab('agents');
      updateAgent(AgentType.DATA_VIZ, AgentStatus.WORKING, 'Analyzing metadata...');

      try {
        const config = await generateChartRecommendation(block.description || "Generic dataset");
        setWorkspaceSlice(data => ({ ...data, visualizations: [config, ...data.visualizations] }));
        updateAgent(AgentType.DATA_VIZ, AgentStatus.COMPLETED);
        setTimeout(() => setActiveTab('viz'), 1000);
      } catch (e) {
        updateAgent(AgentType.DATA_VIZ, AgentStatus.ERROR);
      }
  };

  const sendChat = async (message: string) => {
    if (!message.trim()) return;

    const userMsg: Message = { id: Date.now().toString(), role: 'user', content: message, timestamp: Date.now() };
    setWorkspaceSlice(data => ({ ...data, chatHistory: [...data.chatHistory, userMsg] }));
    setChatInput('');
    setActiveTab('chat'); // Force switch to chat

    // Context building
    const context = currentData.blocks.map(b => {
      if(b.type === BlockType.TEXT) return `Note (${b.title}): ${(b as TextBlock).content}`;
      if(b.type === BlockType.DATASET) return `Dataset (${b.title}): ${(b as DatasetBlock).description}`;
      return `Image (${b.title})`;
    }).join('\n');

    try {
       const responseText = await chatWithWorkspace(currentData.chatHistory, message, context);
       const modelMsg: Message = { id: (Date.now()+1).toString(), role: 'model', content: responseText || "I couldn't generate a response.", timestamp: Date.now() };
       setWorkspaceSlice(data => ({ ...data, chatHistory: [...data.chatHistory, modelMsg] }));
    } catch(e: any) {
       console.error('Chat error:', e);
       const errorMsg: Message = { 
         id: (Date.now()+1).toString(), 
         role: 'model', 
         content: `**Error:** ${e?.message || 'Failed to get response. Please check if GEMINI_API_KEY is set in your .env file.'}`, 
         timestamp: Date.now() 
       };
       setWorkspaceSlice(data => ({ ...data, chatHistory: [...data.chatHistory, errorMsg] }));
    }
  };

  const handleChat = async () => {
    if(!chatInput.trim()) return;
    await sendChat(chatInput);
  };

  const handleAskNote = async (block: TextBlock) => {
    const lines = (block.content || '').split('\n').filter(Boolean);
    const preview = lines.slice(0, 2).join(' ').trim();
    const snippet = preview ? `${preview} ...` : '(empty note)';
    const prompt = `Question about note "${block.title}": ${snippet}`;
    await sendChat(prompt);
  };
  
  const handlePinMessage = (msg: Message) => {
    const newNote: TextBlock = {
      id: Date.now().toString(),
      type: BlockType.TEXT,
      title: 'Pinned message',
      content: msg.content,
    };
    setWorkspaceSlice(data => ({ ...data, blocks: [...data.blocks, newNote] }));
    setActiveTab('chat');
  };

  const handleGenerateFlashcards = async () => {
    setActiveTab('flashcards');
    
    // Build context from notes and recent chat
    const context = [
      ...blocks.map(b => {
        if(b.type === BlockType.TEXT) return `Note (${b.title}): ${(b as TextBlock).content}`;
        if(b.type === BlockType.DATASET) return `Dataset (${b.title}): ${(b as DatasetBlock).description}`;
        return `Image (${b.title})`;
      }),
      ...chatHistory.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    ].join('\n\n');

    const prompt = `Generate flashcards from the following content. Extract the most important concepts, definitions, formulas, or steps. Create short, focused flashcards (one idea per card).

Format each flashcard as:
Front: [Clear question, cue, or fill-in-the-blank]
Back: [Concise answer with optional tiny explanation/example]

Content to analyze:
${context}

Return ONLY the flashcards in this exact format (one flashcard per block):
---
Front: [question]
Back: [answer]
---`;

    try {
      const responseText = await chatWithWorkspace([], prompt, context);
      
      // Parse flashcards from response
      const flashcardBlocks = responseText.split('---').filter(block => block.trim());
      const newFlashcards: Flashcard[] = [];
      
      flashcardBlocks.forEach((block, idx) => {
        const frontMatch = block.match(/Front:\s*(.+?)(?:\n|Back:)/s);
        const backMatch = block.match(/Back:\s*(.+?)(?:\n|$)/s);
        
        if (frontMatch && backMatch) {
          newFlashcards.push({
            id: `${Date.now()}-${idx}`,
            front: frontMatch[1].trim(),
            back: backMatch[1].trim(),
          });
        }
      });

      if (newFlashcards.length > 0) {
        // Add flashcards first
        setWorkspaceSlice(data => ({ 
          ...data, 
          flashcards: [...data.flashcards, ...newFlashcards] 
        }));
      } else {
        // Fallback: create a single flashcard from the response
        setWorkspaceSlice(data => ({ 
          ...data, 
          flashcards: [...data.flashcards, {
            id: Date.now().toString(),
            front: 'Generated from workspace content',
            back: responseText.slice(0, 200) + (responseText.length > 200 ? '...' : ''),
          }]
        }));
      }
    } catch (e: any) {
      console.error('Flashcard generation error:', e);
      alert(`Failed to generate flashcards: ${e?.message || 'Unknown error'}`);
    }
  };

  // Fake file upload handler
  const handleFileUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (ev) => {
        const src = ev.target?.result as string;
        const type = file.type.startsWith('image/') ? BlockType.IMAGE : BlockType.DATASET;
        
        const newBlock: any = {
            id: Date.now().toString(),
            type,
            title: file.name
        };

        if (type === BlockType.IMAGE) {
            newBlock.src = src;
            newBlock.mimeType = file.type;
        } else {
            newBlock.fileName = file.name;
            newBlock.rowCount = Math.floor(Math.random() * 500) + 50;
            newBlock.columns = ['Col A', 'Col B', 'Col C'];
            newBlock.description = `Uploaded file: ${file.name}`;
        }
        setWorkspaceSlice(data => ({ ...data, blocks: [...data.blocks, newBlock] }));
    };
    reader.readAsDataURL(file);
  };


  return (
  <div className={`flex h-screen bg-slate-100 overflow-hidden font-sans text-slate-900 ${!isApiConfigured ? 'pt-10' : ''}`}>
      
      {!isApiConfigured && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-amber-50 border-b border-amber-200 text-amber-800 text-sm px-4 py-2 flex items-center justify-center gap-2">
          <Icons.AlertTriangle size={16} />
          Gemini API key not configured. Add GEMINI_API_KEY in .env to enable live AI responses.
        </div>
      )}
      
      {/* 1. Left Sidebar */}
      <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col border-r border-slate-800 hidden md:flex">
        <div 
          onClick={onLogout}
          className="p-4 flex items-center gap-2 text-white font-bold border-b border-slate-800 cursor-pointer hover:bg-slate-800/50 transition-colors"
        >
          <div className="bg-indigo-600 p-1.5 rounded-lg"><Icons.Brain size={18} /></div>
          Aether Canvas
        </div>
        
        <div className="p-4 flex-1 overflow-y-auto space-y-6">
          <div>
            <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
              Workspaces
              <button onClick={handleCreateWorkspace} className="p-1 rounded hover:text-white hover:bg-slate-800 transition-colors">
                <Icons.Plus size={14} />
              </button>
            </div>
            <div className="space-y-1">
              {workspaces.map(ws => (
                <div
                  key={ws.id}
                  className={`group flex items-center justify-between px-2 py-1.5 rounded-md text-sm transition-colors ${ws.id === activeWorkspaceId ? 'bg-slate-200 text-slate-900' : 'text-slate-400 hover:bg-slate-800/40 hover:text-white'}`}
                >
                  <button
                    onClick={() => { setActiveWorkspaceId(ws.id); setWorkspaceMenuId(null); }}
                    className="flex items-center gap-2 flex-1 text-left"
                  >
                    <Icons.Layers size={16} />
                    <span className="truncate">{ws.name}</span>
                  </button>
                  <div className="relative">
                    <button
                      onClick={() => setWorkspaceMenuId(workspaceMenuId === ws.id ? null : ws.id)}
                      className="p-1 rounded hover:bg-slate-800/60 text-slate-400 hover:text-white"
                    >
                      <Icons.MoreHorizontal size={14} />
                    </button>
                    {workspaceMenuId === ws.id && (
                      <div className="absolute right-0 mt-1 w-32 bg-slate-800 border border-slate-700 rounded-lg shadow-lg text-xs overflow-hidden z-20">
                        <button
                          onClick={() => { setWorkspaceMenuId(null); handleRenameWorkspace(ws.id); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-700 text-slate-200"
                        >
                          Rename
                        </button>
                        <button
                          onClick={() => { setWorkspaceMenuId(null); handleDeleteWorkspace(ws.id); }}
                          className="w-full text-left px-3 py-2 hover:bg-slate-700 text-red-300"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
             <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-slate-500 mb-3 px-2">
              Assets
            </div>
            <div className="space-y-2 px-2">
              {blocks.map(b => (
                 <div key={b.id} className="flex items-center gap-2 text-sm text-slate-400 hover:text-white cursor-pointer truncate">
                    {b.type === BlockType.TEXT && <Icons.FileText size={14}/>}
                    {b.type === BlockType.IMAGE && <Icons.Image size={14}/>}
                    {b.type === BlockType.DATASET && <Icons.Database size={14}/>}
                    <span className="truncate">{b.title}</span>
                 </div>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4 border-t border-slate-800">
          <button
            onClick={() => onLogout?.()}
            className="flex items-center gap-2 text-sm text-slate-400 hover:text-white transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-indigo-500 flex items-center justify-center text-xs text-white">JD</div>
            John Doe
          </button>
        </div>
      </aside>

      {/* 2. Center Canvas */}
      <main className="flex-1 flex flex-col min-w-0 bg-slate-50 relative">
        <header className="h-16 border-b border-slate-200 bg-white flex items-center justify-between px-6 sticky top-0 z-10">
           <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
             {activeWorkspace?.name || 'Workspace'}
           </h2>
           <div className="flex items-center gap-3">
             <label className="cursor-pointer flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-200 rounded-lg text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all">
                <Icons.Upload size={16} className="text-slate-500"/>
                Upload
                <input type="file" className="hidden" onChange={handleFileUpload} accept="image/*,.csv" />
             </label>
             <button onClick={() => handleAddBlock(BlockType.TEXT)} className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 transition-all">
                <Icons.Plus size={16}/> Note
             </button>
           </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
           {blocks.map((block) => (
             <div key={block.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-1 group relative transition-all hover:shadow-md">
                
                {/* Block Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50">
                   <div className="flex items-center gap-2 text-slate-500">
                      {block.type === BlockType.TEXT && <Icons.FileText size={16}/>}
                      {block.type === BlockType.IMAGE && <Icons.Image size={16}/>}
                      {block.type === BlockType.DATASET && <Icons.Database size={16}/>}
                      <span className="text-sm font-medium">{block.title}</span>
                   </div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity relative">
                    <button
                      onClick={() => setBlockMenuId(blockMenuId === block.id ? null : block.id)}
                      className="p-1 hover:bg-slate-100 rounded text-slate-400"
                    >
                      <Icons.MoreHorizontal size={16}/>
                    </button>
                    {blockMenuId === block.id && (
                      <div className="absolute right-0 mt-2 w-36 bg-white border border-slate-200 rounded-lg shadow-lg z-30">
                        <button
                          onClick={() => { setBlockMenuId(null); handleDeleteBlock(block.id); }}
                          className="w-full flex items-center gap-2 text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Icons.Trash size={14}/> Delete
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Block Content */}
                <div className="p-4">
                   {block.type === BlockType.TEXT && (
                     <div className="space-y-3">
                        <textarea 
                          className="w-full resize-none outline-none text-slate-700 leading-relaxed bg-transparent min-h-[100px]"
                          value={(block as TextBlock).content}
                          onChange={(e) => {
                             setWorkspaceSlice(data => {
                               const newBlocks = data.blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } as CanvasBlock : b);
                               return { ...data, blocks: newBlocks };
                             });
                          }}
                        />
                        <div className="flex gap-2 pt-2 border-t border-slate-100">
                           <button 
                             onClick={() => handleAnalyzeText(block as TextBlock)}
                             className="text-xs flex items-center gap-1.5 bg-indigo-50 text-indigo-600 px-3 py-1.5 rounded-full hover:bg-indigo-100 font-medium transition-colors"
                           >
                             <Icons.Sparkles size={12}/> Analyze & Organize
                           </button>
                           <button
                             onClick={() => handleAskNote(block as TextBlock)}
                             className="text-xs flex items-center gap-1.5 bg-slate-100 text-slate-600 px-3 py-1.5 rounded-full hover:bg-slate-200 font-medium transition-colors"
                           >
                             <Icons.MessageSquare size={12}/> Ask in chat
                           </button>
                        </div>
                     </div>
                   )}

                   {block.type === BlockType.IMAGE && (
                     <div className="space-y-4">
                        <div className="relative rounded-lg overflow-hidden bg-slate-100 max-h-[400px] flex justify-center">
                           <img src={(block as ImageBlock).src} alt="Block content" className="object-contain max-h-full" />
                        </div>
                        <div className="flex items-center gap-2">
                           <input type="text" placeholder="Ask something about this image..." className="flex-1 text-sm bg-slate-50 border border-slate-200 rounded-md px-3 py-2 outline-none focus:border-indigo-400" />
                           <button 
                             onClick={() => handleAnalyzeImage(block as ImageBlock)}
                             className="bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-2 rounded-md text-sm font-medium"
                           >
                             Analyze
                           </button>
                        </div>
                     </div>
                   )}

                   {block.type === BlockType.DATASET && (
                      <div className="space-y-4">
                        <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-100">
                           <div className="bg-white p-3 rounded border border-slate-200 text-indigo-600">
                              <Icons.FileJson size={24} />
                           </div>
                           <div>
                              <p className="font-medium text-slate-900">{(block as DatasetBlock).fileName}</p>
                              <p className="text-sm text-slate-500">{(block as DatasetBlock).rowCount} rows • {(block as DatasetBlock).columns.join(', ')}</p>
                              <p className="text-xs text-slate-400 mt-1">{(block as DatasetBlock).description}</p>
                           </div>
                        </div>
                        <button 
                          onClick={() => handleRecommendCharts(block as DatasetBlock)}
                          className="flex items-center gap-2 text-sm text-indigo-600 font-medium hover:text-indigo-800"
                        >
                          <Icons.BarChart size={16} /> Recommend Charts
                        </button>
                      </div>
                   )}
                </div>
             </div>
           ))}
           <div className="h-20"></div> {/* Spacer */}
        </div>
      </main>

      {/* 3. Right Panel */}
      <aside className="w-[400px] bg-white border-l border-slate-200 flex flex-col shadow-xl z-20">
         {/* Tabs */}
         <div className="flex border-b border-slate-200">
            {[
              { id: 'chat', icon: Icons.MessageSquare, label: 'Chat' },
              { id: 'breakdown', icon: Icons.Layers, label: 'Breakdown' },
              { id: 'viz', icon: Icons.BarChart, label: 'Visuals' },
              { id: 'agents', icon: Icons.Bot, label: 'Agents' },
              { id: 'flashcards', icon: Icons.FileText, label: 'Cards' },
            ].map(tab => (
               <button 
                 key={tab.id}
                 onClick={() => setActiveTab(tab.id as any)}
                 className={`flex-1 flex flex-col items-center justify-center py-3 gap-1 text-[10px] font-medium uppercase tracking-wide transition-colors ${activeTab === tab.id ? 'text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50' : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'}`}
               >
                 <tab.icon size={18} />
                 {tab.label}
               </button>
            ))}
         </div>

         <div className="flex-1 overflow-hidden relative bg-slate-50/30">
            
            {/* CHAT TAB */}
            {activeTab === 'chat' && (
               <div className="absolute inset-0 flex flex-col">
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                     {chatHistory.map(msg => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                           <div className={`group max-w-[85%] p-3 rounded-xl text-sm leading-relaxed relative ${msg.role === 'user' ? 'bg-indigo-600 text-white rounded-br-none' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-none shadow-sm'}`}>
                              <div className="flex items-start gap-2">
                                <div className="flex-1">
                                  {msg.role === 'model' && <div className="text-[10px] text-slate-400 font-bold mb-1 uppercase tracking-wider">AI Assistant</div>}
                                  <div dangerouslySetInnerHTML={{ __html: msg.content.replace(/\n/g, '<br/>').replace(/\*\*(.*?)\*\*/g, '<b>$1</b>') }} />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <button
                                    onClick={() => handlePinMessage(msg)}
                                    className={`p-1.5 rounded-md transition-colors ${msg.role === 'user' ? 'text-indigo-100 hover:bg-indigo-500/40' : 'text-slate-400 hover:bg-slate-100 hover:text-slate-600'}`}
                                    title="Pin to notes"
                                  >
                                    <Icons.Pin size={14} />
                                  </button>
                                </div>
                              </div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="p-4 bg-white border-t border-slate-200">
                     <div className="relative">
                       <textarea 
                         value={chatInput}
                         onChange={e => setChatInput(e.target.value)}
                         onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }}}
                         placeholder="Ask about your workspace..."
                         className="w-full pl-4 pr-12 py-3 bg-slate-100 border-transparent rounded-xl text-sm focus:bg-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none outline-none h-12 max-h-32"
                       />
                       <button 
                         onClick={handleChat}
                         className="absolute right-2 top-2 p-1.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                       >
                         <Icons.Send size={16} />
                       </button>
                     </div>
                     <div className="flex items-center justify-between mt-2 text-[11px] text-slate-500">
                       <span className="text-slate-400">Context aware of {blocks.length} blocks.</span>
                       <div className="flex gap-2">
                         <button 
                           onClick={handleGenerateFlashcards}
                           className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors text-[11px] font-medium"
                         >
                           <Icons.FileText size={12}/> Generate Flashcards
                         </button>
                         <button 
                           onClick={handleSaveLastResponseToNote}
                           className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-colors text-[11px] font-medium"
                         >
                           <Icons.FileText size={12}/> Save last AI reply as note
                         </button>
                       </div>
                     </div>
                  </div>
               </div>
            )}

            {/* BREAKDOWN TAB */}
            {activeTab === 'breakdown' && (
               <div className="p-6 space-y-6 overflow-y-auto h-full">
                  {!breakdown ? (
                    <div className="text-center text-slate-400 mt-20">
                       <Icons.Layers size={48} className="mx-auto mb-4 opacity-20"/>
                       <p>Select a text block and click "Analyze" to see a structured breakdown.</p>
                    </div>
                  ) : (
                    <div className="space-y-6 animate-fadeIn">
                       <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200">
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-2">Summary</h3>
                          <p className="text-slate-800 leading-relaxed">{breakdown.summary}</p>
                       </div>

                       <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Key Points</h3>
                          <ul className="space-y-2">
                             {breakdown.keyPoints.map((pt, i) => (
                               <li key={i} className="flex gap-2 items-start text-sm text-slate-700 bg-white p-3 rounded-lg border border-slate-100">
                                 <span className="text-indigo-500 mt-0.5">•</span> {pt}
                               </li>
                             ))}
                          </ul>
                       </div>

                       <div>
                          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-3">Action Items</h3>
                          <div className="space-y-2">
                             {breakdown.actionItems.map((item, i) => (
                               <div key={i} className="flex items-center gap-3 text-sm text-slate-800 bg-indigo-50 border border-indigo-100 p-3 rounded-lg">
                                  <div className="w-4 h-4 rounded border-2 border-indigo-400"></div>
                                  {item}
                               </div>
                             ))}
                          </div>
                       </div>
                       
                       <div className="flex flex-wrap gap-2">
                          {breakdown.tags.map(tag => (
                             <span key={tag} className="px-2 py-1 bg-slate-200 text-slate-600 rounded text-xs font-medium">#{tag}</span>
                          ))}
                       </div>
                    </div>
                  )}
               </div>
            )}

            {/* VIZ TAB */}
            {activeTab === 'viz' && (
               <div className="p-6 space-y-6 overflow-y-auto h-full">
                  {visualizations.length === 0 ? (
                    <div className="text-center text-slate-400 mt-20">
                       <Icons.BarChart size={48} className="mx-auto mb-4 opacity-20"/>
                       <p>Upload a dataset and click "Recommend Charts" to generate visuals.</p>
                    </div>
                  ) : (
                    visualizations.map((viz, idx) => (
                      <div key={idx} className="bg-white p-4 rounded-xl shadow-sm border border-slate-200">
                         <h4 className="font-semibold text-slate-800 mb-4">{viz.title}</h4>
                         <div className="h-64 w-full">
                            <ResponsiveContainer width="100%" height="100%">
                               {viz.type === 'bar' ? (
                                  <BarChart data={viz.data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                    <XAxis dataKey={viz.xAxisKey} axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}} dy={10}/>
                                    <YAxis axisLine={false} tickLine={false} fontSize={12} tick={{fill: '#64748b'}}/>
                                    <Tooltip cursor={{fill: '#f1f5f9'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'}}/>
                                    <Bar dataKey={viz.dataKey} fill="#6366f1" radius={[4, 4, 0, 0]} />
                                  </BarChart>
                               ) : viz.type === 'pie' ? (
                                  <PieChart>
                                     <Pie data={viz.data} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} fill="#8884d8">
                                       {viz.data.map((entry, index) => (
                                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                       ))}
                                     </Pie>
                                     <Tooltip />
                                  </PieChart>
                               ) : (
                                  <AreaChart data={viz.data}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0"/>
                                    <XAxis dataKey={viz.xAxisKey} axisLine={false} tickLine={false} fontSize={12}/>
                                    <YAxis axisLine={false} tickLine={false} fontSize={12}/>
                                    <Tooltip />
                                    <Area type="monotone" dataKey={viz.dataKey} stroke="#6366f1" fill="#e0e7ff" />
                                  </AreaChart>
                               )}
                            </ResponsiveContainer>
                         </div>
                      </div>
                    ))
                  )}
               </div>
            )}

            {/* AGENTS TAB */}
            {activeTab === 'agents' && (
               <div className="p-6 space-y-6 h-full overflow-y-auto">
                  <div className="bg-white p-4 rounded-xl border border-slate-200 mb-6">
                     <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Active Pipeline</h3>
                     <div className="flex flex-col gap-2 relative">
                        {/* Connecting Line */}
                        <div className="absolute left-4 top-4 bottom-4 w-0.5 bg-slate-100"></div>
                        
                        {Object.values(agents).map((agent) => (
                           <div key={agent.type} className="relative z-10 pl-8">
                               {/* Dot on line */}
                               <div className={`absolute left-[13px] top-3 w-2 h-2 rounded-full border-2 border-white ${agent.status === AgentStatus.WORKING ? 'bg-indigo-500 animate-ping' : agent.status === AgentStatus.COMPLETED ? 'bg-green-500' : 'bg-slate-300'}`}></div>
                               <AgentCard agent={agent} />
                           </div>
                        ))}
                     </div>
                  </div>
               </div>
            )}

            {/* FLASHCARDS TAB */}
            {activeTab === 'flashcards' && (
               <div className="p-6 space-y-4 h-full overflow-y-auto">
                  <div className="flex items-center justify-between mb-4">
                     <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider">Flashcards</h3>
                     <button
                       onClick={handleGenerateFlashcards}
                       className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-medium transition-colors"
                     >
                       <Icons.Plus size={14}/> Generate
                     </button>
                  </div>
                  
                  {flashcards.length === 0 ? (
                     <div className="text-center text-slate-400 mt-20">
                        <Icons.FileText size={48} className="mx-auto mb-4 opacity-20"/>
                        <p className="mb-2">No flashcards yet.</p>
                        <p className="text-xs">Click "Generate" to create flashcards from your workspace content.</p>
                     </div>
                  ) : (
                     <div className="space-y-4">
                        {flashcards.map((card, idx) => (
                           <div key={card.id} className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm hover:shadow-md transition-shadow">
                              <div className="flex items-start justify-between mb-2">
                                 <span className="text-xs font-medium text-slate-500">Card {idx + 1}</span>
                                 <button
                                   onClick={() => {
                                     setWorkspaceSlice(data => ({
                                       ...data,
                                       flashcards: data.flashcards.filter(c => c.id !== card.id)
                                     }));
                                   }}
                                   className="text-slate-400 hover:text-red-600 transition-colors"
                                 >
                                   <Icons.Trash size={14}/>
                                 </button>
                              </div>
                              <div className="space-y-3">
                                 <div className="bg-indigo-50 border-l-4 border-indigo-500 p-3 rounded">
                                    <div className="text-xs font-semibold text-indigo-700 uppercase tracking-wide mb-1">Front</div>
                                    <div className="text-sm text-slate-800">{card.front}</div>
                                 </div>
                                 <div className="bg-slate-50 border-l-4 border-slate-400 p-3 rounded">
                                    <div className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-1">Back</div>
                                    <div className="text-sm text-slate-800">{card.back}</div>
                                 </div>
                              </div>
                           </div>
                        ))}
                     </div>
                  )}
               </div>
            )}

         </div>
      </aside>
    </div>
  );
};
