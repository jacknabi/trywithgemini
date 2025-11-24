export enum Role {
  USER = 'user',
  MODEL = 'model'
}

export interface ChatMessage {
  id: string;
  role: Role;
  text: string;
  image?: string; // base64 string
  isStreaming?: boolean;
}

export interface SendMessageParams {
  message: string;
  image?: File | null;
}
