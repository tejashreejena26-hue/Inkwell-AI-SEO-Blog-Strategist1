export interface BlogRequest {
  topic: string;
  keywords: string;
  tone: string;
  wordCount: number;
}

export interface BlogDraft {
  id: string;
  timestamp: number;
  request: BlogRequest;
  content: string;
}
