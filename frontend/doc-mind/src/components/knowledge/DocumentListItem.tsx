import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  FileCode,
  FileCheck,
  FileSpreadsheet,
  MoreVertical,
  BookOpen,
  Trash2,
  AlertCircle,
  Loader2,
  CheckCircle2,
} from 'lucide-react';
import type { KnowledgeDocument } from '../../types/knowledge';
import { useKnowledge } from '../../context/KnowledgeContext';
import { cn } from '../../lib/utils';

interface DocumentListItemProps {
  doc: KnowledgeDocument;
}

export const DocumentListItem: React.FC<DocumentListItemProps> = ({ doc }) => {
  const {
    contextDocIds,
    openDocumentViewer,
    deleteDocument,
    selectDocumentAndStartChat,
    addDocumentToContext,
  } = useKnowledge();

  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const isInContext = contextDocIds.includes(doc.id);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFileIcon = (ext: string) => {
    switch (ext.toLowerCase()) {
      case 'pdf':
        return <FileCheck className="size-4 text-rose-400 shrink-0" />;
      case 'docx':
      case 'doc':
        return <FileText className="size-4 text-blue-400 shrink-0" />;
      case 'xlsx':
      case 'csv':
        return <FileSpreadsheet className="size-4 text-emerald-400 shrink-0" />;
      case 'json':
      case 'md':
      case 'txt':
        return <FileCode className="size-4 text-amber-400 shrink-0" />;
      default:
        return <FileText className="size-4 text-muted-foreground shrink-0" />;
    }
  };

  const handleDocumentCardClick = () => {
    addDocumentToContext(doc.id);
    selectDocumentAndStartChat(doc);
  };

  return (
    <div
      onClick={handleDocumentCardClick}
      className={cn(
        'group relative flex items-center justify-between rounded-2xl border p-3 cursor-pointer transition-all duration-150 select-none',
        isInContext
          ? 'border-primary/50 bg-primary/10 shadow-xs'
          : 'border-border/80 bg-card/60 hover:border-primary/40 hover:bg-card/90'
      )}
    >
      <div className="flex items-center gap-3 overflow-hidden text-left flex-1">
        {/* Left White Rounded Icon Box (Matching Image 2) */}
        <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border/80 shadow-2xs shrink-0 group-hover:bg-primary/20 transition-colors">
          {getFileIcon(doc.extension)}
        </div>

        {/* File Name & Metadata (Matching Image 2) */}
        <div className="flex-1 truncate leading-tight">
          <div className="truncate font-bold text-foreground text-xs">
            {doc.name}
          </div>
          <div className="text-[10.5px] text-muted-foreground mt-0.5">
            {doc.size} • {doc.chunksCount} chunks
          </div>

          {/* Green Status Badge (Matching Image 2) */}
          <div className="mt-1 flex items-center gap-1 text-[10px] font-medium">
            {doc.status === 'indexed' && (
              <span className="text-emerald-400 flex items-center gap-1">
                <CheckCircle2 className="size-3 text-emerald-400" /> Indexed
              </span>
            )}
            {doc.status === 'indexing' && (
              <span className="text-amber-400 flex items-center gap-1">
                <Loader2 className="size-3 animate-spin text-amber-400" /> Indexing
              </span>
            )}
            {doc.status === 'failed' && (
              <span className="text-destructive flex items-center gap-1">
                <AlertCircle className="size-3" /> Failed
              </span>
            )}
          </div>
        </div>
      </div>

      {/* 3-Dot Options Dropdown */}
      <div className="relative shrink-0 ml-1" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setMenuOpen(!menuOpen);
          }}
          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-accent hover:text-foreground transition-all focus:outline-none"
        >
          <MoreVertical className="size-3.5" />
        </button>

        {menuOpen && (
          <div className="absolute right-0 top-full mt-1 w-44 rounded-xl border border-border bg-card/95 p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                openDocumentViewer(doc);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] text-foreground hover:bg-accent transition-colors text-left"
            >
              <BookOpen className="size-3.5 text-primary" />
              Open Document
            </button>

            <div className="border-t border-border/80 my-1" />

            <button
              onClick={(e) => {
                e.stopPropagation();
                setMenuOpen(false);
                deleteDocument(doc.id);
              }}
              className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded-lg text-[11px] text-destructive hover:bg-destructive/10 transition-colors text-left"
            >
              <Trash2 className="size-3.5" />
              Delete document
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
