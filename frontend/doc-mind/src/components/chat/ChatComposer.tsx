import React, { useState, useRef, useEffect } from 'react';
import { Send, Globe, Paperclip, FileText, Sparkles, HelpCircle } from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';
import { ContextDocuments } from './ContextDocuments';
import type { QueryType } from '../../types/knowledge';

export const ChatComposer: React.FC = () => {
  const { sendMessage, documents, contextDocIds, uploadDocument, isStreaming } = useKnowledge();
  const [inputText, setInputText] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('NORMAL_QA');
  const [isThinkingEnabled, setIsThinkingEnabled] = useState(true);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocs = documents.filter((d) => contextDocIds.includes(d.id));
  const primaryDocName = activeDocs[0]?.name;

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [inputText]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputText.trim() || isStreaming) return;
    const msg = inputText;
    setInputText('');
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
    sendMessage(msg, queryType);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleFileAttach = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadDocument(files[0]);
      e.target.value = '';
    }
  };

  const queryTypeOptions: Array<{ id: QueryType; label: string; icon: React.ReactNode }> = [
    { id: 'NORMAL_QA', label: 'Q&A', icon: <HelpCircle size={11} /> },
    { id: 'DOCUMENT_SUMMARY', label: 'Summary', icon: <FileText size={11} /> },
    { id: 'TECHNICAL_INSIGHTS', label: 'Insights', icon: <Sparkles size={11} /> },
  ];

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4 pt-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileAttach}
        className="hidden"
        accept=".pdf,.docx,.txt,.xlsx,.pptx,.csv,.md,.json"
      />

      {/* Outer Composer Pill Container */}
      <div className="relative rounded-full sm:rounded-2xl border border-border/80 bg-card/90 shadow-lg backdrop-blur-md focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/40 transition-all">
        {/* Context Documents Chip Bar */}
        <div className="px-4 pt-2.5">
          <ContextDocuments />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col p-2 pt-0">
          {/* Query Type Mode Selector Bar */}
          <div className="flex items-center gap-1.5 px-3 pt-1.5 pb-0.5">
            <span className="text-[10px] text-muted-foreground/80 font-medium select-none">Mode:</span>
            <div className="flex items-center gap-1">
              {queryTypeOptions.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setQueryType(opt.id)}
                  className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                    queryType === opt.id
                      ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                  }`}
                >
                  {opt.icon}
                  <span>{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5">
            {/* Left Attach Button */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground transition-colors shrink-0"
              title="Attach document to knowledge context"
            >
              <Paperclip className="size-4" />
            </button>

            {/* Input Textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isStreaming}
              placeholder={
                primaryDocName
                  ? `Ask anything about ${primaryDocName}...`
                  : 'Ask anything about your knowledge base...'
              }
              className="w-full resize-none bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground/70 focus:outline-none max-h-40 leading-relaxed font-sans disabled:opacity-50"
            />

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsThinkingEnabled(!isThinkingEnabled)}
                className={`hidden md:flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-medium border transition-all ${
                  isThinkingEnabled
                    ? 'border-primary/40 bg-primary/10 text-primary'
                    : 'border-border text-muted-foreground hover:text-foreground'
                }`}
                title="Deep Vector Reasoning Mode"
              >
                <Globe className="size-3" />
                <span>Think</span>
              </button>

              <button
                type="submit"
                disabled={!inputText.trim() || isStreaming}
                className={`flex size-8 items-center justify-center rounded-full text-primary-foreground transition-all shadow-xs ${
                  inputText.trim() && !isStreaming
                    ? 'bg-primary hover:bg-primary/90 scale-100'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-50'
                }`}
                title="Send Message"
              >
                <Send className="size-4" />
              </button>
            </div>
          </div>
        </form>
      </div>

      <div className="text-center mt-2 text-[10px] text-muted-foreground/70">
        DocMind Knowledge Engine may produce accurate insights grounded in indexed tenant documents.
      </div>
    </div>
  );
};
