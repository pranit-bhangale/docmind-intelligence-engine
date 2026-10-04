import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Sun,
  Moon,
  Search,
  Menu,
  Sparkles,
  MessageSquare,
  Zap,
  Octagon,
  Download,
  SlidersHorizontal,
  X,
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useKnowledge } from '../../context/KnowledgeContext';
import { useAuth } from '../../context/AuthContext';
import { UserDropdown } from './UserDropdown';
import { Button } from '../ui/button';
import { Tooltip } from '../ui/Tooltip';

interface TopNavProps {
  onToggleMobileDrawer: () => void;
  onOpenCommandK: () => void;
  onOpenRegisterTenantModal: () => void;
  onOpenSettingsModal: () => void;
  onOpenLoginModal: () => void;
}

export const TopNav: React.FC<TopNavProps> = ({
  onToggleMobileDrawer,
  onOpenCommandK,
  onOpenSettingsModal,
  onOpenLoginModal,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { isAdmin } = useAuth();
  const location = useLocation();
  const isChatView = location.pathname === '/chat' || (!isAdmin && location.pathname === '/');
  const {
    startNewChat,
    generationMode,
    toggleGenerationMode,
    exportChatAsMarkdown,
    activeConversation,
    documents,
    contextDocIds,
    ragSettings,
    updateRagSettings,
  } = useKnowledge();

  const [isRagSettingsOpen, setIsRagSettingsOpen] = useState(false);

  const messages = activeConversation?.messages || [];
  const activeDocs = documents.filter((d) => contextDocIds.includes(d.id));
  const primaryDoc = activeDocs[0];

  return (
    <header className="relative flex h-14 w-full items-center justify-between border-b border-border/70 bg-card/80 px-4 backdrop-blur-md transition-colors select-none shrink-0 z-40">
      {/* Left Area: Mobile Menu & DocMind Assistant Branding */}
      <div className="flex items-center gap-2.5 truncate">
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={onToggleMobileDrawer}
          className="md:hidden text-muted-foreground hover:text-foreground shrink-0"
        >
          <Menu className="size-4" />
        </Button>

        <div className="flex items-center gap-2 truncate">
          <div className="flex size-6 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold shrink-0">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-bold text-foreground text-xs truncate">
            {isAdmin ? 'DocMind Operations' : 'DocMind Assistant'}
          </span>
          <span className={`rounded-full border px-2 py-0.5 text-[10px] font-semibold hidden sm:inline ${
            isAdmin
              ? 'border-primary/30 bg-primary/10 text-primary'
              : 'border-border bg-muted/40 text-muted-foreground'
          }`}>
            {isAdmin ? 'Admin Console' : 'RAG workflow'}
          </span>
          {primaryDoc && (
            <span className="text-[10px] text-muted-foreground truncate hidden lg:inline">
              Scoped to: <span className="font-medium text-foreground">{primaryDoc.name}</span>
            </span>
          )}
        </div>
      </div>

      {/* Center Area: Chat & RAG controls (Visible when viewing Chat workspace) */}
      {isChatView && (
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center gap-2">
          <button
            onClick={() => startNewChat()}
            className="flex items-center gap-1.5 px-3 py-1 rounded-full border border-border bg-background hover:bg-accent text-foreground text-[11px] font-medium transition-all shadow-2xs"
            title="Start new chat session (X-Conversation-Id UUID)"
          >
            <MessageSquare className="size-3 text-primary" />
            <span>New Chat</span>
          </button>

          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* Streaming / Blocking Toggle */}
          <button
            onClick={toggleGenerationMode}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
              generationMode === 'streaming'
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-400 shadow-xs'
                : 'border-zinc-700 bg-zinc-800 text-zinc-300'
            }`}
            title={`Switch to ${generationMode === 'streaming' ? 'Blocking' : 'Streaming'} response mode`}
          >
            {generationMode === 'streaming' ? (
              <>
                <Zap className="size-3 text-amber-400" />
                <span>Streaming</span>
              </>
            ) : (
              <>
                <Octagon className="size-3 text-zinc-400" />
                <span>Blocking</span>
              </>
            )}
          </button>

          <div className="h-4 w-px bg-border/80 mx-0.5" />

          {/* RAG Settings Control Button & Popover */}
          <div className="relative">
            <button
              onClick={() => setIsRagSettingsOpen(!isRagSettingsOpen)}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold border transition-all ${
                isRagSettingsOpen
                  ? 'border-primary bg-primary/10 text-primary shadow-xs'
                  : 'border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground'
              }`}
              title="Configure RAG AI Provider, Top-K, and Similarity Threshold"
            >
              <SlidersHorizontal className="size-3 text-primary" />
              <span className="hidden sm:inline">RAG Settings</span>
            </button>

            {/* RAG Settings Floating Popover */}
            {isRagSettingsOpen && (
              <div className="absolute left-1/2 top-full mt-2 -translate-x-1/2 w-80 rounded-2xl border border-border/80 bg-card/95 p-4 shadow-2xl backdrop-blur-md z-50 text-xs animate-in fade-in zoom-in-95 duration-150 select-none">
                <div className="flex items-center justify-between border-b border-border/60 pb-2.5 mb-3">
                  <div className="flex items-center gap-2">
                    <SlidersHorizontal className="size-4 text-primary" />
                    <div>
                      <h3 className="font-bold text-foreground text-xs leading-tight">RAG Configuration</h3>
                      <p className="text-[10px] text-muted-foreground">Provider & Vector Parameters</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsRagSettingsOpen(false)}
                    className="rounded-md p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
                  >
                    <X className="size-3.5" />
                  </button>
                </div>

                <div className="space-y-3.5">
                  {/* 1. AI Provider Selection */}
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-semibold text-foreground flex items-center justify-between">
                      <span>AI Model Provider</span>
                      <span className="text-[10px] font-normal text-muted-foreground uppercase">{ragSettings.provider}</span>
                    </label>
                    <select
                      value={ragSettings.provider}
                      onChange={(e) => updateRagSettings({ provider: e.target.value as any })}
                      className="w-full h-8 rounded-xl border border-input bg-background/80 px-2.5 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    >
                      <option value="NVIDIA">NVIDIA</option>
                      <option value="OLLAMA">OLLAMA</option>
                    </select>
                  </div>

                  {/* 2. Top-K Vector Chunks */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">Top-K Vector Chunks</span>
                      <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {ragSettings.topK} chunks
                      </span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="20"
                      step="1"
                      value={ragSettings.topK}
                      onChange={(e) => updateRagSettings({ topK: parseInt(e.target.value, 10) })}
                      className="w-full accent-primary h-1.5 bg-secondary rounded-lg cursor-pointer"
                    />
                    <p className="text-[9.5px] text-muted-foreground leading-tight">
                      Number of vector chunks retrieved and passed into context.
                    </p>
                  </div>

                  {/* 3. Similarity Threshold */}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-semibold text-foreground">Similarity Threshold</span>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                        {ragSettings.similarityThreshold.toFixed(2)}
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0.0"
                      max="1.0"
                      step="0.05"
                      value={ragSettings.similarityThreshold}
                      onChange={(e) => updateRagSettings({ similarityThreshold: parseFloat(e.target.value) })}
                      className="w-full accent-emerald-500 h-1.5 bg-secondary rounded-lg cursor-pointer"
                    />
                    <p className="text-[9.5px] text-muted-foreground leading-tight">
                      Cosine similarity score threshold range: 0.0 to 1.0.
                    </p>
                  </div>

                  {/* 4. Vector RAG Retrieval (Always Enabled By Default) */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div>
                      <div className="text-[11px] font-semibold text-foreground flex items-center gap-1.5">
                        <span>Vector RAG Retrieval</span>
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-400">
                          Always Active
                        </span>
                      </div>
                      <div className="text-[9.5px] text-muted-foreground">Context grounding on indexed documents is enabled</div>
                    </div>
                  </div>

                  {/* 5. Enable Query Rewriting Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-border/50">
                    <div>
                      <div className="text-[11px] font-semibold text-foreground">Query Transformer Optimization</div>
                      <div className="text-[9.5px] text-muted-foreground">Rewrite query semantically before searching</div>
                    </div>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={ragSettings.enableQueryRewriting ?? true}
                        onChange={(e) => updateRagSettings({ enableQueryRewriting: e.target.checked })}
                        className="sr-only peer"
                      />
                      <div className="w-8 h-4 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-3 after:w-3 after:transition-all peer-checked:bg-primary"></div>
                    </label>
                  </div>

                  {/* Save Settings Action Button */}
                  <div className="pt-2 border-t border-border/60">
                    <Button
                      size="xs"
                      className="w-full justify-center text-xs font-semibold h-7"
                      onClick={() => {
                        updateRagSettings(ragSettings);
                        setIsRagSettingsOpen(false);
                      }}
                    >
                      Save Settings for All Chats
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Right Controls: Export .md + Command Palette + Theme + Profile */}
      <div className="flex items-center gap-1.5 shrink-0 ml-auto">
        {isChatView && (
          <button
            onClick={exportChatAsMarkdown}
            disabled={messages.length === 0}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-border bg-background hover:bg-accent text-muted-foreground hover:text-foreground disabled:opacity-30 transition-colors text-xs font-medium mr-1"
            title="Export chat as Markdown (.md)"
          >
            <Download className="size-3.5 text-primary" />
            <span className="hidden sm:inline">Download</span>
          </button>
        )}

        <Tooltip content="Quick Command Palette (Ctrl+K)">
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={onOpenCommandK}
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="size-4" />
          </Button>
        </Tooltip>

        <Tooltip content={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}>
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={toggleTheme}
            className="text-muted-foreground hover:text-foreground transition-transform active:scale-95"
          >
            {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
          </Button>
        </Tooltip>

        <div className="h-4 w-px bg-border/80 mx-1" />

        <UserDropdown
          onOpenSettings={onOpenSettingsModal}
          onOpenLoginModal={onOpenLoginModal}
        />
      </div>
    </header>
  );
};

