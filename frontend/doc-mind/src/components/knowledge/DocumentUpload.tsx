import React, { useRef, useState } from 'react';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { useKnowledge } from '../../context/KnowledgeContext';

export const DocumentUpload: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { uploadDocument, uploadState } = useKnowledge();
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      uploadDocument(files[0]);
      e.target.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files && files.length > 0) {
      uploadDocument(files[0]);
    }
  };

  return (
    <div className="space-y-2">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
        accept=".pdf,.docx,.txt,.xlsx,.pptx,.csv,.md,.json"
      />

      {/* Drag & Drop Upload Knowledge Source Box (Matching Image 2) */}
      <div
        onClick={() => fileInputRef.current?.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`group relative flex flex-col items-center justify-center rounded-xl border border-dashed p-4 text-center cursor-pointer transition-all space-y-2 select-none ${
          isDragging
            ? 'border-primary bg-primary/10'
            : 'border-border/80 bg-muted/10 hover:border-primary/50 hover:bg-muted/30'
        }`}
      >
        <div className="flex size-9 items-center justify-center rounded-xl bg-card border border-border/80 text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary transition-colors">
          <Upload className="size-4" />
        </div>

        <div className="space-y-0.5">
          <div className="text-xs font-bold text-foreground">Upload Knowledge Source</div>
          <div className="text-[11px] text-muted-foreground">Drag & drop or click to browse files</div>
        </div>

        <div className="text-[9.5px] text-muted-foreground/70 max-w-[210px] leading-tight">
          PDF, DOCX, XLSX, PPTX, HTML, XML, TXT, MD, CSV, JSON (Max 25MB)
        </div>
      </div>

      {/* Upload Progress & Indexing Status Banner */}
      {uploadState && (
        <div className="rounded-lg border border-border bg-card/90 p-2.5 text-xs shadow-xs space-y-1.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between text-[11px]">
            <span className="font-medium text-foreground truncate max-w-[140px]">
              {uploadState.fileName}
            </span>
            {uploadState.status === 'uploading' && (
              <span className="text-muted-foreground flex items-center gap-1 text-[10px]">
                <Loader2 className="size-3 animate-spin text-primary" />
                {uploadState.progress}%
              </span>
            )}
            {uploadState.status === 'indexing' && (
              <span className="text-amber-400 flex items-center gap-1 text-[10px] font-medium">
                <Loader2 className="size-3 animate-spin text-amber-400" />
                Indexing...
              </span>
            )}
            {uploadState.status === 'completed' && (
              <span className="text-emerald-400 flex items-center gap-1 text-[10px] font-medium">
                <CheckCircle2 className="size-3 text-emerald-400" />
                Indexed
              </span>
            )}
            {uploadState.status === 'error' && (
              <span className="text-destructive flex items-center gap-1 text-[10px] font-medium">
                <AlertCircle className="size-3" />
                Failed
              </span>
            )}
          </div>

          {(uploadState.status === 'uploading' || uploadState.status === 'indexing') && (
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${uploadState.progress}%` }}
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
