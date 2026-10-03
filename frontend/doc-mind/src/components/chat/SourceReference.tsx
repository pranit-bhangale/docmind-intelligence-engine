import React, { useState } from 'react';
import { ShieldCheck, FileText, ChevronDown, ChevronUp, ExternalLink, Bookmark, FileCode, Layers, Sparkles, Eye } from 'lucide-react';
import type { SourceCitation } from '../../types/knowledge';
import { CitationDetailModal } from '../modals/CitationDetailModal';

interface SourceReferenceProps {
  sources?: SourceCitation[];
}

export const SourceReference: React.FC<SourceReferenceProps> = ({ sources }) => {
  const [expanded, setExpanded] = useState(true);
  const [selectedCitation, setSelectedCitation] = useState<SourceCitation | null>(null);

  if (!sources || sources.length === 0) return null;

  return (
    <>
      <div className="mt-3 pt-3 border-t border-border/50 text-xs">
        <div className="flex items-center justify-between">
          <button
            onClick={() => setExpanded(!expanded)}
            className="flex items-center gap-1.5 font-medium text-emerald-400 hover:text-emerald-300 transition-colors focus:outline-none"
          >
            <ShieldCheck className="size-3.5" />
            <span>✓ Grounded • {sources.length} {sources.length === 1 ? 'source' : 'sources'}</span>
            {expanded ? <ChevronUp className="size-3" /> : <ChevronDown className="size-3" />}
          </button>
        </div>

        {expanded && (
          <div className="mt-2.5 grid grid-cols-1 sm:grid-cols-2 gap-2.5 animate-in fade-in duration-150">
            {sources.map((src, idx) => {
              const scoreVal = src.similarityScore;
              const scorePercent =
                scoreVal !== undefined && scoreVal !== null
                  ? scoreVal <= 1
                    ? `${(scoreVal * 100).toFixed(1)}% match`
                    : `${scoreVal.toFixed(2)}`
                  : null;

              const displayContent = src.content || (src.snippet && !src.snippet.includes('match') ? src.snippet : '');

              return (
                <div
                  key={idx}
                  onClick={() => setSelectedCitation(src)}
                  className="group flex flex-col justify-between gap-2 rounded-xl border border-border/70 bg-card/70 p-2.5 hover:border-primary/60 hover:bg-card/95 cursor-pointer transition-all shadow-xs"
                >
                  <div className="space-y-1.5">
                    {/* Header Row: Document Name & Score / Chunk Badge */}
                    <div className="flex items-center justify-between gap-1.5">
                      <div className="flex items-center gap-1.5 min-w-0 font-semibold text-foreground">
                        <FileText className="size-3.5 text-primary shrink-0" />
                        <span className="truncate group-hover:text-primary transition-colors text-[11px]" title={src.docName}>
                          {src.docName}
                        </span>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        {scorePercent && (
                          <span className="flex items-center gap-0.5 font-mono text-[9px] font-bold text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20">
                            <Sparkles size={9} />
                            {scorePercent}
                          </span>
                        )}
                        <span className="flex items-center gap-0.5 font-mono text-[9px] font-semibold text-primary bg-primary/10 px-1.5 py-0.5 rounded border border-primary/20">
                          <Layers size={9} />
                          {src.chunkRange || (src.chunkIndex !== undefined ? `Chunk #${src.chunkIndex}` : 'Chunk')}
                        </span>
                      </div>
                    </div>

                    {/* Badges Row: Section / Header / Page */}
                    {(src.section || src.header || src.pageNumber !== undefined) && (
                      <div className="flex flex-wrap items-center gap-1 text-[9px] text-muted-foreground">
                        {src.section && (
                          <span className="flex items-center gap-0.5 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80 truncate max-w-[120px]">
                            <Bookmark size={8} className="text-purple-400 shrink-0" />
                            Section: {src.section}
                          </span>
                        )}
                        {src.header && (
                          <span className="flex items-center gap-0.5 bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80 truncate max-w-[120px]">
                            <FileCode size={8} className="text-amber-400 shrink-0" />
                            Header: {src.header}
                          </span>
                        )}
                        {src.pageNumber !== undefined && (
                          <span className="bg-muted/60 px-1.5 py-0.5 rounded border border-border/50 font-medium text-foreground/80">
                            Page {src.pageNumber}
                          </span>
                        )}
                      </div>
                    )}

                    {/* Content Preview Row (docContent) */}
                    {displayContent ? (
                      <div className="text-muted-foreground text-[10px] font-mono leading-relaxed line-clamp-2 bg-muted/30 p-1.5 rounded-lg border border-border/40">
                        "{displayContent}"
                      </div>
                    ) : null}
                  </div>

                  {/* View Complete Content Action Link */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/40 text-[9.5px] text-muted-foreground/80">
                    <span className="flex items-center gap-1 text-primary group-hover:underline font-medium">
                      <Eye size={10} />
                      <span>View complete chunk content</span>
                    </span>
                    <ExternalLink className="size-3 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal for viewing complete chunk content */}
      <CitationDetailModal
        isOpen={Boolean(selectedCitation)}
        onClose={() => setSelectedCitation(null)}
        citation={selectedCitation}
      />
    </>
  );
};
