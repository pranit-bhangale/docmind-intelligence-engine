import React from 'react';
import { Database, Search, X } from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';
import { DocumentUpload } from './DocumentUpload';
import { DocumentList } from './DocumentList';
import { DocumentPagination } from './DocumentPagination';

interface KnowledgeSectionProps {
  isCollapsed?: boolean;
}

export const KnowledgeSection: React.FC<KnowledgeSectionProps> = ({ isCollapsed = false }) => {
  const { documents, filteredDocuments, searchQuery, setSearchQuery } = useKnowledge();

  if (isCollapsed) {
    return (
      <div className="flex flex-col items-center gap-2 py-2 border-t border-border/60">
        <button
          className="flex size-9 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
        >
          <Database className="size-4 text-primary" />
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3 border-t border-border/60 pt-3">
      {/* Knowledge Base Header (Matching Image 2) */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <Database className="size-4 text-primary shrink-0" />
          <div>
            <div className="text-xs font-bold text-foreground leading-tight">Knowledge Base</div>
            <div className="text-[10px] text-muted-foreground leading-tight">Vector Stores & Documents</div>
          </div>
        </div>

        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
          {documents.length} {documents.length === 1 ? 'doc' : 'docs'}
        </span>
      </div>

      {/* Upload Dropzone Card */}
      <DocumentUpload />

      {/* Search Input Box (Matching Image 2) */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search documents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full h-8 rounded-xl border border-input bg-background/60 pl-8 pr-7 text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary"
        />
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        )}
      </div>

      {/* Available Files Section Header (Matching Image 2) */}
      <div className="flex items-center justify-between px-1 pt-1 text-[10px] uppercase font-bold tracking-wider text-muted-foreground/80">
        <span>Available Files</span>
        <span className="font-normal text-muted-foreground lowercase">
          {filteredDocuments.length} shown
        </span>
      </div>

      {/* Document List */}
      <DocumentList />

      {/* Compact Pagination */}
      <DocumentPagination />
    </div>
  );
};
