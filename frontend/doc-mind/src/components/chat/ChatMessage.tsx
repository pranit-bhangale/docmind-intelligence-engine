import React, { useState } from 'react';
import { Sparkles, User, Copy, Check, Clock, AlertCircle, FileText, Bookmark, Layers, Loader2, Eye } from 'lucide-react';
import type { ChatMessageItem, Citation } from '../../types/knowledge';
import { SourceReference } from './SourceReference';
import { AIResponseRenderer } from './AIResponseRenderer';
import { CitationDetailModal } from '../modals/CitationDetailModal';

interface ChatMessageProps {
  message: ChatMessageItem;
}

export const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';
  const isError = message.status === 'error' || Boolean(message.error);
  const isStreaming = message.status === 'streaming' || (!isUser && !message.text && message.status !== 'complete' && message.status !== 'error');
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(message.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      className={`group py-4 px-4 sm:px-6 rounded-2xl transition-colors ${
        isUser
          ? 'bg-muted/20 border border-border/40 max-w-2xl ml-auto'
          : 'bg-transparent max-w-3xl mr-auto'
      }`}
    >
      <div className="flex items-start gap-3.5">
        {/* Avatar */}
        <div
          className={`flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold shadow-xs ${
            isUser
              ? 'bg-gradient-to-tr from-zinc-700 to-zinc-600 text-white'
              : 'bg-primary text-primary-foreground shadow-primary/20'
          }`}
        >
          {isUser ? <User className="size-4" /> : <Sparkles className="size-4" />}
        </div>

        {/* Content */}
        <div className="flex-1 space-y-2 overflow-hidden text-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-xs text-foreground">
                {isUser ? 'You' : 'DocMind Assistant'}
              </span>
              {message.queryType && (
                <span className="rounded-full border border-primary/40 bg-primary/10 px-2 py-0.5 text-[9.5px] font-semibold text-primary uppercase">
                  {message.queryType === 'NORMAL_QA' ? 'Q&A' : message.queryType === 'DOCUMENT_SUMMARY' ? 'Summary' : 'Insights'}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <span className="text-[10px] text-muted-foreground">{message.timestamp}</span>
              <button
                onClick={handleCopy}
                className="p-1 rounded text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                title="Copy text"
              >
                {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              </button>
            </div>
          </div>

          {/* Message Body */}
          {isUser ? (
            <div className="whitespace-pre-wrap text-xs sm:text-sm font-sans text-foreground/90 leading-relaxed">
              {message.text}
            </div>
          ) : (
            <div className="space-y-3">
              {message.text ? (
                <AIResponseRenderer content={message.text} status={message.status} />
              ) : isStreaming ? (
                <div className="flex items-center gap-2.5 py-1 text-xs text-muted-foreground select-none">
                  <div className="relative flex h-4.5 w-4.5 items-center justify-center">
                    <Loader2 size={15} className="animate-spin text-primary shrink-0" />
                    <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping opacity-40" />
                  </div>
                  <div className="inline-flex items-center gap-1.5 font-medium text-foreground/80 leading-none">
                    <span className="text-xs">Thinking & generating response</span>
                    <span className="inline-flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.3s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce [animation-delay:-0.15s]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-primary animate-bounce" />
                    </span>
                  </div>
                </div>
              ) : null}

              {/* Error UI Display */}
              {isError && (
                <div className="flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
                  <AlertCircle size={15} className="mt-0.5 shrink-0" />
                  <div className="leading-snug font-medium">
                    {message.error || 'AI service is temporarily unavailable. Please try again.'}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Response Execution Time Badge */}
          {!isUser && message.executionTime && !isStreaming && (
            <div className="mt-2.5 flex items-center justify-start border-t border-border/40 pt-2 text-[10px] text-muted-foreground select-none">
              <div className="flex items-center gap-1 text-emerald-400 font-mono font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                <Clock size={11} className="shrink-0" />
                <span>Response Time: {message.executionTime}</span>
              </div>
            </div>
          )}

          {/* Detailed Citations List */}
          {!isUser && message.citations && message.citations.length > 0 && (
            <CitationsList citations={message.citations} />
          )}

          {/* Fallback Grounded Sources */}
          {!isUser && message.sources && (!message.citations || message.citations.length === 0) && (
            <SourceReference sources={message.sources} />
          )}
        </div>
      </div>
    </div>
  );
};

function CitationsList({ citations }: { citations: Citation[] }) {
  const [selectedCitation, setSelectedCitation] = useState<Citation | null>(null);

  if (!citations || citations.length === 0) return null;

  return (
    <>
      <div className="mt-2.5 border-t border-border/40 pt-2.5 space-y-2 select-none">
        <div className="flex items-center justify-between text-[11px] font-bold text-foreground">
          <div className="flex items-center gap-1.5">
            <Bookmark size={12} className="text-primary shrink-0" />
            <span>Source Citations ({citations.length}):</span>
          </div>
          <span className="text-[10px] font-normal text-muted-foreground">Click card to view complete content</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[10px]">
          {citations.map((cit, idx) => {
            const scorePercent =
              cit.similarityScore !== undefined && cit.similarityScore !== null
                ? cit.similarityScore <= 1
                  ? (cit.similarityScore * 100).toFixed(1) + '% match'
                  : cit.similarityScore.toFixed(2)
                : null;

            const displayContent = cit.content || '';

            return (
              <div
                key={cit.documentId || idx}
                onClick={() => setSelectedCitation(cit)}
                className="group flex flex-col gap-1.5 rounded-xl border border-border/70 bg-card/60 p-2.5 transition-all hover:bg-card/95 hover:border-primary/50 cursor-pointer shadow-xs"
              >
                {/* File Name & Similarity Badge */}
                <div className="flex items-center justify-between gap-1.5">
                  <div className="flex items-center gap-1.5 min-w-0 font-semibold text-foreground">
                    <FileText size={12} className="text-primary shrink-0" />
                    <span className="truncate group-hover:text-primary transition-colors" title={cit.fileName || 'Document'}>
                      {cit.fileName || 'Document'}
                    </span>
                  </div>
                  {scorePercent && (
                    <span className="shrink-0 font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                      {scorePercent}
                    </span>
                  )}
                </div>

                {/* Section / Header Badges */}
                {(cit.section || cit.header || cit.chunkIndex !== undefined || cit.pageNumber !== undefined) && (
                  <div className="flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
                    {cit.chunkIndex !== undefined && (
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80 flex items-center gap-0.5">
                        <Layers size={9} className="text-primary shrink-0" />
                        Chunk #{cit.chunkIndex}
                      </span>
                    )}
                    {cit.pageNumber !== undefined && cit.pageNumber !== null && (
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80">
                        Page {cit.pageNumber}
                      </span>
                    )}
                    {cit.section && (
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80 truncate max-w-[110px]">
                        Section: {cit.section}
                      </span>
                    )}
                    {cit.header && (
                      <span className="bg-background px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80 truncate max-w-[110px]">
                        Header: {cit.header}
                      </span>
                    )}
                  </div>
                )}

                {/* Doc Content Snippet Preview */}
                {displayContent && (
                  <div className="text-[10px] font-mono text-muted-foreground line-clamp-2 bg-muted/30 p-1.5 rounded border border-border/40 leading-relaxed">
                    "{displayContent}"
                  </div>
                )}

                {/* View Complete Link */}
                <div className="flex items-center justify-between text-[9.5px] text-primary group-hover:underline font-medium pt-0.5">
                  <span className="flex items-center gap-1">
                    <Eye size={10} />
                    <span>View complete chunk content</span>
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <CitationDetailModal
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
        citation={selectedCitation}
      />
    </>
  );
}
