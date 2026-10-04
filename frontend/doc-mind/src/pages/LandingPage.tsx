import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Check,
  ArrowRight,
  Building2,
  Sun,
  Moon,
  Shield,
  Database,
  Cpu,
  Layers,
  Zap,
  Server,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  return (
    <div className="min-h-screen w-full bg-zinc-50 dark:bg-[#09090b] text-zinc-900 dark:text-zinc-100 font-sans flex flex-col justify-between selection:bg-primary/30 selection:text-white overflow-x-hidden antialiased transition-colors duration-200">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-white/[0.08] bg-white/80 dark:bg-[#09090b]/90 backdrop-blur-md shrink-0 transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between relative">
          {/* Left Logo */}
          <Logo size="sm" onClick={() => navigate('/')} />

          {/* Centered Nav */}
          <nav className="hidden md:flex items-center gap-6 text-[14px] font-medium text-zinc-600 dark:text-zinc-400 mx-auto">
            <a href="#features" className="hover:text-zinc-900 dark:hover:text-white transition-colors">
              Features
            </a>
          </nav>

          {/* Right CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-1.5 rounded-lg border border-zinc-200 dark:border-white/10 bg-zinc-100 dark:bg-white/[0.03] hover:bg-zinc-200 dark:hover:bg-white/[0.08] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              aria-label="Toggle Theme"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? (
                <Sun className="size-3.5 text-amber-400" />
              ) : (
                <Moon className="size-3.5 text-zinc-700" />
              )}
            </button>

            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="h-8 text-[13px] font-semibold gap-1.5 px-3"
              >
                Dashboard <ArrowRight className="size-3" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="h-8 text-[13px] font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register-tenant')}
                  className="h-8 text-[13px] font-semibold gap-1.5 px-3 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-xs"
                >
                  <Building2 className="size-3.5" />
                  Register Workspace
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-6xl mx-auto px-4 sm:px-6 w-full py-6 md:py-8 space-y-8 flex flex-col justify-center items-center">
        {/* Concise Hero Heading & Project Intent Subtitle */}
        <div className="text-center space-y-3 max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold bg-primary/10 text-primary border border-primary/20">
            <Cpu className="size-3" />
            <span>Multi-Tenant AI & Hybrid RAG Engine</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-zinc-900 dark:text-white">
            DocMind Intelligence Engine
          </h1>
          <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-2xl mx-auto">
            Enterprise multi-tenant workspace provisioning powered by hybrid vector RAG, schema-per-tenant governance, and dual LLM provider orchestration.
          </p>
        </div>

        {/* Tenant Tier Cards */}
        <section id="tiers" className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
          {/* Single Tenant */}
          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-xs dark:shadow-none">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">Single Tenant</div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Standard Partition</div>
              </div>

              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-white/5">
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Multi-Format Ingestion
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Qdrant Vector Indexing
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Tenant-Isolated Storage
                </li>
              </ul>
            </div>

            <div className="pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/register-tenant')}
                className="w-full h-8 text-xs font-medium border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-800 dark:text-zinc-200"
              >
                Register
              </Button>
            </div>
          </div>

          {/* Company Admin (RECOMMENDED) */}
          <div className="relative rounded-xl border border-primary/50 bg-gradient-to-b from-primary/10 via-primary/5 to-white dark:from-primary/[0.08] dark:to-transparent p-5 flex flex-col justify-between ring-1 ring-primary/30 shadow-md dark:shadow-lg dark:shadow-primary/10">
            <div className="absolute -top-2.5 right-4 px-2.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[9px] font-bold tracking-wider">
              RECOMMENDED
            </div>
            <div className="space-y-3">
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">Company Admin</div>
                <div className="text-xs font-semibold text-primary mt-0.5">Multi-User Tenant</div>
              </div>

              <ul className="space-y-2 text-xs text-zinc-800 dark:text-zinc-200 pt-2 border-t border-primary/10 dark:border-white/10">
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Schema-Per-Tenant Isolation
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Hybrid RAG & Query Pipeline
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Multi-User Governance & Directory
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Real-Time Streaming & Citations
                </li>
              </ul>
            </div>

            <div className="pt-5">
              <Button
                size="sm"
                onClick={() => navigate('/register-tenant')}
                className="w-full h-8 text-xs font-semibold bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-950 dark:hover:bg-zinc-200 shadow-xs"
              >
                Provision
              </Button>
            </div>
          </div>

          {/* Platform Admin */}
          <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-5 flex flex-col justify-between hover:border-zinc-300 dark:hover:border-white/20 transition-all shadow-xs dark:shadow-none">
            <div className="space-y-3">
              <div>
                <div className="text-sm font-bold text-zinc-900 dark:text-white tracking-wide">Platform Admin</div>
                <div className="text-xs font-semibold text-zinc-500 dark:text-zinc-400 mt-0.5">Enterprise Multi-Tenant</div>
              </div>

              <ul className="space-y-2 text-xs text-zinc-700 dark:text-zinc-300 pt-2 border-t border-zinc-100 dark:border-white/5">
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Platform Admin Approval Controls
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Tenant Lifecycle & Metrics
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Role-Based Access Control (RBAC)
                </li>
                <li className="flex items-center gap-2 text-[12px]">
                  <Check className="size-3.5 text-primary shrink-0" /> Auditable Platform Operations
                </li>
              </ul>
            </div>

            <div className="pt-5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/login')}
                className="w-full h-8 text-xs font-medium border-zinc-300 dark:border-white/10 hover:bg-zinc-100 dark:hover:bg-white/[0.06] text-zinc-800 dark:text-zinc-200"
              >
                Platform Login
              </Button>
            </div>
          </div>
        </section>

        {/* What Your Workspace Provides Section */}
        <section id="features" className="space-y-4 pt-4 border-t border-zinc-200 dark:border-white/[0.06]">
          <div className="text-center space-y-1">
            <h2 className="text-base font-bold text-zinc-900 dark:text-white tracking-tight">
              What Your Workspace Provides
            </h2>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Built for enterprise compliance, high-performance RAG, and strict tenant data boundary enforcement.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto w-full">
            {/* Customer Data */}
            <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 space-y-2 shadow-xs dark:shadow-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                <Database className="size-3.5 text-primary" />
                <span>Customer Data Isolation</span>
              </div>
              <ul className="space-y-1 text-[11.5px] text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-1.5">• Isolated document storage per tenant</li>
                <li className="flex items-center gap-1.5">• Tenant-scoped retrieval & citations</li>
                <li className="flex items-center gap-1.5">• Secure conversational RAG streaming</li>
              </ul>
            </div>

            {/* Hybrid RAG & AI Pipeline */}
            <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 space-y-2 shadow-xs dark:shadow-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                <Zap className="size-3.5 text-emerald-500 dark:text-emerald-400" />
                <span>Hybrid RAG & AI Pipeline</span>
              </div>
              <ul className="space-y-1 text-[11.5px] text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-1.5">• Query rewriting & context augmentation</li>
                <li className="flex items-center gap-1.5">• NVIDIA Enterprise & Ollama LLMs</li>
                <li className="flex items-center gap-1.5">• Real-time SSE execution telemetry</li>
              </ul>
            </div>

            {/* Enterprise Security & Governance */}
            <div className="rounded-xl border border-zinc-200 dark:border-white/10 bg-white dark:bg-white/[0.02] p-4 space-y-2 shadow-xs dark:shadow-none">
              <div className="flex items-center gap-2 text-xs font-bold text-zinc-900 dark:text-white">
                <Shield className="size-3.5 text-purple-500 dark:text-purple-400" />
                <span>Governance & Security</span>
              </div>
              <ul className="space-y-1 text-[11.5px] text-zinc-600 dark:text-zinc-400">
                <li className="flex items-center gap-1.5">• Schema-level multi-tenant isolation</li>
                <li className="flex items-center gap-1.5">• Role-based access control (RBAC)</li>
                <li className="flex items-center gap-1.5">• Auditable platform operations</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Enterprise Architecture Feature Badges */}
        <section id="architecture" className="pt-2">
          <div className="rounded-xl border border-zinc-200/80 dark:border-white/10 bg-zinc-100/60 dark:bg-white/[0.01] p-3.5 max-w-5xl mx-auto w-full flex flex-wrap items-center justify-around gap-4 text-xs">
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Server className="size-3.5 text-primary shrink-0" />
              <span className="font-semibold">Spring Boot 4</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Database className="size-3.5 text-emerald-500 dark:text-emerald-400 shrink-0" />
              <span className="font-semibold">Qdrant Vector Database</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Layers className="size-3.5 text-purple-500 dark:text-purple-400 shrink-0" />
              <span className="font-semibold">Schema-Per-Tenant Isolation</span>
            </div>
            <div className="flex items-center gap-2 text-zinc-700 dark:text-zinc-300">
              <Cpu className="size-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
              <span className="font-semibold">NVIDIA & Ollama LLM Orchestration</span>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-zinc-200 dark:border-white/[0.08] bg-zinc-100 dark:bg-[#09090b] py-3 text-center shrink-0 transition-colors duration-200">
        <p className="text-[11px] text-zinc-500 dark:text-zinc-500">
          © 2026 DocMind Intelligence Engine. All rights reserved.
        </p>
      </footer>
    </div>
  );
};
