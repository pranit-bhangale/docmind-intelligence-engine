import React, { useState } from 'react';
import {
  ArrowLeft,
  FileText,
  Layers,
  Sparkles,
  Send,
  Copy,
  Check,
} from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';
import { Badge } from '../ui/Badge';

export const DocumentViewer: React.FC = () => {
  const { activeDocument, closeDocumentViewer, sendMessage } = useKnowledge();
  const [docPrompt, setDocPrompt] = useState('');
  const [copied, setCopied] = useState(false);
  const [filterChunkQuery, setFilterChunkQuery] = useState('');

  if (!activeDocument) return null;

  const handleCopyContent = () => {
    if (activeDocument.content) {
      navigator.clipboard.writeText(activeDocument.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleSendDocPrompt = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!docPrompt.trim()) return;
    const query = docPrompt;
    setDocPrompt('');
    closeDocumentViewer();
    sendMessage(query);
  };

  const filteredChunks = activeDocument.chunks?.filter((c) =>
    c.text.toLowerCase().includes(filterChunkQuery.toLowerCase())
  );

  return (
    <div className="flex h-full flex-col bg-background text-foreground animate-in fade-in duration-150 overflow-hidden">
      {/* Top Document Header Bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3 truncate">
          <button
            onClick={closeDocumentViewer}
            className="flex items-center gap-1.5 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
          >
            <ArrowLeft className="size-3.5" />
            <span>Back to chat</span>
          </button>

          <div className="h-4 w-px bg-border/80 shrink-0" />

          <div className="flex items-center gap-2 truncate">
            <FileText className="size-4 text-primary shrink-0" />
            <div className="truncate text-left leading-tight">
              <h2 className="text-xs font-bold text-foreground truncate">
                {activeDocument.name}
              </h2>
              <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <span>{activeDocument.chunksCount} chunks</span>
                <span>•</span>
                <span className="text-emerald-400 font-medium">✓ Indexed</span>
                <span>•</span>
                <span>{activeDocument.size}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Right Tools */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleCopyContent}
            className="flex items-center gap-1.5 rounded-lg border border-border/80 px-2.5 py-1.5 text-xs font-medium text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
            title="Copy document text"
          >
            {copied ? <Check className="size-3.5 text-emerald-400" /> : <Copy className="size-3.5" />}
            <span className="hidden sm:inline">{copied ? 'Copied' : 'Copy'}</span>
          </button>
        </div>
      </header>

      {/* Main Document Content Area */}
      <div className="flex flex-1 overflow-hidden">
        {/* Document Body View */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6">
          {/* Metadata Card */}
          <div className="rounded-xl border border-border/80 bg-card/60 p-4 space-y-2">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="flex items-center gap-1.5 font-medium text-foreground">
                <Layers className="size-4 text-primary" /> Vector Partitioning Overview
              </span>
              <Badge variant="outline" className="text-[10px]">
                Qdrant Schema Indexed
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              This document has been ingested, parsed into {activeDocument.chunksCount} text chunks, and stored with tenant claim scoping for similarity search.
            </p>
          </div>

          {/* Full Text Preview */}
          <div className="rounded-xl border border-border/80 bg-card p-5 space-y-4">
            <h3 className="text-sm font-bold text-foreground flex items-center gap-2 border-b border-border/60 pb-3">
              <FileText className="size-4 text-primary" /> Full Document Content
            </h3>
            <pre className="whitespace-pre-wrap font-mono text-xs text-foreground/90 leading-relaxed font-normal bg-muted/20 p-4 rounded-lg border border-border/50">
              {activeDocument.content || 'Document content preview unavailable.'}
            </pre>
          </div>

          {/* Parsed Chunks Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-2">
                <Sparkles className="size-3.5 text-primary" /> Indexed Chunks ({activeDocument.chunks?.length || 0})
              </h3>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search chunks..."
                  value={filterChunkQuery}
                  onChange={(e) => setFilterChunkQuery(e.target.value)}
                  className="h-7 w-44 rounded-lg border border-input bg-background px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>

            <div className="space-y-2">
              {filteredChunks?.map((chunk) => (
                <div
                  key={chunk.id}
                  className="rounded-lg border border-border/80 bg-card p-3.5 space-y-1.5 text-xs hover:border-primary/40 transition-colors"
                >
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span className="font-semibold text-primary">
                      Chunk #{chunk.chunkIndex}
                    </span>
                    {chunk.pageNumber && (
                      <span className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                        Page {chunk.pageNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-foreground/90 font-mono text-[11px] leading-relaxed">
                    {chunk.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Inline Prompt Composer */}
      <div className="shrink-0 border-t border-border/80 bg-card/90 p-3 sm:px-6">
        <form
          onSubmit={handleSendDocPrompt}
          className="relative max-w-3xl mx-auto flex items-center gap-2 rounded-xl border border-input bg-background/80 px-3 py-2 shadow-xs focus-within:ring-1 focus-within:ring-primary"
        >
          <Sparkles className="size-4 text-primary shrink-0" />
          <input
            type="text"
            placeholder={`Ask anything about ${activeDocument.name}...`}
            value={docPrompt}
            onChange={(e) => setDocPrompt(e.target.value)}
            className="w-full bg-transparent text-xs text-foreground placeholder:text-muted-foreground focus:outline-none"
          />
          <button
            type="submit"
            disabled={!docPrompt.trim()}
            className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 disabled:opacity-40 transition-all shrink-0"
          >
            <Send className="size-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
};
