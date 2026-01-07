
export interface KeyPoint {
  id: string;
  title: string;
  content: string;
  active: boolean;
}

export interface ChatbotConfig {
  botName: string;
  persona: string;
  language: string;
  keyPoints: KeyPoint[];
}

export interface Message {
  id: string;
  role: 'user' | 'bot' | 'system';
  text: string;
  timestamp: Date;
}
