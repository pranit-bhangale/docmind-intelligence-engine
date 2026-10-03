import React, { useRef, useEffect } from 'react';
import {
  Edit3,
  Search,
  FileText,
  Sparkles,
  ShieldCheck,
  Layers,
  Lightbulb,
} from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { DocumentViewer } from '../knowledge/DocumentViewer';

export const Chat: React.FC = () => {
  const {
    activeConversation,
    activeDocument,
    sendMessage,
    documents,
    contextDocIds,
  } = useKnowledge();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const messages = activeConversation.messages || [];
  const activeDocs = documents.filter((d) => contextDocIds.includes(d.id));
  const totalChunks = activeDocs.reduce((acc, d) => acc + d.chunksCount, 0);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // If a document preview is active, render DocumentViewer mode
  if (activeDocument) {
    return <DocumentViewer />;
  }

  return (
    <div className="flex h-full flex-col bg-background text-foreground overflow-hidden">
      {/* Active Context Bar */}
      {activeDocs.length > 0 && (
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-4 py-1.5 text-xs select-none shrink-0">
          <div className="flex items-center gap-2 truncate">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground">
              ACTIVE CONTEXT /
            </span>
            <div className="flex items-center gap-1.5 font-medium text-foreground truncate">
              <FileText className="size-3.5 text-primary shrink-0" />
              <span className="truncate">{activeDocs.map((d) => d.name).join(', ')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground">
              <Layers className="size-3 text-primary" />
              {totalChunks} vector chunks
            </span>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400">
              <ShieldCheck className="size-3" />
              Grounded
            </span>
          </div>
        </div>
      )}

      {/* Scrollable Main Message Area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          /* ChatGPT Hero Empty State */
          <div className="flex min-h-full flex-col items-center justify-center p-6 text-center animate-in fade-in duration-300">
            <div className="max-w-2xl w-full space-y-8">
              {/* ChatGPT Title */}
              <div className="space-y-2">
                <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
                  What’s on your mind today?
                </h1>
                {activeDocs.length > 0 ? (
                  <p className="text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                    <FileText className="size-3.5 text-primary" />
                    <span>Attached Context: <strong>{activeDocs.map((d) => d.name).join(', ')}</strong></span>
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Ask anything about your uploaded documents or start exploring below.
                  </p>
                )}
              </div>

              {/* Action Suggestion Template Cards (Matching User Image 3) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-left">
                {/* Card 1: Summarize Document */}
                <button
                  onClick={() => sendMessage('Summarize the attached document(s) and provide key takeaways.', 'DOCUMENT_SUMMARY')}
                  className="group flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card/80 p-4 hover:border-primary/50 hover:bg-card/95 transition-all text-xs text-left shadow-xs"
                >
                  <div className="size-9 rounded-full bg-zinc-800/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Sparkles className="size-4 text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xs leading-snug">Summarize Document</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Get an executive summary of key takeaways and main points
                    </p>
                  </div>
                </button>

                {/* Card 2: Key Technical Insights */}
                <button
                  onClick={() => sendMessage('Identify critical technical decisions, architecture & key insights.', 'TECHNICAL_INSIGHTS')}
                  className="group flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card/80 p-4 hover:border-primary/50 hover:bg-card/95 transition-all text-xs text-left shadow-xs"
                >
                  <div className="size-9 rounded-full bg-zinc-800/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Lightbulb className="size-4 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xs leading-snug">Key Technical Insights</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Identify critical decisions, architecture & insights
                    </p>
                  </div>
                </button>

                {/* Card 3: Draft Technical Specs */}
                <button
                  onClick={() => sendMessage('Write and edit documentation for system architecture & API specifications.', 'TECHNICAL_INSIGHTS')}
                  className="group flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card/80 p-4 hover:border-primary/50 hover:bg-card/95 transition-all text-xs text-left shadow-xs"
                >
                  <div className="size-9 rounded-full bg-zinc-800/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Edit3 className="size-4 text-emerald-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xs leading-snug">Draft Specs & Docs</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Generate API documentation, data schemas & code specs
                    </p>
                  </div>
                </button>

                {/* Card 4: Vector Similarity Search */}
                <button
                  onClick={() => sendMessage('Search knowledge base for security, API endpoints and authorization rules.', 'NORMAL_QA')}
                  className="group flex items-start gap-3.5 rounded-2xl border border-border/80 bg-card/80 p-4 hover:border-primary/50 hover:bg-card/95 transition-all text-xs text-left shadow-xs"
                >
                  <div className="size-9 rounded-full bg-zinc-800/90 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Search className="size-4 text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-xs leading-snug">Vector Search</h3>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-normal">
                      Perform grounded RAG similarity retrieval on knowledge base
                    </p>
                  </div>
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* Active Chat Thread */
          <div className="max-w-3xl mx-auto py-6 space-y-4">
            {messages.map((msg) => (
              <ChatMessage key={msg.id} message={msg} />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Signature Bottom-Centered ChatGPT Composer */}
      <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-2">
        <ChatComposer />
      </div>
    </div>
  );
};

