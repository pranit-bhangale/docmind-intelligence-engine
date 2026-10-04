const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export interface QueryRequest {
  provider?: string;
  query: string;
  options?: {
    queryType?: string;
    retrieval?: {
      topK?: number;
      similarityThreshold?: number;
    };
    enableQueryRewriting?: boolean;
    enableRag?: boolean;
  };
}

export interface Citation {
  docId: string;
  docName: string;
  chunkRange: string;
  snippet: string;
}

export interface DetailedCitation {
  documentId?: string;
  fileName?: string;
  pageNumber?: number;
  chunkIndex?: number;
  previousChunkIndex?: number;
  nextChunkIndex?: number;
  similarityScore?: number;
}

export interface QueryResponse {
  answer: string;
  content?: string;
  grounded?: boolean;
  sources?: Citation[];
  citations?: DetailedCitation[];
}

export interface SseMessage {
  event: string;
  data: string;
  id?: string;
}

const isUUID = (str: string): boolean =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

export const toValidUUID = (str: string): string => {
  if (!str) return '00000000-0000-4000-8000-000000000001';
  if (isUUID(str)) return str;
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).padStart(8, '0');
  return `${hex.slice(0, 8)}-0000-4000-8000-${hex.padEnd(12, '0').slice(0, 12)}`;
};

/**
 * Parses raw SSE text stream into structured Server-Sent Events.
 * Handles 'event: message' and 'event: error' events from WebFlux.
 */
export function parseSseChunk(buffer: string): { events: SseMessage[]; remaining: string } {
  const normalized = buffer.replace(/\r\n/g, '\n');
  const blocks = normalized.split('\n\n');
  const remaining = blocks.pop() ?? '';
  const events: SseMessage[] = [];

  for (const block of blocks) {
    if (!block.trim()) continue;

    const lines = block.split('\n');
    let eventName = 'message';
    const dataParts: string[] = [];
    let id: string | undefined;

    for (const line of lines) {
      if (!line) continue;

      if (line.startsWith('event:')) {
        eventName = line.substring(6).trim();
      } else if (line.startsWith('data:')) {
        const rawData = line.substring(5);
        const cleanData = rawData === ' ' ? ' ' : rawData.startsWith(' ') ? rawData.substring(1) : rawData;
        dataParts.push(cleanData);
      } else if (line.startsWith('id:')) {
        id = line.substring(3).trim();
      }
    }

    if (dataParts.length > 0) {
      events.push({
        event: eventName,
        data: dataParts.join('\n'),
        id,
      });
    }
  }

  return { events, remaining };
}

export function mapRawCitations(rawCitations: any[], safeDocId: string): Citation[] {
  if (!Array.isArray(rawCitations)) return [];
  return rawCitations.map((c: any) => {
    const scoreVal = c.similarityScore ?? c.score;
    const scorePercent =
      scoreVal !== undefined && scoreVal !== null
        ? `${Math.round((scoreVal > 1 ? scoreVal / 100 : scoreVal) * 100)}% match`
        : '';
    const fullContent = c.content || c.snippet || c.text || '';
    const shortSnippet = fullContent
      ? fullContent.length > 120
        ? fullContent.slice(0, 120) + '...'
        : fullContent
      : scorePercent;

    const pageInfo = c.pageNumber !== undefined && c.pageNumber !== null ? `Page ${c.pageNumber}` : '';
    const chunkInfo = c.chunkIndex !== undefined && c.chunkIndex !== null ? `Chunk #${c.chunkIndex}` : '';
    const rangeStr = c.chunkRange || [pageInfo, chunkInfo].filter(Boolean).join(' • ') || 'Vector Chunk';

    return {
      docId: String(c.documentId || c.docId || safeDocId),
      docName: String(c.fileName || c.docName || 'Document'),
      chunkRange: rangeStr,
      snippet: shortSnippet,
      section: c.section,
      header: c.header,
      content: fullContent,
      pageNumber: c.pageNumber,
      chunkIndex: c.chunkIndex,
      previousChunkIndex: c.previousChunkIndex,
      nextChunkIndex: c.nextChunkIndex,
      similarityScore: scoreVal,
    };
  });
}

