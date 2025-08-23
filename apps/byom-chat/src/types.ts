export interface Message {
  author: string;
  role: 'user' | 'assistant';
  text: string;
  ts: number;
}
