export interface Message {
  author: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
  // Optional flag for messages visible locally until explicitly shared
  ephemeral?: boolean;
}
