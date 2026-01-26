import { NextRequest, NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Workspace from '@/lib/models/Workspace';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';

// GET all workspaces for the authenticated user
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const workspaces = await Workspace.find({ userId: payload.userId }).sort({ lastActive: -1 });

    return NextResponse.json({
      success: true,
      workspaces: workspaces.map(ws => ({
        id: ws._id.toString(),
        userId: ws.userId,
        name: ws.name,
        icon: ws.icon,
        lastActive: ws.lastActive,
        blocks: ws.blocks,
        chatHistory: ws.chatHistory,
        breakdown: ws.breakdown,
        visualizations: ws.visualizations,
        flashcards: ws.flashcards,
      })),
    });
  } catch (error: any) {
    console.error('Get workspaces error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch workspaces' }, { status: 500 });
  }
}

// POST create a new workspace
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { name, icon } = await req.json();

    if (!name) {
      return NextResponse.json({ error: 'Workspace name is required' }, { status: 400 });
    }

    const workspace = await Workspace.create({
      userId: payload.userId,
      name,
      icon: icon || 'layers',
      lastActive: new Date(),
      blocks: [],
      chatHistory: [
        {
          id: `${Date.now()}-greet`,
          role: 'model',
          content: 'New workspace ready. Add notes or ask anything.',
          timestamp: Date.now(),
        },
      ],
      breakdown: null,
      visualizations: [],
      flashcards: [],
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        userId: workspace.userId,
        name: workspace.name,
        icon: workspace.icon,
        lastActive: workspace.lastActive,
        blocks: workspace.blocks,
        chatHistory: workspace.chatHistory,
        breakdown: workspace.breakdown,
        visualizations: workspace.visualizations,
        flashcards: workspace.flashcards,
      },
    });
  } catch (error: any) {
    console.error('Create workspace error:', error);
    return NextResponse.json({ error: error.message || 'Failed to create workspace' }, { status: 500 });
  }
}

// PUT update a workspace
export async function PUT(req: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { id, name, blocks, chatHistory, breakdown, visualizations, flashcards } = await req.json();

    if (!id) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const workspace = await Workspace.findOne({ _id: id, userId: payload.userId });
    if (!workspace) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    // Update fields
    if (name !== undefined) workspace.name = name;
    if (blocks !== undefined) workspace.blocks = blocks;
    if (chatHistory !== undefined) workspace.chatHistory = chatHistory;
    if (breakdown !== undefined) workspace.breakdown = breakdown;
    if (visualizations !== undefined) workspace.visualizations = visualizations;
    if (flashcards !== undefined) workspace.flashcards = flashcards;
    workspace.lastActive = new Date();

    await workspace.save();

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id.toString(),
        userId: workspace.userId,
        name: workspace.name,
        icon: workspace.icon,
        lastActive: workspace.lastActive,
        blocks: workspace.blocks,
        chatHistory: workspace.chatHistory,
        breakdown: workspace.breakdown,
        visualizations: workspace.visualizations,
        flashcards: workspace.flashcards,
      },
    });
  } catch (error: any) {
    console.error('Update workspace error:', error);
    return NextResponse.json({ error: error.message || 'Failed to update workspace' }, { status: 500 });
  }
}

// DELETE a workspace
export async function DELETE(req: NextRequest) {
  try {
    await connectDB();
    
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Workspace ID is required' }, { status: 400 });
    }

    const result = await Workspace.deleteOne({ _id: id, userId: payload.userId });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Workspace not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Delete workspace error:', error);
    return NextResponse.json({ error: error.message || 'Failed to delete workspace' }, { status: 500 });
  }
}
