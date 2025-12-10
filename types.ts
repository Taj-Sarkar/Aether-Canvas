export enum AgentType {
  ROUTER = 'Router',
  VISION = 'Vision Agent',
  STRUCTURER = 'Structurer',
  DATA_VIZ = 'Data Viz Agent',
  CODE = 'Code Assistant'
}

export enum AgentStatus {
  IDLE = 'idle',
  WORKING = 'working',
  COMPLETED = 'completed',
  ERROR = 'error'
}

export interface AgentState {
  type: AgentType;
  status: AgentStatus;
  message?: string;
}

export enum BlockType {
  TEXT = 'text',
  IMAGE = 'image',
  DATASET = 'dataset'
}

export interface BaseBlock {
  id: string;
  type: BlockType;
  title: string;
}

export interface TextBlock extends BaseBlock {
  type: BlockType.TEXT;
  content: string;
}

export interface ImageBlock extends BaseBlock {
  type: BlockType.IMAGE;
  src: string; // Base64 or URL
  mimeType: string;
}

export interface DatasetBlock extends BaseBlock {
  type: BlockType.DATASET;
  fileName: string;
  rowCount: number;
  columns: string[];
  description?: string;
}

export type CanvasBlock = TextBlock | ImageBlock | DatasetBlock;

export interface BreakdownData {
  summary: string;
  keyPoints: string[];
  actionItems: string[];
  tags: string[];
}

export interface ChartDataPoint {
  name: string;
  value: number;
  [key: string]: string | number;
}

export interface ChartConfig {
  type: 'bar' | 'line' | 'pie' | 'area';
  title: string;
  data: ChartDataPoint[];
  xAxisKey: string;
  dataKey: string;
}

export interface Message {
  id: string;
  role: 'user' | 'model';
  content: string;
  timestamp: number;
}

export interface Workspace {
  id: string;
  name: string;
  icon: string;
  lastActive: Date;
}

// Simple view routing options for the demo app
export type AppView = 'landing' | 'signin' | 'signup' | 'app';
