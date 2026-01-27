'use client';
import React, { useState, useEffect, type ChangeEvent } from 'react';
import { Icons } from './ui/Icons';
import './AppShell.css';
import { ProfileModal } from './ProfileModal';
import { 
  AgentState, AgentType, AgentStatus, 
  CanvasBlock, BlockType, TextBlock, ImageBlock, DatasetBlock, 
  BreakdownData, ChartConfig, Message, Workspace, Flashcard
} from '../types';
import { analyzeTextStructure, analyzeImage, generateChartRecommendation, chatWithWorkspace, isApiConfigured } from '../services/geminiService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area, PieChart, Pie, Cell } from 'recharts';

// --- Sub-Components ---

const COLORS = ['#4f46e5', '#818cf8', '#c7d2fe', '#312e81', '#6366f1'];

const AgentCard = ({ agent }: { agent: AgentState }) => {
  const isWorking = agent.status === AgentStatus.WORKING;
  const isCompleted = agent.status === AgentStatus.COMPLETED;
  
  return (
    <div style={{
      padding: '12px',
      borderRadius: '8px',
      border: '1px solid var(--app-panel-border)',
      background: isWorking ? 'rgba(112, 0, 255, 0.1)' : 'var(--app-input-bg)',
      transition: 'all 0.3s',
      transform: isWorking ? 'scale(1.02)' : 'scale(1)'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
        <div style={{
          width: '32px',
          height: '32px',
          borderRadius: '50%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isWorking ? 'var(--app-accent-primary)' : 'var(--app-input-bg)',
          color: isWorking ? '#fff' : 'var(--app-text-muted)',
          animation: isWorking ? 'pulse 2s infinite' : 'none'
        }}>
          {agent.type === AgentType.VISION && <Icons.Eye size={16} />}
          {agent.type === AgentType.STRUCTURER && <Icons.Layout size={16} />}
          {agent.type === AgentType.DATA_VIZ && <Icons.BarChart size={16} />}
          {agent.type === AgentType.CODE && <Icons.Code size={16} />}
          {agent.type === AgentType.ROUTER && <Icons.Sparkles size={16} />}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: '0.9rem', fontWeight: 500, color: 'var(--app-text-main)', marginBottom: '4px' }}>{agent.type}</p>
          <p style={{ fontSize: '0.75rem', color: 'var(--app-text-muted)' }}>
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
  user: { id: string; email: string; name: string; bio?: string; banner?: string; avatar?: string };
  onLogout: () => void;
}

export const AppShell = ({ user, onLogout }: AppShellProps) => {
  // --- State ---
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const [activeTab, setActiveTab] = useState<'chat' | 'breakdown' | 'viz' | 'agents' | 'flashcards'>('chat');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userProfile, setUserProfile] = useState({
    name: user.name,
    email: user.email,
    banner: user.banner || '',
    bio: user.bio || 'Creative Explorer',
    avatar: user.avatar || ''
  });
  
  type WorkspaceData = {
    blocks: CanvasBlock[];
    chatHistory: Message[];
    breakdown: BreakdownData | null;
    visualizations: ChartConfig[];
    flashcards: Flashcard[];
  };
  
  const initialWorkspaceData: WorkspaceData = {
    blocks: [],
    chatHistory: [
      { id: '0', role: 'model', content: "Hello! I'm ready to help you organize this workspace.", timestamp: Date.now() }
    ],
    breakdown: null,
    visualizations: [],
    flashcards: [],
  };
  
  const [workspaceData, setWorkspaceData] = useState<Record<string, WorkspaceData>>({});
  const [chatInput, setChatInput] = useState('');
  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string>('ws-1');
  const [workspaceMenuId, setWorkspaceMenuId] = useState<string | null>(null);
  const [blockMenuId, setBlockMenuId] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  
  // Agent States
  const [agents, setAgents] = useState<Record<string, AgentState>>({
    [AgentType.VISION]: { type: AgentType.VISION, status: AgentStatus.IDLE },
    [AgentType.STRUCTURER]: { type: AgentType.STRUCTURER, status: AgentStatus.IDLE },
    [AgentType.DATA_VIZ]: { type: AgentType.DATA_VIZ, status: AgentStatus.IDLE },
    [AgentType.CODE]: { type: AgentType.CODE, status: AgentStatus.IDLE },
  });

  // Sync state with user prop (important for re-login or background updates)
  useEffect(() => {
    setUserProfile({
      name: user.name,
      email: user.email,
      banner: user.banner || '',
      bio: user.bio || 'Creative Explorer',
      avatar: user.avatar || ''
    });
  }, [user]);

  // Load workspaces from database on mount
  useEffect(() => {
    const loadWorkspaces = async () => {
      try {
        const { fetchWorkspaces } = await import('../services/workspaceService');
        const fetchedWorkspaces = await fetchWorkspaces();
        
        if (fetchedWorkspaces.length === 0) {
          // Create initial workspace if none exist
          const { createWorkspace } = await import('../services/workspaceService');
          const newWorkspace = await createWorkspace('My First Workspace');
          setWorkspaces([{ id: newWorkspace.id, name: newWorkspace.name, icon: newWorkspace.icon, lastActive: newWorkspace.lastActive }]);
          setWorkspaceData({ [newWorkspace.id]: {
            blocks: newWorkspace.blocks,
            chatHistory: newWorkspace.chatHistory,
            breakdown: newWorkspace.breakdown,
            visualizations: newWorkspace.visualizations,
            flashcards: newWorkspace.flashcards,
          }});
          setActiveWorkspaceId(newWorkspace.id);
        } else {
          setWorkspaces(fetchedWorkspaces.map(ws => ({ id: ws.id, name: ws.name, icon: ws.icon, lastActive: ws.lastActive })));
          const dataMap: Record<string, WorkspaceData> = {};
          fetchedWorkspaces.forEach(ws => {
            dataMap[ws.id] = {
              blocks: ws.blocks,
              chatHistory: ws.chatHistory,
              breakdown: ws.breakdown,
              visualizations: ws.visualizations,
              flashcards: ws.flashcards,
            };
          });
          setWorkspaceData(dataMap);
          setActiveWorkspaceId(fetchedWorkspaces[0].id);
        }
      } catch (error) {
        console.error('Failed to load workspaces:', error);
      } finally {
        setLoading(false);
      }
    };
    loadWorkspaces();
  }, []);

  // Auto-save workspace changes (debounced)
  useEffect(() => {
    if (!activeWorkspaceId || loading) return;
    
    const saveTimeout = setTimeout(async () => {
      try {
        const { updateWorkspace } = await import('../services/workspaceService');
        const data = workspaceData[activeWorkspaceId];
        if (data) {
          await updateWorkspace(activeWorkspaceId, {
            blocks: data.blocks,
            chatHistory: data.chatHistory,
            breakdown: data.breakdown,
            visualizations: data.visualizations,
            flashcards: data.flashcards,
          });
        }
      } catch (error) {
        console.error('Failed to auto-save workspace:', error);
      }
    }, 1000); // Debounce 1 second

    return () => clearTimeout(saveTimeout);
  }, [workspaceData, activeWorkspaceId, loading]);

  // Theme effect
  useEffect(() => {
    if (theme === 'light') {
      document.documentElement.setAttribute('data-theme', 'light');
    } else {
      document.documentElement.removeAttribute('data-theme');
    }
  }, [theme]);

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

  const handleCreateWorkspace = async () => {
    const name = window.prompt('Workspace name?');
    if (!name || !name.trim()) return;
    
    try {
      const { createWorkspace } = await import('../services/workspaceService');
      const newWorkspace = await createWorkspace(name.trim());
      setWorkspaces(prev => [...prev, { id: newWorkspace.id, name: newWorkspace.name, icon: newWorkspace.icon, lastActive: newWorkspace.lastActive }]);
      setWorkspaceData(prev => ({
        ...prev,
        [newWorkspace.id]: {
          blocks: newWorkspace.blocks,
          chatHistory: newWorkspace.chatHistory,
          breakdown: newWorkspace.breakdown,
          visualizations: newWorkspace.visualizations,
          flashcards: newWorkspace.flashcards,
        },
      }));
      setActiveWorkspaceId(newWorkspace.id);
    } catch (error) {
      console.error('Failed to create workspace:', error);
      alert('Failed to create workspace. Please try again.');
    }
  };

  const handleRenameWorkspace = async (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    const name = window.prompt('Rename workspace', ws.name);
    if (name === null || !name.trim()) return;
    
    try {
      const { updateWorkspace } = await import('../services/workspaceService');
      await updateWorkspace(id, { name: name.trim() });
      setWorkspaces(prev => prev.map(w => (w.id === id ? { ...w, name: name.trim() } : w)));
    } catch (error) {
      console.error('Failed to rename workspace:', error);
      alert('Failed to rename workspace. Please try again.');
    }
  };

  const handleDeleteWorkspace = async (id: string) => {
    const ws = workspaces.find(w => w.id === id);
    if (!ws) return;
    if (workspaces.length <= 1) {
      alert('Keep at least one workspace.');
      return;
    }
    if (!window.confirm(`Delete workspace "${ws.name}"?`)) return;
    
    try {
      const { deleteWorkspace } = await import('../services/workspaceService');
      await deleteWorkspace(id);
      const next = workspaces.filter(w => w.id !== id);
      setWorkspaces(next);
      if (activeWorkspaceId === id) {
        setActiveWorkspaceId(next[0]?.id || '');
      }
    } catch (error) {
      console.error('Failed to delete workspace:', error);
      alert('Failed to delete workspace. Please try again.');
    }
  };

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
       const isDataUrl = block.src.startsWith('data:');
       let base64 = '';
       let description = '';
       
       if (isDataUrl) {
          base64 = block.src.split(',')[1];
       } else {
          if(block.src.includes('picsum')) {
             await new Promise(r => setTimeout(r, 1500));
             description = "The image appears to be a random landscape or abstract scene (placeholder). It contains natural colors and lighting.";
             
             // Update the block with analysis
             setWorkspaceSlice(data => ({
               ...data,
               blocks: data.blocks.map(b => 
                 b.id === block.id 
                   ? { ...b, analysis: description } as ImageBlock
                   : b
               )
             }));
             
             updateAgent(AgentType.VISION, AgentStatus.COMPLETED);
             return;
          }
       }

       description = await analyzeImage(base64, block.mimeType, "Describe this image in detail.");
       
       // Update the block with analysis
       setWorkspaceSlice(data => ({
         ...data,
         blocks: data.blocks.map(b => 
           b.id === block.id 
             ? { ...b, analysis: description } as ImageBlock
             : b
         )
       }));
       
       updateAgent(AgentType.VISION, AgentStatus.COMPLETED);
     } catch (e) {
       updateAgent(AgentType.VISION, AgentStatus.ERROR);
     }
  };

  // --- MARKDOWN PARSER ---
  const renderMarkdown = (text: string) => {
    let html = text
      // Headers
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      // Bold
      .replace(/\*\*(.*?)\*\*/g, '<b>$1</b>')
      // Code blocks
      .replace(/```([\s\S]*?)```/g, '<pre><code>$1</code></pre>')
      // Lists
      .replace(/^\s*-\s+(.*$)/gim, '<li>$1</li>')
      // Line breaks (handle careful not to break HTML)
      .replace(/\n/g, '<br/>');
      
    // Wrap lists in ul (simple heuristic for consecutive li)
    // Note: This is a basic parser. For perfection, use a library. 
    // This simple replace might leave loose <li> if not careful, 
    // but for this restricted AI output it usually suffices or requires a second pass.
    
    return html;
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
    setActiveTab('chat');
    setIsGenerating(true);

    const context = currentData.blocks.map(b => {
      if(b.type === BlockType.TEXT) return `Note (${b.title}): ${(b as TextBlock).content}`;
      if(b.type === BlockType.DATASET) return `Dataset (${b.title}): ${(b as DatasetBlock).description}`;
      return `Image (${b.title})`;
    }).join('\\n');
    
    // Instructions for structure
    const systemPrompt = `\n\nAnswer the user's request based on the context above. 
    Format your response using Markdown: use ### for headers, - for lists, ** for bold, and \`\`\` for code. 
    Keep it clean and easy to read.`;

    try {
       const responseText = await chatWithWorkspace(currentData.chatHistory, message, context + systemPrompt);
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
    } finally {
       setIsGenerating(false);
    }
  };

  const handleChat = async () => {
    if(!chatInput.trim()) return;
    await sendChat(chatInput);
  };

  const handleAskNote = async (block: TextBlock) => {
    const lines = (block.content || '').split('\\n').filter(Boolean);
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
    setIsGeneratingFlashcards(true);
    
    const context = [
      ...blocks.map(b => {
        if(b.type === BlockType.TEXT) return `Note (${b.title}): ${(b as TextBlock).content}`;
        if(b.type === BlockType.DATASET) return `Dataset (${b.title}): ${(b as DatasetBlock).description}`;
        return `Image (${b.title})`;
      }),
      ...chatHistory.slice(-5).map(m => `${m.role === 'user' ? 'User' : 'AI'}: ${m.content}`)
    ].join('\n\n');

    const prompt = `Generate flashcards from the content. Extract key concepts.
    Return a STRICT JSON Array of objects: [{"front": "Question...", "back": "Answer..."}]. 
    Do not use markdown formatting (no \`\`\`json). Just the raw JSON array.`;

    try {
      let responseText = await chatWithWorkspace([], prompt, context);
      // cleanup potential markdown code blocks if the AI ignores strict instruction
      responseText = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
      
      let newFlashcards: Flashcard[] = [];
      
      try {
        const parsed = JSON.parse(responseText);
        if(Array.isArray(parsed)) {
            newFlashcards = parsed.map((card: any, idx: number) => ({
                id: `${Date.now()}-${idx}`,
                front: card.front || "Review this",
                back: card.back || "No content"
            }));
        }
      } catch(e) {
          console.warn("JSON parse failed, trying regex fallback", e);
          // Fallback to regex if JSON fails
          const flashcardBlocks = responseText.split('---').filter(block => block.trim());
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
      }

      if (newFlashcards.length > 0) {
        setWorkspaceSlice(data => ({ 
          ...data, 
          flashcards: [...data.flashcards, ...newFlashcards] 
        }));
      } else {
        setWorkspaceSlice(data => ({ 
          ...data, 
          flashcards: [...data.flashcards, {
            id: Date.now().toString(),
            front: 'Error generating',
            back: 'Could not parse response. Try again.',
          }]
        }));
      }
    } catch (e: any) {
      console.error('Flashcard generation error:', e);
      alert(`Failed to generate flashcards: ${e?.message || 'Unknown error'}`);
    } finally {
        setIsGeneratingFlashcards(false);
    }
  };

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

  const handleCodeTask = async (task: string) => {
    if (!task.trim()) return;
    
    // Clear input
    setChatInput(''); // Reusing chat input state or create a new local one if preferred. 
    // Let's create a local one in the render or just use prompt() for simplicity first, 
    // BUT the plan said "input area". Let's simply use a local variable in the UI state or add one.
    // For now we will add a local state for code input in the component.
  };
  
  // NOTE: We need a state for the code agent input. 
  // Let's add it at the top level first, but since I can't reach there in this chunk easily without re-reading,
  // I'll assume I can add it or just use a ref in the UI. 
  // Actually, I should probably add the state in a separate chunk.
  
  // Let's just implement the logic here assuming 'codePrompt' is passed or handled.
  // Wait, I can't add state comfortably in the middle. 
  // I will add the logic function here and usage in JSX.
  
  const executeCodeTask = async (promptText: string) => {
      resetAgents();
      setActiveTab('agents');
      updateAgent(AgentType.CODE, AgentStatus.WORKING, 'Generating code...');
      
      try {
        const systemContext = `You are a code generator. Generate ONLY the code requested, nothing else.
Do NOT include any explanations, introductions, or commentary.
Do NOT use markdown code fences (\`\`\`).
Return raw code only.`;
        
        let codeResult = await chatWithWorkspace([], promptText, systemContext);
        
        // Strip any markdown code fencing if present
        codeResult = codeResult
          .replace(/```[\w]*\n/g, '')  // Remove opening fence with language
          .replace(/```\n?/g, '')       // Remove closing fence
          .trim();
        
        const newBlock: TextBlock = {
            id: Date.now().toString(),
            type: BlockType.TEXT,
            title: `Code: ${promptText.slice(0, 20)}...`,
            content: codeResult
        };
        
        setWorkspaceSlice(data => ({ ...data, blocks: [...data.blocks, newBlock] }));
        updateAgent(AgentType.CODE, AgentStatus.COMPLETED, 'Code generated.');
      } catch(e) {
          updateAgent(AgentType.CODE, AgentStatus.ERROR, 'Failed to generate code.');
      }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  const handleUpdateProfile = async (data: { name: string; bio: string; banner: string; avatar: string }) => {
    // 1. Optimistic UI update
    setUserProfile(prev => ({ ...prev, ...data }));

    try {
      // 2. Persist to backend
      const { updateProfile } = await import('../services/authService');
      const response = await updateProfile(data);
      
      if (response.success && response.user) {
        // 3. Confirm with server data
        setUserProfile({
          name: response.user.name,
          email: response.user.email,
          banner: response.user.banner || '',
          bio: response.user.bio || '',
          avatar: response.user.avatar || ''
        });
      } else {
        // Revert (or alert) on failure
        console.error('Failed to save profile:', response.error);
        alert('Failed to save profile changes. Please try again.');
      }
    } catch (error) {
       console.error('Error updating profile:', error);
    }
  };

  return (
  <div className="app-shell-root">
      {/* Background Elements */}
      <div className="ambient-mesh">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
      </div>

      <div className="app-container">
        {/* LEFT SIDEBAR */}
        <aside className="sidebar-left glass-panel">
          <div>
            <div className="brand" style={{ cursor: 'default' }}>
              <div className="brand-icon"><Icons.Brain size={18} /></div>
              <span>Aether Canvas</span>
            </div>

            <div className="nav-group">
              <div className="nav-label">Workspaces</div>
              {workspaces.map(ws => (
                <div
                  key={ws.id}
                  className={`nav-item ${ws.id === activeWorkspaceId ? 'active' : ''}`}
                  onClick={() => { setActiveWorkspaceId(ws.id); setWorkspaceMenuId(null); }}
                >
                  <div className="nav-item-content">
                    <Icons.Layers size={16} />
                    <span className="nav-item-text">{ws.name}</span>
                  </div>
                  <div onClick={(e) => { e.stopPropagation(); setWorkspaceMenuId(workspaceMenuId === ws.id ? null : ws.id); }} style={{ position: 'relative' }}>
                    <Icons.MoreHorizontal size={14} />
                    {workspaceMenuId === ws.id && (
                      <div style={{
                        position: 'absolute',
                        right: 0,
                        marginTop: '4px',
                        width: '120px',
                        background: 'var(--app-panel-bg)',
                        border: '1px solid var(--app-panel-border)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        zIndex: 20
                      }}>
                        <div onClick={() => { setWorkspaceMenuId(null); handleRenameWorkspace(ws.id); }} style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', color: 'var(--app-text-main)' }}>Rename</div>
                        <div onClick={() => { setWorkspaceMenuId(null); handleDeleteWorkspace(ws.id); }} style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', color: '#ff6b6b' }}>Delete</div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div className="nav-item new-workspace" onClick={handleCreateWorkspace}>
                <div className="nav-item-content">
                  <Icons.Plus size={16} />
                  <span className="nav-item-text">New Workspace</span>
                </div>
              </div>
            </div>

            <div className="nav-group">
              <div className="nav-label">Assets</div>
              {blocks.slice(0, 5).map(b => (
                 <div key={b.id} className="nav-item">
                    <div className="nav-item-content">
                      {b.type === BlockType.TEXT && <Icons.FileText size={14}/>}
                      {b.type === BlockType.IMAGE && <Icons.Image size={14}/>}
                      {b.type === BlockType.DATASET && <Icons.Database size={14}/>}
                      <span className="nav-item-text">{b.title}</span>
                    </div>
                 </div>
              ))}
            </div>
          </div>

          <div 
            className="user-profile" 
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            style={{ cursor: 'pointer', position: 'relative' }}
          >
            <div className="avatar" style={{ overflow: 'hidden' }}>
              {userProfile.avatar ? (
                <img src={userProfile.avatar} alt="Avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                user.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{userProfile.name}</div>
            </div>
            <div className="theme-toggle" onClick={(e) => { e.stopPropagation(); toggleTheme(); }} title="Toggle Theme">
              {theme === 'dark' ? <Icons.Moon size={16} /> : <Icons.Sun size={16} />}
            </div>
            
            {userMenuOpen && (
              <div style={{
                position: 'absolute',
                bottom: '100%',
                left: '0',
                width: '100%',
                marginBottom: '10px',
                background: 'var(--app-panel-bg)',
                border: '1px solid var(--app-panel-border)',
                borderRadius: '12px',
                boxShadow: '0 4px 20px rgba(0,0,0,0.3)',
                padding: '8px',
                zIndex: 100,
                backdropFilter: 'blur(10px)',
                animation: 'fadeUp 0.2s ease-out'
              }} onClick={e => e.stopPropagation()}>
                
                {/* Profile Section */}
                <div style={{ 
                  padding: '12px', 
                  marginBottom: '8px', 
                  background: 'rgba(255,255,255,0.03)', 
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px'
                }}>
                   <div style={{
                     width: '36px',
                     height: '36px',
                     borderRadius: '50%',
                     background: 'linear-gradient(135deg, var(--app-accent-primary), var(--app-accent-secondary))',
                     display: 'flex',
                     alignItems: 'center',
                     justifyContent: 'center',
                     color: 'white',
                     fontWeight: 'bold'
                   }}>
                     {user.name.charAt(0).toUpperCase()}
                   </div>
                   <div style={{ overflow: 'hidden' }}>
                     <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--app-text-main)' }}>{userProfile.name}</div>
                     <div style={{ fontSize: '0.75rem', color: 'var(--app-text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.email}</div>
                   </div>
                </div>

                <div 
                  className="menu-item"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: 'var(--app-text-main)',
                    transition: 'background 0.2s',
                    fontSize: '0.9rem'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.05)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => { setUserMenuOpen(false); setIsProfileOpen(true); }}
                >
                  <Icons.User size={16} />
                  <span>My Profile</span>
                </div>

                <div 
                  className="menu-item"
                  style={{
                    padding: '10px 12px',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    color: '#ff6b6b',
                    transition: 'background 0.2s',
                    fontSize: '0.9rem',
                    marginTop: '4px'
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255, 107, 107, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  onClick={() => onLogout()}
                >
                  <Icons.LogOut size={16} />
                  <span>Log Out</span>
                </div>
              </div>
            )}
          </div>
        </aside>

        {/* MAIN CONTENT */}
        <main className="main-content glass-panel">
          <header className="top-bar">
            <div className="breadcrumb">{activeWorkspace?.name || 'Workspace'}</div>
            <div className="top-bar-actions">
              <label className="btn" style={{ cursor: 'pointer' }}>
                <Icons.Upload size={16} /> Upload
                <input type="file" style={{ display: 'none' }} onChange={handleFileUpload} accept="image/*,.csv" />
              </label>
              <button onClick={() => handleAddBlock(BlockType.TEXT)} className="btn btn-primary">
                <Icons.Plus size={16}/> Note
              </button>
            </div>
          </header>

          <div className="editor-area">
             {blocks.map((block) => (
               <div key={block.id} className="note-card">
                  <div className="note-header">
                     {block.type === BlockType.TEXT && <Icons.FileText size={18}/>}
                     {block.type === BlockType.IMAGE && <Icons.Image size={18}/>}
                     {block.type === BlockType.DATASET && <Icons.Database size={18}/>}
                     <span className="note-title">{block.title}</span>
                     <span className="note-time">Just now</span>
                     <div style={{ marginLeft: '8px', cursor: 'pointer', position: 'relative' }} onClick={() => setBlockMenuId(blockMenuId === block.id ? null : block.id)}>
                       <Icons.MoreHorizontal size={16}/>
                       {blockMenuId === block.id && (
                         <div style={{
                           position: 'absolute',
                           right: 0,
                           marginTop: '4px',
                           width: '100px',
                           background: 'var(--app-panel-bg)',
                           border: '1px solid var(--app-panel-border)',
                           borderRadius: '8px',
                           overflow: 'hidden',
                           zIndex: 20
                         }}>
                           <div onClick={(e) => { e.stopPropagation(); setBlockMenuId(null); handleDeleteBlock(block.id); }} style={{ padding: '8px 12px', fontSize: '0.85rem', cursor: 'pointer', color: '#ff6b6b', display: 'flex', alignItems: 'center', gap: '6px' }}>
                             <Icons.Trash size={14}/> Delete
                           </div>
                         </div>
                       )}
                     </div>
                  </div>

                  {block.type === BlockType.TEXT && (
                    <div>
                       <textarea 
                         className="note-textarea"
                         value={(block as TextBlock).content}
                         onChange={(e) => {
                            setWorkspaceSlice(data => {
                              const newBlocks = data.blocks.map(b => b.id === block.id ? { ...b, content: e.target.value } as CanvasBlock : b);
                              return { ...data, blocks: newBlocks };
                            });
                         }}
                       />
                       <div className="ai-actions">
                          <div className="ai-chip" onClick={() => handleAnalyzeText(block as TextBlock)}>
                            <Icons.Sparkles size={12}/> Analyze & Organize
                          </div>
                          <div className="ai-chip" onClick={() => handleAskNote(block as TextBlock)}>
                            <Icons.MessageSquare size={12}/> Ask in chat
                          </div>
                       </div>
                    </div>
                  )}

                  {block.type === BlockType.IMAGE && (
                    <div>
                       <div style={{ borderRadius: '8px', overflow: 'hidden', background: 'var(--app-input-bg)', maxHeight: '400px', display: 'flex', justifyContent: 'center', marginBottom: '16px' }}>
                          <img src={(block as ImageBlock).src} alt="Block content" style={{ objectFit: 'contain', maxHeight: '100%' }} />
                       </div>
                       
                       {(block as ImageBlock).analysis && (
                         <div style={{ 
                           background: 'rgba(0, 219, 222, 0.08)', 
                           border: '1px solid var(--app-accent-secondary)',
                           borderRadius: '8px',
                           padding: '16px',
                           marginBottom: '16px'
                         }}>
                           <div style={{ 
                             fontSize: '0.75rem', 
                             fontWeight: 600, 
                             color: 'var(--app-accent-secondary)', 
                             textTransform: 'uppercase', 
                             letterSpacing: '0.1em', 
                             marginBottom: '8px',
                             display: 'flex',
                             alignItems: 'center',
                             gap: '6px'
                           }}>
                             <Icons.Eye size={14} /> Vision Analysis
                           </div>
                           <div style={{ 
                             fontSize: '0.9rem', 
                             color: 'var(--app-text-main)', 
                             lineHeight: '1.6' 
                           }} dangerouslySetInnerHTML={{ __html: renderMarkdown((block as ImageBlock).analysis!) }} />
                         </div>
                       )}
                       
                       <div className="ai-actions">
                          <div className="ai-chip" onClick={() => handleAnalyzeImage(block as ImageBlock)}>
                            <Icons.Eye size={12}/> {(block as ImageBlock).analysis ? 'Re-analyze' : 'Analyze'}
                          </div>
                          {(block as ImageBlock).analysis && (
                            <>
                              <div className="ai-chip" onClick={() => {
                                const analysisBlock: TextBlock = {
                                  id: Date.now().toString(),
                                  type: BlockType.TEXT,
                                  title: `Analysis: ${block.title}`,
                                  content: (block as ImageBlock).analysis || '',
                                };
                                handleAnalyzeText(analysisBlock);
                              }}>
                                <Icons.Sparkles size={12}/> Analyze & Organize
                              </div>
                              <div className="ai-chip" onClick={() => {
                                const prompt = `Question about image "${block.title}": ${(block as ImageBlock).analysis}`;
                                sendChat(prompt);
                              }}>
                                <Icons.MessageSquare size={12}/> Ask in chat
                              </div>
                            </>
                          )}
                       </div>
                    </div>
                  )}

                  {block.type === BlockType.DATASET && (
                     <div>
                       <div style={{ display: 'flex', gap: '16px', padding: '16px', background: 'var(--app-input-bg)', borderRadius: '8px', border: '1px solid var(--app-panel-border)', marginBottom: '16px' }}>
                          <div style={{ background: 'var(--app-panel-bg)', padding: '12px', borderRadius: '8px', border: '1px solid var(--app-panel-border)', color: 'var(--app-accent-secondary)' }}>
                             <Icons.FileJson size={24} />
                          </div>
                          <div style={{ flex: 1 }}>
                             <p style={{ fontWeight: 500, color: 'var(--app-text-main)', marginBottom: '4px' }}>{(block as DatasetBlock).fileName}</p>
                             <p style={{ fontSize: '0.85rem', color: 'var(--app-text-muted)', marginBottom: '8px' }}>{(block as DatasetBlock).rowCount} rows • {(block as DatasetBlock).columns.join(', ')}</p>
                             <p style={{ fontSize: '0.75rem', color: 'var(--app-text-muted)' }}>{(block as DatasetBlock).description}</p>
                          </div>
                       </div>
                       <div className="ai-actions">
                         <div className="ai-chip" onClick={() => handleRecommendCharts(block as DatasetBlock)}>
                           <Icons.BarChart size={12} /> Recommend Charts
                         </div>
                         <div className="ai-chip" onClick={() => {
                           const datasetText: TextBlock = {
                             id: Date.now().toString(),
                             type: BlockType.TEXT,
                             title: `Dataset Analysis: ${block.title}`,
                             content: `Dataset: ${(block as DatasetBlock).fileName}\nRows: ${(block as DatasetBlock).rowCount}\nColumns: ${(block as DatasetBlock).columns.join(', ')}\nDescription: ${(block as DatasetBlock).description || 'No description'}`,
                           };
                           handleAnalyzeText(datasetText);
                         }}>
                           <Icons.Sparkles size={12} /> Analyze & Organize
                         </div>
                         <div className="ai-chip" onClick={() => {
                           const prompt = `Question about dataset "${block.title}": ${(block as DatasetBlock).description || `File with ${(block as DatasetBlock).rowCount} rows and columns: ${(block as DatasetBlock).columns.join(', ')}`}`;
                           sendChat(prompt);
                         }}>
                           <Icons.MessageSquare size={12} /> Ask in chat
                         </div>
                       </div>
                     </div>
                  )}
               </div>
             ))}
          </div>
        </main>

        {/* RIGHT SIDEBAR (AI) */}
        <aside className="sidebar-right glass-panel">
           <div className="tabs-header">
              {[
                { id: 'chat', icon: Icons.MessageSquare, label: 'Chat' },
                { id: 'breakdown', icon: Icons.Layers, label: 'Plan' },
                { id: 'viz', icon: Icons.BarChart, label: 'Visuals' },
                { id: 'agents', icon: Icons.Bot, label: 'Agents' },
                { id: 'flashcards', icon: Icons.FileText, label: 'Cards' },
              ].map(tab => (
                 <button 
                   key={tab.id}
                   onClick={() => setActiveTab(tab.id as any)}
                   className={`tab ${activeTab === tab.id ? 'active' : ''}`}
                 >
                   <tab.icon size={18} />
                   <span>{tab.label}</span>
                 </button>
              ))}
           </div>

           {/* CHAT TAB */}
           {activeTab === 'chat' && (
              <div style={{ display: 'flex', flexDirection: 'column', flex: 1, overflow: 'hidden' }}>
                 <div className="chat-container">
                    {chatHistory.map(msg => (
                       <div key={msg.id} className={`message ${msg.role === 'user' ? 'user' : 'ai'}`}>
                          {msg.role === 'model' && (
                            <div className="msg-meta">
                              <Icons.Bot size={12} /> Aether Agent
                            </div>
                          )}
                          <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start', width: '100%' }}>
                            {/* Use renderMarkdown instead of direct replace */}
                            <div className="msg-bubble markdown-content" style={{ flex: 1 }} dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }} />
                            {msg.role === 'model' && (
                              <div 
                                onClick={() => handlePinMessage(msg)}
                                style={{ 
                                  cursor: 'pointer', 
                                  padding: '4px',
                                  color: 'var(--app-text-muted)',
                                  transition: 'color 0.2s'
                                }}
                                onMouseEnter={(e) => e.currentTarget.style.color = 'var(--app-accent-secondary)'}
                                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--app-text-muted)'}
                                title="Pin to notes"
                              >
                                <Icons.Pin size={14} />
                              </div>
                            )}
                          </div>
                       </div>
                    ))}
                    
                    {/* LOADING DOTS */}
                    {isGenerating && (
                      <div className="message ai">
                         <div className="msg-meta">
                           <Icons.Bot size={12} /> Aether Agent
                         </div>
                         <div className="msg-bubble" style={{ width: 'fit-content' }}>
                            <div className="typing-dots">
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                              <div className="typing-dot"></div>
                            </div>
                         </div>
                      </div>
                    )}
                 </div>
                 <div className="input-area">
                    <div className="input-wrapper">
                      <textarea 
                        value={chatInput}
                        onChange={e => setChatInput(e.target.value)}
                        onKeyDown={e => { if(e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleChat(); }}}
                        placeholder="Ask about your workspace..."
                        className="chat-input"
                      />
                      <button onClick={handleChat} className="send-btn">
                        <Icons.Send size={16} />
                      </button>
                    </div>
                    <div className="context-bar">
                      <div className="context-info">
                        <div className="context-dot"></div>
                        Context aware of {blocks.length} blocks
                      </div>
                      <div className="context-info" style={{ cursor: 'pointer' }}>
                        <button className="btn" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={handleGenerateFlashcards}>
                          <Icons.FileText size={12}/> Generate Flashcards
                        </button>
                      </div>
                    </div>
                 </div>
              </div>
           )}

           {/* BREAKDOWN TAB */}
           {activeTab === 'breakdown' && (
              <div className="tab-content">
                 {!breakdown ? (
                   <div className="empty-state">
                      <Icons.Layers size={48} className="empty-state-icon"/>
                      <p>Select a text block and click "Analyze" to see a structured breakdown.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                      <div className="note-card">
                         <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Summary</h3>
                         <p style={{ color: 'var(--app-text-main)', lineHeight: 1.6 }}>{breakdown.summary}</p>
                      </div>

                      <div>
                         <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Key Points</h3>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(breakdown.keyPoints || []).map((pt, i) => (
                              <div key={i} style={{ display: 'flex', gap: '8px', padding: '12px', background: 'var(--app-input-bg)', borderRadius: '8px', border: '1px solid var(--app-panel-border)', fontSize: '0.9rem', color: 'var(--app-text-main)' }}>
                                <span style={{ color: 'var(--app-accent-secondary)' }}>•</span> {pt}
                              </div>
                            ))}
                         </div>
                      </div>

                      <div>
                         <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Action Items</h3>
                         <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {(breakdown.actionItems || []).map((item, i) => (
                              <div key={i} className="ai-chip" style={{ padding: '12px', justifyContent: 'flex-start' }}>
                                 <div style={{ width: '16px', height: '16px', borderRadius: '3px', border: '2px solid var(--app-accent-primary)' }}></div>
                                 {item}
                              </div>
                            ))}
                         </div>
                      </div>
                      
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                         {(breakdown.tags || []).map(tag => (
                            <span key={tag} className="ai-chip">#{tag}</span>
                         ))}
                      </div>
                   </div>
                 )}
              </div>
           )}

           {/* VIZ TAB */}
           {activeTab === 'viz' && (
              <div className="tab-content">
                 {visualizations.length === 0 ? (
                   <div className="empty-state">
                      <Icons.BarChart size={48} className="empty-state-icon"/>
                      <p>Upload a dataset and click "Recommend Charts" to generate visuals.</p>
                   </div>
                 ) : (
                   <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                     {visualizations.map((viz, idx) => (
                       <div key={idx} className="note-card">
                          <h4 style={{ fontWeight: 600, color: 'var(--app-text-main)', marginBottom: '16px' }}>{viz.title}</h4>
                          <div style={{ height: '250px', width: '100%' }}>
                             <ResponsiveContainer width="100%" height="100%">
                                {viz.type === 'bar' ? (
                                   <BarChart data={viz.data}>
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)"/>
                                     <XAxis dataKey={viz.xAxisKey} axisLine={false} tickLine={false} fontSize={11} tick={{fill: 'var(--app-text-muted)'}} dy={10}/>
                                     <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{fill: 'var(--app-text-muted)'}}/>
                                     <Tooltip contentStyle={{background: 'var(--app-panel-bg)', borderRadius: '8px', border: '1px solid var(--app-panel-border)'}}/>
                                     <Bar dataKey={viz.dataKey} fill="var(--app-accent-primary)" radius={[4, 4, 0, 0]} />
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
                                     <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.1)"/>
                                     <XAxis dataKey={viz.xAxisKey} axisLine={false} tickLine={false} fontSize={11} tick={{fill: 'var(--app-text-muted)'}}/>
                                     <YAxis axisLine={false} tickLine={false} fontSize={11} tick={{fill: 'var(--app-text-muted)'}}/>
                                     <Tooltip />
                                     <Area type="monotone" dataKey={viz.dataKey} stroke="var(--app-accent-primary)" fill="rgba(112, 0, 255, 0.2)" />
                                   </AreaChart>
                                )}
                             </ResponsiveContainer>
                          </div>
                       </div>
                     ))}
                   </div>
                 )}
              </div>
           )}

           {/* AGENTS TAB */}
           {activeTab === 'agents' && (
              <div className="tab-content">
                 <div className="note-card" style={{ marginBottom: '16px' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '16px' }}>Active Pipeline</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', position: 'relative' }}>
                       <div style={{ position: 'absolute', left: '16px', top: '16px', bottom: '16px', width: '2px', background: 'var(--app-panel-border)' }}></div>
                       
                       {Object.values(agents).map((agent) => (
                          <div key={agent.type} style={{ position: 'relative', zIndex: 10, paddingLeft: '40px' }}>
                              <div style={{
                                position: 'absolute',
                                left: '12px',
                                top: '12px',
                                width: '8px',
                                height: '8px',
                                borderRadius: '50%',
                                border: '2px solid var(--app-panel-bg)',
                                background: agent.status === AgentStatus.WORKING ? 'var(--app-accent-primary)' : agent.status === AgentStatus.COMPLETED ? '#2ed573' : 'var(--app-text-muted)',
                                animation: agent.status === AgentStatus.WORKING ? 'pulse 2s infinite' : 'none'
                              }}></div>
                              <AgentCard agent={agent} />
                          </div>
                       ))}
                    </div>
                 </div>

                 {/* CODE AGENT INPUT AREA */}
                 <div className="note-card">
                     <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '12px' }}>Code Agent Task</h3>
                     <textarea 
                       className="note-textarea" 
                       style={{ minHeight: '80px', fontSize: '0.85rem', marginBottom: '12px' }}
                       placeholder="e.g., Write a React component for a Navbar..."
                       id="code-agent-input"
                     />
                     <button 
                       className="btn btn-primary" 
                       style={{ width: '100%' }}
                       onClick={() => {
                           const input = document.getElementById('code-agent-input') as HTMLTextAreaElement;
                           if(input && input.value) {
                               executeCodeTask(input.value);
                               input.value = '';
                           }
                       }}
                     >
                       <Icons.Code size={16}/> Generate Code
                     </button>
                 </div>
              </div>
           )}

           {/* FLASHCARDS TAB */}
           {activeTab === 'flashcards' && (
              <div className="tab-content">
                 <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px', paddingBottom: '12px', borderBottom: '1px solid var(--app-panel-border)' }}>
                    <h3 style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Flashcards</h3>
                    <button className="btn btn-primary" onClick={handleGenerateFlashcards} style={{ padding: '6px 12px', fontSize: '0.8rem' }}>
                       <Icons.Plus size={14}/> Generate
                    </button>
                 </div>
                 
                 {flashcards.length === 0 ? (
                    <div className="empty-state">
                       <Icons.FileText size={48} className="empty-state-icon"/>
                       <p style={{ marginBottom: '8px' }}>No flashcards yet.</p>
                       <p style={{ fontSize: '0.75rem' }}>Click "Generate" to create flashcards from your workspace content.</p>
                    </div>
                 ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                       {flashcards.map((card, idx) => (
                          <div key={card.id} className="note-card">
                             <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.75rem', fontWeight: 500, color: 'var(--app-text-muted)' }}>Card {idx + 1}</span>
                                <div
                                  onClick={() => {
                                    setWorkspaceSlice(data => ({
                                      ...data,
                                      flashcards: data.flashcards.filter(c => c.id !== card.id)
                                    }));
                                  }}
                                  style={{ cursor: 'pointer', color: 'var(--app-text-muted)' }}
                                >
                                  <Icons.Trash size={14}/>
                                </div>
                             </div>
                             <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                                <div style={{ background: 'rgba(112, 0, 255, 0.1)', borderLeft: '4px solid var(--app-accent-primary)', padding: '12px', borderRadius: '6px' }}>
                                   <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-accent-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Front</div>
                                   <div style={{ fontSize: '0.9rem', color: 'var(--app-text-main)' }}>{card.front}</div>
                                </div>
                                <div style={{ background: 'var(--app-input-bg)', borderLeft: '4px solid var(--app-text-muted)', padding: '12px', borderRadius: '6px' }}>
                                   <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--app-text-muted)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '6px' }}>Back</div>
                                   <div style={{ fontSize: '0.9rem', color: 'var(--app-text-main)' }}>{card.back}</div>
                                </div>
                             </div>
                          </div>
                       ))}
                    </div>
                 )}

                 {/* FLASHCARD LOADING INDICATOR */}
                 {isGeneratingFlashcards && (
                     <div style={{ 
                         display: 'flex', 
                         flexDirection: 'column', 
                         alignItems: 'center', 
                         justifyContent: 'center', 
                         marginTop: '30px',
                         opacity: 0.8 
                     }}>
                         <div className="typing-dots">
                           <div className="typing-dot" style={{ backgroundColor: 'var(--app-accent-secondary)' }}></div>
                           <div className="typing-dot" style={{ backgroundColor: 'var(--app-accent-secondary)' }}></div>
                           <div className="typing-dot" style={{ backgroundColor: 'var(--app-accent-secondary)' }}></div>
                         </div>
                         <div style={{ marginTop: '10px', fontSize: '0.9rem', color: 'var(--app-text-muted)' }}>
                             Generating flashcards...
                         </div>
                     </div>
                 )}
              </div>
           )}

        </aside>
      </div>

      <ProfileModal 
        isOpen={isProfileOpen} 
        onClose={() => setIsProfileOpen(false)}
        user={{
          name: userProfile.name,
          email: userProfile.email,
          banner: userProfile.banner,
          bio: userProfile.bio,
          avatar: userProfile.avatar
        }}
        onUpdateUser={handleUpdateProfile}
      />
    </div>
  );
};
