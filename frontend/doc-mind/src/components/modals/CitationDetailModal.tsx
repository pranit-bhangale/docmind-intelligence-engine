import React, { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/button';
import { FileText, Layers, Bookmark, Sparkles, Copy, Check, Hash, FileCode } from 'lucide-react';
import type { SourceCitation, Citation } from '../../types/knowledge';

interface CitationDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  citation: SourceCitation | Citation | null;
}

export const CitationDetailModal: React.FC<CitationDetailModalProps> = ({
  isOpen,
  onClose,
  citation,
}) => {
  const [copied, setCopied] = useState(false);

  if (!citation) return null;

  const fileName =
    ('fileName' in citation && citation.fileName)
      ? citation.fileName
      : ('docName' in citation && citation.docName)
      ? citation.docName
      : 'Document';

  const chunkIndex = citation.chunkIndex;
  const section = citation.section;
  const header = citation.header;
  const content = citation.content || ('snippet' in citation ? citation.snippet : '') || 'No content preview available.';
  const pageNumber = citation.pageNumber;
  const prevChunk = citation.previousChunkIndex;
  const nextChunk = citation.nextChunkIndex;
  const score = citation.similarityScore;

  const scoreDisplay =
    score !== undefined && score !== null
      ? score <= 1
        ? `${(score * 100).toFixed(1)}% match`
        : score.toFixed(2)
      : null;

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const modalTitle = chunkIndex !== undefined ? `${fileName} (Chunk #${chunkIndex})` : fileName;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={modalTitle}
      maxWidth="lg"
    >
      <div className="space-y-4 text-xs">
        {/* Metadata Chips Bar */}
        <div className="flex flex-wrap items-center gap-2 border-b border-border/60 pb-3">
          {scoreDisplay && (
            <div className="flex items-center gap-1.5 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-400">
              <Sparkles className="size-3" />
              <span>Relevance: {scoreDisplay}</span>
            </div>
          )}

          {chunkIndex !== undefined && (
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Layers className="size-3 text-primary" />
              <span>Chunk Index: #{chunkIndex}</span>
            </div>
          )}

          {pageNumber !== undefined && pageNumber !== null && (
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Hash className="size-3 text-muted-foreground" />
              <span>Page {pageNumber}</span>
            </div>
          )}

          {section && (
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <Bookmark className="size-3 text-purple-400" />
              <span>Section: {section}</span>
            </div>
          )}

          {header && (
            <div className="flex items-center gap-1 rounded-lg border border-border/80 bg-muted/30 px-2.5 py-1 text-[11px] font-medium text-foreground">
              <FileCode className="size-3 text-amber-400" />
              <span>Header: {header}</span>
            </div>
          )}

          {(prevChunk !== undefined || nextChunk !== undefined) && (
            <div className="flex items-center gap-1.5 rounded-lg border border-border/60 bg-muted/20 px-2.5 py-1 text-[10px] text-muted-foreground">
              {prevChunk !== undefined && <span>Prev: #{prevChunk}</span>}
              {prevChunk !== undefined && nextChunk !== undefined && <span>•</span>}
              {nextChunk !== undefined && <span>Next: #{nextChunk}</span>}
            </div>
          )}
        </div>

        {/* Content Section */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between text-[11px] font-semibold text-foreground">
            <span className="flex items-center gap-1.5">
              <FileText className="size-3.5 text-primary" />
              <span>Chunk Content (docContent):</span>
            </span>
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground hover:text-foreground transition-colors p-1 rounded hover:bg-accent"
            >
              {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
              <span>{copied ? 'Copied' : 'Copy Content'}</span>
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto rounded-xl border border-border/80 bg-muted/30 p-4 font-mono text-[11.5px] leading-relaxed text-foreground select-text whitespace-pre-wrap break-words shadow-inner">
            {content}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex justify-end pt-2 border-t border-border/50">
          <Button variant="outline" size="sm" onClick={onClose} className="rounded-xl">
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
};
