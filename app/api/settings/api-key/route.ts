import { NextRequest, NextResponse } from 'next/server';
import User from '@/lib/models/User';
import dbConnect from '@/lib/mongodb';
import { verifyToken, extractTokenFromHeader } from '@/lib/auth';
import crypto from 'crypto';

// Encryption key - in production, use environment variable
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || 'your-32-character-secret-key!!'; // Must be 32 chars
const ALGORITHM = 'aes-256-cbc';

// Encrypt function
function encrypt(text: string): string {
  const iv = crypto.randomBytes(16);
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  let encrypted = cipher.update(text, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}

// Decrypt function
function decrypt(text: string): string {
  const parts = text.split(':');
  const iv = Buffer.from(parts[0], 'hex');
  const encryptedText = parts[1];
  const key = Buffer.from(ENCRYPTION_KEY.padEnd(32, '0').slice(0, 32));
  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}

// Mask API key for display
function maskApiKey(apiKey: string): string {
  if (!apiKey || apiKey.length < 8) return '••••••••••••••••';
  return apiKey.slice(0, 4) + '••••••••••••' + apiKey.slice(-4);
}

// GET - Check if user has API key
export async function GET(req: NextRequest) {
  try {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const hasKey = !!user.apiKey;
    const maskedKey = hasKey && user.apiKey ? maskApiKey(decrypt(user.apiKey)) : '';

    return NextResponse.json({ hasKey, maskedKey });
  } catch (error) {
    console.error('Error fetching API key status:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST - Save/Update API key
export async function POST(req: NextRequest) {
  try {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const { apiKey } = await req.json();

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json({ error: 'Invalid API key' }, { status: 400 });
    }

    await dbConnect();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Encrypt and save the API key
    const encryptedKey = encrypt(apiKey.trim());
    user.apiKey = encryptedKey;
    await user.save();

    const maskedKey = maskApiKey(apiKey.trim());

    return NextResponse.json({ 
      success: true, 
      message: 'API key saved successfully',
      maskedKey 
    });
  } catch (error) {
    console.error('Error saving API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE - Remove API key
export async function DELETE(req: NextRequest) {
  try {
    // Auth Check
    const authHeader = req.headers.get('authorization');
    const token = extractTokenFromHeader(authHeader);

    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const payload = verifyToken(token);
    if (!payload?.userId) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    await dbConnect();
    const user = await User.findById(payload.userId);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    user.apiKey = '';
    await user.save();

    return NextResponse.json({ 
      success: true, 
      message: 'API key removed successfully' 
    });
  } catch (error) {
    console.error('Error removing API key:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

