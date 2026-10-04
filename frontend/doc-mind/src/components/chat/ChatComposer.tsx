import React, { useState, useRef, useEffect } from 'react';
import { Send, Paperclip, FileText, Sparkles, HelpCircle } from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';
import type { QueryType } from '../../types/knowledge';

export const ChatComposer: React.FC = () => {
  const { sendMessage, documents, contextDocIds, uploadDocument, isStreaming } = useKnowledge();
  const [inputText, setInputText] = useState('');
  const [queryType, setQueryType] = useState<QueryType>('NORMAL_QA');
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeDocs = documents.filter((d) => contextDocIds.includes(d.id));
  const primaryDocName = activeDocs[0]?.name;
  const hasSelectedDoc = activeDocs.length > 0;

  // Auto-switch to default NORMAL_QA when no document is selected
  useEffect(() => {
    if (!hasSelectedDoc && queryType !== 'NORMAL_QA') {
      setQueryType('NORMAL_QA');
    }
  }, [hasSelectedDoc, queryType]);

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

  const queryTypeOptions: Array<{
    id: QueryType;
    label: string;
    icon: React.ReactNode;
    prompt?: string;
  }> = [
    {
      id: 'NORMAL_QA',
      label: 'Q&A',
      icon: <HelpCircle size={11} />,
    },
    {
      id: 'DOCUMENT_SUMMARY',
      label: 'Summary',
      icon: <FileText size={11} />,
      prompt: 'Provide an executive summary of key takeaways and main points.',
    },
    {
      id: 'TECHNICAL_INSIGHTS',
      label: 'Insights',
      icon: <Sparkles size={11} />,
      prompt: 'Identify critical technical decisions, architecture & key insights.',
    },
  ];

  const handleModeClick = (opt: typeof queryTypeOptions[0]) => {
    if (opt.id !== 'NORMAL_QA' && !hasSelectedDoc) return;
    setQueryType(opt.id);
    if (opt.id === 'NORMAL_QA') {
      textareaRef.current?.focus();
    } else if (opt.prompt && !inputText.trim() && !isStreaming) {
      sendMessage(opt.prompt, opt.id);
    }
  };

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
        <form onSubmit={handleSubmit} className="flex flex-col p-2">
          {/* Query Type Mode Selector Bar */}
          <div className="flex items-center gap-1.5 px-3 pt-1 pb-0.5 overflow-x-auto scrollbar-none">
            <span className="text-[10px] text-muted-foreground/80 font-medium select-none shrink-0">Mode:</span>
            <div className="flex items-center gap-1 shrink-0">
              {queryTypeOptions.map((opt) => {
                const isModeDisabled = !hasSelectedDoc;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    disabled={isModeDisabled}
                    onClick={() => handleModeClick(opt)}
                    title={
                      isModeDisabled
                        ? 'Select a document from Knowledge Base to enable chat mode'
                        : `Run ${opt.label} template query`
                    }
                    className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition-all ${
                      queryType === opt.id && hasSelectedDoc
                        ? 'bg-primary/15 text-primary border border-primary/30 shadow-xs'
                        : 'bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground border border-transparent'
                    } ${isModeDisabled ? 'opacity-40 cursor-not-allowed hover:bg-muted/30 hover:text-muted-foreground' : ''}`}
                  >
                    {opt.icon}
                    <span>{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex items-center gap-2 px-3 py-1.5">
            {/* Disabled Left Attach Button (Upload via Sidebar) */}
            <button
              type="button"
              disabled={true}
              className="flex size-7 items-center justify-center rounded-full text-muted-foreground/30 cursor-not-allowed shrink-0"
              title="Upload documents via Knowledge Base sidebar to enable context"
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
              disabled={!hasSelectedDoc || isStreaming}
              placeholder={
                !hasSelectedDoc
                  ? 'Select a document from Knowledge Base to begin chat...'
                  : primaryDocName
                  ? `Ask anything about ${primaryDocName}...`
                  : 'Ask anything about your attached documents...'
              }
              className="w-full resize-none bg-transparent py-1 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none max-h-40 leading-relaxed font-sans disabled:opacity-50 disabled:cursor-not-allowed"
            />

            {/* Right Action Controls */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="submit"
                disabled={!hasSelectedDoc || !inputText.trim() || isStreaming}
                className={`flex size-8 items-center justify-center rounded-full text-primary-foreground transition-all shadow-xs ${
                  hasSelectedDoc && inputText.trim() && !isStreaming
                    ? 'bg-primary hover:bg-primary/90 scale-100'
                    : 'bg-muted text-muted-foreground cursor-not-allowed opacity-40'
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
