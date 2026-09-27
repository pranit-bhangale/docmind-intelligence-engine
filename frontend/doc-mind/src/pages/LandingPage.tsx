import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Shield,
  Cpu,
  FileText,
  CheckCircle2,
  ArrowRight,
  Database,
  Lock,
  Zap,
  Building2,
  Sun,
  Moon,
} from 'lucide-react';
import { Logo } from '../components/common/Logo';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();

  // Interactive Demo Sandbox State
  const [activeTab, setActiveTab] = useState<'upload' | 'embed' | 'rag'>('upload');
  const [queryInput, setQueryInput] = useState('What are the key security and tenant isolation policies in DocMind?');
  const [isSimulating, setIsSimulating] = useState(false);
  const [simulatedAnswer, setSimulatedAnswer] = useState<string | null>(
    'DocMind enforces strict multi-tenant isolation using JWT claim scoping and partition IDs. Each document chunk is indexed with a tenant_id filter in Qdrant vector storage to prevent cross-tenant data leakage.'
  );

  const handleSimulateRAG = () => {
    setIsSimulating(true);
    setSimulatedAnswer(null);
    setTimeout(() => {
      setIsSimulating(false);
      setSimulatedAnswer(
        `Based on ingested documentation: DocMind utilizes hybrid Qdrant vector retrieval combined with Nvidia LLM generation. Responses include exact page reference citations and source verification confidence scores.`
      );
    }, 1200);
  };

  return (
    <div className="min-h-screen w-full bg-background text-foreground antialiased font-sans flex flex-col selection:bg-primary/20 selection:text-primary">
      {/* Header Bar */}
      <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Logo size="md" onClick={() => navigate('/')} />

          {/* Nav Links */}
          <nav className="hidden md:flex items-center gap-6 text-xs font-medium text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">
              Features
            </a>
            <a href="#architecture" className="hover:text-foreground transition-colors">
              Architecture
            </a>
            <a href="#demo" className="hover:text-foreground transition-colors">
              Live RAG Demo
            </a>
            <a href="#tiers" className="hover:text-foreground transition-colors">
              Tenant Tiers
            </a>
          </nav>

          {/* Action CTAs */}
          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
            </button>

            {isAuthenticated ? (
              <Button
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="gap-1.5 shadow-md shadow-primary/20"
              >
                Go to Dashboard
                <ArrowRight className="size-3.5" />
              </Button>
            ) : (
              <>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                  className="text-xs font-semibold"
                >
                  Sign In
                </Button>
                <Button
                  size="sm"
                  onClick={() => navigate('/register-tenant')}
                  className="gap-1.5 text-xs font-semibold shadow-md shadow-primary/20"
                >
                  <Building2 className="size-3.5" />
                  Register Tenant
                </Button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 md:pt-20 md:pb-28 overflow-hidden">
        {/* Ambient Glow Effects */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] bg-gradient-to-tr from-primary/20 via-purple-500/10 to-transparent rounded-full blur-3xl pointer-events-none -z-10" />
        <div className="absolute top-10 left-10 size-72 bg-blue-500/10 rounded-full blur-3xl pointer-events-none -z-10" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Pill Announcement */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary text-xs font-medium shadow-xs animate-in fade-in duration-500">
            <Sparkles className="size-3.5" />
            <span>DocMind Intelligence Engine 2.0 • Multi-Tenant RAG Stack</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-foreground max-w-4xl mx-auto leading-[1.15]">
            Transform Enterprise Documents into <span className="bg-gradient-to-r from-primary via-purple-500 to-indigo-500 bg-clip-text text-transparent">Grounded AI Knowledge</span>
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            High-performance document ingestion, Qdrant vector indexing, and multi-tenant conversational AI. Grounded answer generation with strict organizational boundaries.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
            {isAuthenticated ? (
              <Button
                size="lg"
                onClick={() => navigate('/dashboard')}
                className="w-full sm:w-auto gap-2 px-6 h-11 text-sm font-semibold shadow-lg shadow-primary/25"
              >
                Open Workspace Dashboard
                <ArrowRight className="size-4" />
              </Button>
            ) : (
              <>
                <Button
                  size="lg"
                  onClick={() => navigate('/register-tenant')}
                  className="w-full sm:w-auto gap-2 px-6 h-11 text-sm font-semibold shadow-lg shadow-primary/25"
                >
                  <Building2 className="size-4" />
                  Provision Tenant Organization
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto gap-2 px-6 h-11 text-sm font-semibold"
                >
                  <Lock className="size-4 text-primary" />
                  Sign In to Existing Account
                </Button>
              </>
            )}
          </div>

          {/* Quick Metrics */}
          <div className="pt-8 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-3xl mx-auto border-t border-border/60">
            <div>
              <div className="text-xl font-black text-foreground">Multi-Tenant</div>
              <div className="text-xs text-muted-foreground">Strict Row-Level Partitioning</div>
            </div>
            <div>
              <div className="text-xl font-black text-foreground">Qdrant Vector DB</div>
              <div className="text-xs text-muted-foreground">Hybrid Index & Similarity</div>
            </div>
            <div>
              <div className="text-xl font-black text-foreground">Nvidia LLMs</div>
              <div className="text-xs text-muted-foreground">Contextual RAG Pipeline</div>
            </div>
            <div>
              <div className="text-xl font-black text-foreground">Multi-Format</div>
              <div className="text-xs text-muted-foreground">PDF, DOCX, TXT, Markdown</div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Live Demo Sandbox */}
      <section id="demo" className="py-16 bg-muted/30 border-y border-border/60">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Experience the RAG Pipeline Sandbox
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Simulate document ingestion, vector embedding chunking, and AI grounded query retrieval.
            </p>
          </div>

          {/* Sandbox Mock Console */}
          <div className="rounded-2xl border border-border bg-card shadow-2xl overflow-hidden">
            {/* Console Header */}
            <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
              <div className="flex items-center gap-2">
                <div className="size-3 rounded-full bg-red-500/80" />
                <div className="size-3 rounded-full bg-amber-500/80" />
                <div className="size-3 rounded-full bg-emerald-500/80" />
                <span className="text-xs font-semibold text-muted-foreground ml-2">DocMind Hybrid RAG Pipeline</span>
              </div>
              <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                <span className="inline-block size-2 rounded-full bg-emerald-500 animate-pulse" />
                Active Qdrant & Nvidia Cluster
              </div>
            </div>

            {/* Sandbox Body */}
            <div className="p-6 space-y-6">
              {/* Step Process Buttons */}
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => setActiveTab('upload')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'upload'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-accent text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <FileText className="size-3.5" /> 1. Ingestion
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">PDF / DOCX Parse</div>
                </button>

                <button
                  onClick={() => setActiveTab('embed')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'embed'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-accent text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Database className="size-3.5" /> 2. Vector Store
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Qdrant Indexing</div>
                </button>

                <button
                  onClick={() => setActiveTab('rag')}
                  className={`p-3 rounded-xl border text-left transition-all ${
                    activeTab === 'rag'
                      ? 'border-primary bg-primary/10 text-primary font-semibold'
                      : 'border-border bg-background hover:bg-accent text-muted-foreground'
                  }`}
                >
                  <div className="flex items-center gap-2 text-xs font-bold">
                    <Sparkles className="size-3.5" /> 3. Hybrid RAG
                  </div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">Nvidia Synthesis</div>
                </button>
              </div>

              {/* Demo Interactive Content */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground block">Test Conversational Query</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={queryInput}
                      onChange={(e) => setQueryInput(e.target.value)}
                      className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                    />
                    <Button size="sm" onClick={handleSimulateRAG} disabled={isSimulating} className="gap-1.5 shrink-0">
                      <Zap className={`size-3.5 ${isSimulating ? 'animate-spin' : ''}`} />
                      {isSimulating ? 'Retrieving...' : 'Run Query'}
                    </Button>
                  </div>
                </div>

                {/* Simulated Output Card */}
                <div className="p-4 rounded-xl border border-border bg-muted/20 space-y-3">
                  <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      <Sparkles className="size-3.5 text-primary" />
                      Grounded Answer Response
                    </div>
                    <span className="text-[10px] text-emerald-500 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-full">
                      Vector Similarity Score: 0.94
                    </span>
                  </div>

                  {isSimulating ? (
                    <div className="py-6 text-center text-xs text-muted-foreground animate-pulse flex items-center justify-center gap-2">
                      <Cpu className="size-4 text-primary animate-spin" />
                      Searching Qdrant Vector Collection & Generating Nvidia Response...
                    </div>
                  ) : (
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {simulatedAnswer}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Feature Highlights Grid */}
      <section id="features" className="py-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="text-center space-y-3">
          <Badge variant="outline" className="text-primary font-medium">Enterprise Features</Badge>
          <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
            Engineered for Multi-Tenant Intelligence
          </h2>
          <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
            DocMind combines robust Spring Boot multi-tenant backend architecture with high-performance vector search.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-6 space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
              <Building2 className="size-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Multi-Tenant Isolation</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Complete organizational separation. Tenant codes, isolated user partitions, and scoped authority controls ensure complete data privacy across tenants.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-xl bg-purple-500/10 text-purple-500 flex items-center justify-center">
              <Database className="size-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Qdrant Vector DB</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Fast, accurate vector index storage. Embeddings are tagged with tenant metadata filters for instant sub-second similarity matching.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center">
              <Sparkles className="size-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Nvidia Hybrid RAG</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Leverage cutting-edge LLMs for contextual synthesis. Get clear, citation-grounded answers without hallucinations.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
              <FileText className="size-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Multi-Format Support</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Ingest PDF, Microsoft Word DOCX, TXT files, and Markdown documentation effortlessly with automatic text chunking pipelines.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center">
              <Shield className="size-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">Granular Role RBAC</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Platform Admin, Company Admin, Admin, and User authority tiers. Precise control over tenant configuration and account management.
            </p>
          </Card>

          <Card className="p-6 space-y-4 hover:border-primary/50 transition-colors">
            <div className="size-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
              <Cpu className="size-5" />
            </div>
            <h3 className="text-base font-bold text-foreground">System Health Monitoring</h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Built-in OpenAPI/Swagger specification endpoints, real-time database ping health checks, and active directory analytics.
            </p>
          </Card>
        </div>
      </section>

      {/* Tenant Tier Plans */}
      <section id="tiers" className="py-20 bg-muted/20 border-t border-border/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          <div className="text-center space-y-3">
            <Badge variant="outline" className="text-primary font-medium">Tenant Tiers</Badge>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Flexible Organizational Provisioning
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Select the tier tailored for your enterprise scale and workspace security requirements.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Starter Plan */}
            <Card className="p-6 space-y-6 relative flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Single Tenant</h3>
                <p className="text-xs text-muted-foreground">Ideal for individual teams testing RAG capabilities.</p>
                <div className="text-2xl font-black text-foreground">Standard Partition</div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> 1 Organization Partition</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Multi-Format Ingestion</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Qdrant Vector Retrieval</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full text-xs font-semibold" onClick={() => navigate('/register-tenant')}>
                Register Single Tenant
              </Button>
            </Card>

            {/* Business Plan */}
            <Card className="p-6 space-y-6 relative flex flex-col justify-between border-primary ring-2 ring-primary/20 shadow-xl">
              <div className="absolute -top-3 right-4 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                Most Popular
              </div>
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Company Admin Tier</h3>
                <p className="text-xs text-muted-foreground">For growing enterprises managing multi-user access.</p>
                <div className="text-2xl font-black text-foreground">Multi-User Tenant</div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Company Admin Governance</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> User Directory Management</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> High-Priority Qdrant Vector Search</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Nvidia Hybrid RAG Answers</li>
                </ul>
              </div>
              <Button className="w-full text-xs font-semibold shadow-md shadow-primary/20" onClick={() => navigate('/register-tenant')}>
                Provision Company Tenant
              </Button>
            </Card>

            {/* Platform Plan */}
            <Card className="p-6 space-y-6 relative flex flex-col justify-between">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-foreground">Platform Admin</h3>
                <p className="text-xs text-muted-foreground">Full platform oversight across unlimited tenant partitions.</p>
                <div className="text-2xl font-black text-foreground">Enterprise Multi-Tenant</div>
                <ul className="space-y-2 text-xs text-muted-foreground pt-2">
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Platform Admin Authority</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Tenant Approval & Status Controls</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> Dedicated Qdrant Vector Collections</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="size-3.5 text-primary shrink-0" /> System-wide Health & API Access</li>
                </ul>
              </div>
              <Button variant="outline" className="w-full text-xs font-semibold" onClick={() => navigate('/login')}>
                Sign In as Platform Admin
              </Button>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="mt-auto border-t border-border bg-card py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-6">
          <Logo size="sm" />
          <div className="text-xs text-muted-foreground text-center md:text-left">
            © {new Date().getFullYear()} DocMind Intelligence Engine. Powered by Spring Boot 3, React 19, Qdrant Vector DB & Nvidia AI.
          </div>
          <div className="flex items-center gap-4 text-xs font-medium text-muted-foreground">
            <button onClick={() => navigate('/login')} className="hover:text-foreground transition-colors">
              Sign In
            </button>
            <button onClick={() => navigate('/register-tenant')} className="hover:text-foreground transition-colors">
              Register Tenant
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
};
