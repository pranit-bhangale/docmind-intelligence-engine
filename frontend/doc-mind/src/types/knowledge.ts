export type QueryType = 'NORMAL_QA' | 'DOCUMENT_SUMMARY' | 'TECHNICAL_INSIGHTS';

export interface KnowledgeChunk {
  id: string;
  chunkIndex: number;
  text: string;
  pageNumber?: number;
}

export interface KnowledgeDocument {
  id: string;
  name: string;
  extension: string;
  size: string;
  chunksCount: number;
  status: 'indexing' | 'indexed' | 'failed';
  uploadedAt: string;
  content?: string;
  chunks?: KnowledgeChunk[];
}

export interface UploadProgressState {
  fileName: string;
  progress: number;
  status: 'uploading' | 'indexing' | 'completed' | 'error';
  errorMessage?: string;
}

export interface SourceCitation {
  docId: string;
  docName: string;
  chunkRange: string;
  snippet?: string;
  section?: string;
  header?: string;
  content?: string;
  pageNumber?: number;
  chunkIndex?: number;
  previousChunkIndex?: number;
  nextChunkIndex?: number;
  similarityScore?: number;
}

export interface Citation {
  documentId?: string;
  fileName?: string;
  section?: string;
  header?: string;
  content?: string;
  pageNumber?: number;
  chunkIndex?: number;
  previousChunkIndex?: number;
  nextChunkIndex?: number;
  similarityScore?: number;
}

export interface ChatMessageItem {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: string;
  grounded?: boolean;
  sources?: SourceCitation[];
  citations?: Citation[];
  status?: 'streaming' | 'complete' | 'error';
  executionTime?: string;
  error?: string;
  queryType?: QueryType;
  provider?: string;
  ragConfig?: {
    provider: string;
    topK: number;
    threshold: number;
  };
}

export interface Conversation {
  id: string; // X-Conversation-Id UUID format
  title: string;
  createdAt: string;
  messages: ChatMessageItem[];
  contextDocIds: string[];
}

export interface RagSettings {
  provider: 'NVIDIA' | 'OLLAMA' | 'nvidia' | 'ollama';
  topK: number;
  similarityThreshold: number;
}



