import React from 'react';
import { useKnowledge } from '../../context/KnowledgeContext';
import { DocumentListItem } from './DocumentListItem';
import { FileText } from 'lucide-react';

export const DocumentList: React.FC = () => {
  const { paginatedDocuments, filteredDocuments } = useKnowledge();

  if (filteredDocuments.length === 0) {
    return (
      <div className="py-4 text-center text-xs text-muted-foreground border border-dashed border-border/60 rounded-lg p-3">
        <FileText className="size-4 text-muted-foreground mx-auto mb-1 opacity-60" />
        <div>No documents found</div>
        <div className="text-[10px] text-muted-foreground/70 mt-0.5">
          Upload a file to add knowledge
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      {paginatedDocuments.map((doc) => (
        <DocumentListItem key={doc.id} doc={doc} />
      ))}
    </div>
  );
};
