import { getAuthHeaders } from './authService';
import { CanvasBlock, Message, BreakdownData, ChartConfig, Flashcard } from '../types';

export interface WorkspaceData {
  id: string;
  userId: string;
  name: string;
  icon: string;
  lastActive: Date;
  blocks: CanvasBlock[];
  chatHistory: Message[];
  breakdown: BreakdownData | null;
  visualizations: ChartConfig[];
  flashcards: Flashcard[];
}

const API_BASE = '';

// Fetch all workspaces
export const fetchWorkspaces = async (): Promise<WorkspaceData[]> => {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (data.success) {
      return data.workspaces;
    }
    throw new Error(data.error || 'Failed to fetch workspaces');
  } catch (error: any) {
    console.error('Fetch workspaces error:', error);
    throw error;
  }
};

// Create workspace
export const createWorkspace = async (name: string, icon: string = 'layers'): Promise<WorkspaceData> => {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ name, icon }),
    });

    const data = await res.json();
    if (data.success) {
      return data.workspace;
    }
    throw new Error(data.error || 'Failed to create workspace');
  } catch (error: any) {
    console.error('Create workspace error:', error);
    throw error;
  }
};

// Update workspace
export const updateWorkspace = async (
  id: string,
  updates: Partial<Omit<WorkspaceData, 'id' | 'userId'>>
): Promise<WorkspaceData> => {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        ...getAuthHeaders(),
      },
      body: JSON.stringify({ id, ...updates }),
    });

    const data = await res.json();
    if (data.success) {
      return data.workspace;
    }
    throw new Error(data.error || 'Failed to update workspace');
  } catch (error: any) {
    console.error('Update workspace error:', error);
    throw error;
  }
};

// Delete workspace
export const deleteWorkspace = async (id: string): Promise<void> => {
  try {
    const res = await fetch(`${API_BASE}/api/workspaces?id=${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });

    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Failed to delete workspace');
    }
  } catch (error: any) {
    console.error('Delete workspace error:', error);
    throw error;
  }
};
