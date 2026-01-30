
export type MessageRole = 'user' | 'model' | 'system';

export interface Message {
  id: string;
  role: MessageRole;
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'video' | 'audio';
  metadata?: {
    imageUrl?: string;
    videoUrl?: string;
    audioUrl?: string;
    groundingUrls?: Array<{ title: string; uri: string }>;
  };
}

export type AspectRatio = "1:1" | "3:4" | "4:3" | "9:16" | "16:9";

export enum AppMode {
  CHAT = 'CHAT',
  LIVE = 'LIVE',
  IMAGE_GEN = 'IMAGE_GEN',
  VIDEO_GEN = 'VIDEO_GEN'
}

export interface PersonalizationSettings {
  baseStyle: string;
  warmth: 'More' | 'Default' | 'Less';
  enthusiasm: 'More' | 'Default' | 'Less';
  headersLists: 'More' | 'Default' | 'Less';
  emoji: 'More' | 'Default' | 'Less';
  customInstructions: string;
}

export interface ChatSession {
  id: string;
  title: string;
  messages: Message[];
  updatedAt: Date;
  appMode: AppMode;
  personalization?: PersonalizationSettings;
}

export interface ChatSessionSync {
  id: string;
  user_name: string;
  title: string;
  messages: any;
  updated_at: string;
  app_mode: string;
}
