import mongoose, { Schema, Model } from 'mongoose';
import { CanvasBlock, Message, BreakdownData, ChartConfig, Flashcard } from '../../types';

export interface IWorkspace {
  _id: string;
  userId: string;
  name: string;
  icon: string;
  lastActive: Date;
  blocks: CanvasBlock[];
  chatHistory: Message[];
  breakdown: BreakdownData | null;
  visualizations: ChartConfig[];
  flashcards: Flashcard[];
  createdAt: Date;
}

const WorkspaceSchema = new Schema<IWorkspace>({
  userId: {
    type: String,
    required: true,
    index: true,
  },
  name: {
    type: String,
    required: true,
  },
  icon: {
    type: String,
    default: 'layers',
  },
  lastActive: {
    type: Date,
    default: Date.now,
  },
  blocks: {
    type: Schema.Types.Mixed,
    default: [],
  },
  chatHistory: {
    type: Schema.Types.Mixed,
    default: [],
  },
  breakdown: {
    type: Schema.Types.Mixed,
    default: null,
  },
  visualizations: {
    type: Schema.Types.Mixed,
    default: [],
  },
  flashcards: {
    type: Schema.Types.Mixed,
    default: [],
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Workspace: Model<IWorkspace> = mongoose.models.Workspace || mongoose.model<IWorkspace>('Workspace', WorkspaceSchema);

export default Workspace;
