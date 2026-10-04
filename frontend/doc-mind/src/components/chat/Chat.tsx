import React, { useRef, useEffect } from 'react';
import {
  ShieldCheck,
  Layers,
} from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';
import { ChatMessage } from './ChatMessage';
import { ChatComposer } from './ChatComposer';
import { ContextDocuments } from './ContextDocuments';
import { DocumentViewer } from '../knowledge/DocumentViewer';

export const Chat: React.FC = () => {
  const {
    activeConversation,
    activeDocument,
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
        <div className="flex items-center justify-between border-b border-border/50 bg-muted/20 px-3 sm:px-4 py-1.5 text-xs select-none shrink-0 gap-2 overflow-x-auto scrollbar-none">
          <div className="flex items-center gap-2 shrink-0 min-w-0">
            <span className="size-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-bold uppercase tracking-wider text-[10px] text-muted-foreground shrink-0 hidden xs:inline">
              ACTIVE CONTEXT /
            </span>
            <ContextDocuments />
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            <span className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-0.5 text-[10px] text-muted-foreground whitespace-nowrap">
              <Layers className="size-3 text-primary shrink-0" />
              <span>{totalChunks} vector chunks</span>
            </span>
            <span className="flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-400 whitespace-nowrap">
              <ShieldCheck className="size-3 shrink-0" />
              <span>Grounded</span>
            </span>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      {messages.length === 0 ? (
        /* Sleek Centered Hero Empty State (Matching User Image 3) */
        <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 text-center animate-in fade-in duration-300">
          <div className="max-w-2xl w-full space-y-6 flex flex-col items-center justify-center my-auto">
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground font-sans">
              What's on your mind?
            </h1>

            {/* Centered Composer for Empty State (Matching User Image 3) */}
            <div className="w-full pt-2">
              <ChatComposer />
            </div>
          </div>
        </div>
      ) : (
        /* Active Chat Thread + Bottom Pinned Composer */
        <>
          <div className="flex-1 overflow-y-auto">
            <div className="max-w-3xl mx-auto py-6 space-y-4 px-4">
              {messages.map((msg) => (
                <ChatMessage key={msg.id} message={msg} />
              ))}
              <div ref={messagesEndRef} />
            </div>
          </div>

          <div className="shrink-0 bg-gradient-to-t from-background via-background to-transparent pt-2">
            <ChatComposer />
          </div>
        </>
      )}
    </div>
  );
};