export const assistantService = {
  async queryDocument(
    documentId: string,
    conversationId: string,
    query: string,
    provider = 'NVIDIA',
    options?: any
  ): Promise<QueryResponse> {
    const rawProvider = (provider || 'NVIDIA').toUpperCase();
    const safeProvider = rawProvider === 'OLLAMA' ? 'OLLAMA' : 'NVIDIA';
    const safeDocId = toValidUUID(documentId);
    const safeConvId = toValidUUID(conversationId);

    const queryTypeVal = options?.queryType || 'NORMAL_QA';
    const topKVal = options?.topK ?? options?.retrieval?.topK ?? 5;
    const similarityThresholdVal = options?.similarityThreshold ?? options?.retrieval?.similarityThreshold ?? 0.7;
    const enableQueryRewritingVal = options?.enableQueryRewriting ?? options?.isQueryRewritingEnabled ?? true;
    const enableRagVal = options?.enableRag ?? options?.isRagEnabled ?? true;

    const bodyPayload = {
      query: query || '',
      provider: safeProvider,
      options: {
        queryType: queryTypeVal,
        retrieval: {
          topK: topKVal,
          similarityThreshold: similarityThresholdVal,
        },
        enableQueryRewriting: enableQueryRewritingVal,
        enableRag: enableRagVal,
      },
    };

    const response = await fetch(`${BASE_URL}/api/chat/documents/${encodeURIComponent(safeDocId)}/query`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Version': 'v1',
        'X-Conversation-ID': safeConvId,
      },
      credentials: 'include',
      body: JSON.stringify(bodyPayload),
    });

    if (!response.ok) {
      let errorMessage = `Query failed with status ${response.status}`;
      try {
        const errJson = await response.json();
        errorMessage = errJson.message || errJson.error || errorMessage;
      } catch {
        // ignore
      }
      throw new Error(errorMessage);
    }

    const rawJson = await response.json();
    const answerText = rawJson.content || rawJson.answer || '';
    const rawCitations = rawJson.citations || rawJson.sources || [];
    const sourcesList: Citation[] = mapRawCitations(rawCitations, safeDocId);

    return {
      answer: answerText,
      content: answerText,
      grounded: sourcesList.length > 0 || !!rawJson.grounded,
      sources: sourcesList,
      citations: Array.isArray(rawCitations) ? rawCitations : [],
    };
  },

  async streamQueryDocument(
    documentId: string,
    conversationId: string,
    query: string,
    onChunk: (chunk: string, meta?: { citations?: Citation[]; responseTime?: string }) => void,
    onComplete: (meta?: { citations?: Citation[]; responseTime?: string }) => void,
    onError: (error: Error) => void,
    provider = 'NVIDIA',
    options?: any
  ): Promise<void> {
    const rawProvider = (provider || 'NVIDIA').toUpperCase();
    const safeProvider = rawProvider === 'OLLAMA' ? 'OLLAMA' : 'NVIDIA';
    const safeDocId = toValidUUID(documentId);
    const safeConvId = toValidUUID(conversationId);

    const queryTypeVal = options?.queryType || 'NORMAL_QA';
    const topKVal = options?.topK ?? options?.retrieval?.topK ?? 5;
    const similarityThresholdVal = options?.similarityThreshold ?? options?.retrieval?.similarityThreshold ?? 0.7;
    const enableQueryRewritingVal = options?.enableQueryRewriting ?? options?.isQueryRewritingEnabled ?? true;
    const enableRagVal = options?.enableRag ?? options?.isRagEnabled ?? true;

    const bodyPayload = {
      query: query || '',
      provider: safeProvider,
      options: {
        queryType: queryTypeVal,
        retrieval: {
          topK: topKVal,
          similarityThreshold: similarityThresholdVal,
        },
        enableQueryRewriting: enableQueryRewritingVal,
        enableRag: enableRagVal,
      },
    };

    try {
      const response = await fetch(
        `${BASE_URL}/api/chat/documents/${encodeURIComponent(safeDocId)}/query/stream`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-API-Version': 'v1',
            'X-Conversation-ID': safeConvId,
          },
          credentials: 'include',
          body: JSON.stringify(bodyPayload),
        }
      );

      if (!response.ok || !response.body) {
        let errorMessage = `Streaming failed with status ${response.status}`;
        try {
          const errJson = await response.json();
          errorMessage = errJson.message || errJson.error || errorMessage;
        } catch {}
        throw new Error(errorMessage);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';
      let latestCitations: Citation[] | undefined;
      let latestResponseTime: string | undefined;

      const processEvents = (events: SseMessage[]) => {
        for (const sse of events) {
          const rawData = sse.data;
          if (rawData === '[DONE]' || rawData.trim() === '[DONE]') continue;

          if (sse.event === 'error') {
            let errorContent = rawData.trim();
            if (errorContent.startsWith('{') && errorContent.endsWith('}')) {
              try {
                const parsed = JSON.parse(errorContent);
                errorContent = parsed.message || parsed.error || errorContent;
              } catch {}
            }
            throw new Error(errorContent || 'AI Assistant service error occurred.');
          }

          let tokenChunk = rawData;
          let eventCitations: Citation[] | undefined;
          let eventResponseTime: string | undefined;

          const trimmedPayload = rawData.trim();
          if (trimmedPayload.startsWith('{') && trimmedPayload.endsWith('}')) {
            try {
              const parsed = JSON.parse(trimmedPayload);
              const jsonText =
                parsed.content ?? parsed.text ?? parsed.delta ?? parsed.answer ?? parsed.message;
              if (jsonText !== undefined && jsonText !== null) {
                tokenChunk = String(jsonText);
              }

              const rawC = parsed.citations || parsed.sources;
              if (Array.isArray(rawC) && rawC.length > 0) {
                eventCitations = mapRawCitations(rawC, safeDocId);
                latestCitations = eventCitations;
              }

              if (parsed.responseTime) {
                eventResponseTime = String(parsed.responseTime);
                latestResponseTime = eventResponseTime;
              }
            } catch {}
          }

          if (tokenChunk !== '' && onChunk) {
            onChunk(tokenChunk, {
              citations: eventCitations || latestCitations,
              responseTime: eventResponseTime || latestResponseTime,
            });
          }
        }
      };

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer.trim()) {
            const { events } = parseSseChunk(buffer + '\n\n');
            processEvents(events);
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const { events, remaining } = parseSseChunk(buffer);
        buffer = remaining;
        processEvents(events);
      }

      onComplete({ citations: latestCitations, responseTime: latestResponseTime });
    } catch (err) {
      onError(err instanceof Error ? err : new Error(String(err)));
    }
  },
};
