import React from 'react';
import { FileText, X } from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';

export const ContextDocuments: React.FC = () => {
  const { documents, contextDocIds, removeDocumentFromContext } = useKnowledge();

  const activeDocs = documents.filter((d) => contextDocIds.includes(d.id));

  if (activeDocs.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 pb-2 text-xs select-none">
      <span className="text-[10px] uppercase font-semibold text-muted-foreground/80 tracking-wider mr-1">
        Context:
      </span>
      {activeDocs.map((doc) => (
        <span
          key={doc.id}
          className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[11px] font-medium text-foreground transition-all hover:bg-primary/20"
        >
          <FileText className="size-3 text-primary shrink-0" />
          <span className="truncate max-w-[140px]">{doc.name}</span>
          <button
            onClick={() => removeDocumentFromContext(doc.id)}
            className="flex size-3.5 items-center justify-center rounded-full text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
            title="Remove from chat context"
          >
            <X className="size-2.5" />
          </button>
        </span>
      ))}
    </div>
  );
};
