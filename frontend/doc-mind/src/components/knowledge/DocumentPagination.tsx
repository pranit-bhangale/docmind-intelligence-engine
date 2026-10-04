import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';

export const DocumentPagination: React.FC = () => {
  const {
    filteredDocuments,
    currentPage,
    totalPages,
    setCurrentPage,
    pageSize,
  } = useKnowledge();

  if (filteredDocuments.length === 0) {
    return null;
  }

  const startDoc = (currentPage - 1) * pageSize + 1;
  const endDoc = Math.min(currentPage * pageSize, filteredDocuments.length);

  return (
    <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[10px] text-muted-foreground select-none">
      <span>
        Showing {startDoc}–{endDoc} of {filteredDocuments.length}
      </span>

      <div className="flex items-center gap-1">
        <button
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex size-5 items-center justify-center rounded border border-border bg-card hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
          title="Previous Page"
        >
          <ChevronLeft className="size-3" />
        </button>

        <span className="px-1 font-medium text-foreground">
          {currentPage} / {totalPages}
        </span>

        <button
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
          className="flex size-5 items-center justify-center rounded border border-border bg-card hover:bg-accent hover:text-foreground disabled:opacity-40 transition-colors"
          title="Next Page"
        >
          <ChevronRight className="size-3" />
        </button>
      </div>
    </div>
  );
};

