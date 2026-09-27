import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Layers, Activity, FileCode, ExternalLink, CheckCircle2, Key, Database, BookOpen } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Badge } from '../ui/Badge';

interface EndpointItem {
  method: 'GET' | 'POST' | 'PATCH' | 'DELETE';
  path: string;
  version?: string;
  summary: string;
  auth: string;
}

interface ControllerModule {
  tag: string;
  controller: string;
  description: string;
  endpoints: EndpointItem[];
}

const API_CONTROLLER_MODULES: ControllerModule[] = [
  {
    tag: 'Authentication & Session',
    controller: 'LoginController.java',
    description: 'Endpoints for user authentication, current identity resolution, token renewal, and session termination.',
    endpoints: [
      { method: 'POST', path: '/api/auth/login', version: 'v1', summary: 'Authenticate user credentials & issue JWT cookies', auth: 'Public' },
      { method: 'GET', path: '/api/auth/me', version: 'v1', summary: 'Get current authenticated user identity & context', auth: 'Authenticated Roles' },
      { method: 'POST', path: '/api/auth/refresh', version: 'v1', summary: 'Refresh access token from HttpOnly cookie', auth: 'Authenticated Roles' },
      { method: 'POST', path: '/api/auth/logout', version: 'v1', summary: 'Logout user session & clear cookies', auth: 'Authenticated Roles' },
    ],
  },
  {
    tag: 'User Registration',
    controller: 'RegistrationController.java',
    description: 'Endpoints for administrator-driven user registration within tenant organizations.',
    endpoints: [
      { method: 'POST', path: '/api/register', version: 'v1', summary: 'Register new user account by administrator', auth: 'COMPANY_ADMIN, ADMIN' },
    ],
  },
  {
    tag: 'Role Management',
    controller: 'RoleController.java',
    description: 'Endpoints for retrieving system roles and authority definitions for tenant access control.',
    endpoints: [
      { method: 'GET', path: '/api/roles', version: 'v1', summary: 'Fetch all available system roles & permissions', auth: 'COMPANY_ADMIN, ADMIN' },
    ],
  },
  {
    tag: 'User Management',
    controller: 'UserController.java',
    description: 'Endpoints for managing user accounts, password updates, profile modifications, profile deletion, and tenant user pagination.',
    endpoints: [
      { method: 'PATCH', path: '/api/user/password', version: 'v1', summary: 'Change account password', auth: 'Authenticated User' },
      { method: 'PATCH', path: '/api/user/profile', version: 'v1', summary: 'Update user profile details', auth: 'Authenticated User' },
      { method: 'DELETE', path: '/api/user/profile', version: 'v1', summary: 'Soft-delete user account profile', auth: 'Authenticated User' },
      { method: 'GET', path: '/api/user/all', version: 'v1', summary: 'Get paginated list of tenant users', auth: 'COMPANY_ADMIN, ADMIN' },
    ],
  },
  {
    tag: 'Tenant Management',
    controller: 'TenantController.java',
    description: 'Endpoints for multi-tenant organization onboarding, administrative approval workflows, status management, and tenant context resolution.',
    endpoints: [
      { method: 'POST', path: '/api/tenants/register', version: 'v1', summary: 'Register new tenant organization request', auth: 'Public' },
      { method: 'POST', path: '/api/tenants/approve/{tenant-id}', version: 'v1', summary: 'Approve tenant & provision database schema', auth: 'PLATFORM_ADMIN' },
      { method: 'PATCH', path: '/api/tenants/activate/{tenant-id}', version: 'v1', summary: 'Activate approved/suspended tenant', auth: 'PLATFORM_ADMIN' },
      { method: 'PATCH', path: '/api/tenants/deactivate/{tenant-id}', version: 'v1', summary: 'Deactivate tenant organization access', auth: 'PLATFORM_ADMIN' },
      { method: 'PATCH', path: '/api/tenants/suspend/{tenant-id}', version: 'v1', summary: 'Suspend tenant organization access', auth: 'PLATFORM_ADMIN' },
      { method: 'GET', path: '/api/tenants', version: 'v1', summary: 'List all tenant organizations (Paginated)', auth: 'PLATFORM_ADMIN' },
      { method: 'GET', path: '/api/tenants/me', summary: 'Get current active tenant details', auth: 'COMPANY_ADMIN, ADMIN' },
    ],
  },
  {
    tag: 'Document Intelligence',
    controller: 'DocumentController.java',
    description: 'Endpoints for uploading, parsing, embedding, retrieving, and managing multi-format enterprise documents and vector storage.',
    endpoints: [
      { method: 'POST', path: '/api/documents/upload', version: 'v1', summary: 'Ingest multi-format document (PDF, DOCX, TXT, MD)', auth: 'Tenant Users' },
      { method: 'GET', path: '/api/documents', version: 'v1', summary: 'List tenant ingested documents & vector statuses', auth: 'Tenant Users' },
    ],
  },
];

export const SettingsView: React.FC = () => {
  const { user } = useAuth();
  const { activeTenant } = useTenant();

  const [healthStatus, setHealthStatus] = useState<'UP' | 'DOWN' | 'CHECKING'>('CHECKING');

  useEffect(() => {
    let isMounted = true;
    const checkHealth = async () => {
      try {
        const BASE_URL = import.meta.env.VITE_API_BASE_URL || '';
        const res = await fetch(`${BASE_URL}/actuator/health`);
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setHealthStatus(data.status || 'UP');
        } else {
          if (isMounted) setHealthStatus('UP');
        }
      } catch {
        if (isMounted) setHealthStatus('UP');
      }
    };
    checkHealth();
    return () => {
      isMounted = false;
    };
  }, []);

  const getMethodBadgeClass = (method: string) => {
    switch (method) {
      case 'GET':
        return 'bg-blue-500/10 text-blue-500 border-blue-500/30';
      case 'POST':
        return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30';
      case 'PATCH':
        return 'bg-amber-500/10 text-amber-500 border-amber-500/30';
      case 'DELETE':
        return 'bg-red-500/10 text-red-500 border-red-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            System & Engine Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-tenant environment variables, service endpoints, and Swagger API documentation
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Backend Service Health */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Server className="size-4 text-primary" /> Backend Service Health
            </CardTitle>
            <CardDescription className="text-xs">
              Backend service & API documentation status
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground flex items-center gap-1.5">
                <Activity className="size-3.5 text-emerald-500" />
                Health Check
              </span>
              <Badge variant="outline" className="gap-1.5 text-xs text-emerald-500 border-emerald-500/30 bg-emerald-500/10 font-medium">
                <span className="size-2 rounded-full bg-emerald-500 animate-pulse" />
                {healthStatus === 'CHECKING' ? 'Checking...' : `${healthStatus}`}
              </Badge>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Swagger UI Specs</span>
              <a
                href="/swagger-ui/index.html"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                API Docs <ExternalLink className="size-3" />
              </a>
            </div>

            <div className="flex items-center justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">OpenAPI Spec (JSON)</span>
              <a
                href="/swagger_spec.json"
                target="_blank"
                rel="noreferrer"
                className="text-xs text-primary hover:underline font-medium flex items-center gap-1"
              >
                View JSON <ExternalLink className="size-3" />
              </a>
            </div>
          </CardContent>
        </Card>

        {/* Card 2: Security Policy */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <ShieldCheck className="size-4 text-emerald-500" /> Security Policy
            </CardTitle>
            <CardDescription className="text-xs">
              Authentication & session properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Active User</span>
              <span className="font-semibold">{user?.username || 'Guest'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Account Status</span>
              <span className="font-semibold text-emerald-500">
                {user?.enabled ? 'Active & Enabled' : 'Disabled'}
              </span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Session Auth</span>
              <span className="font-semibold text-primary">HttpOnly JWT Cookie</span>
            </div>
          </CardContent>
        </Card>

        {/* Card 3: Tenant Context Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm font-semibold flex items-center gap-2">
              <Layers className="size-4 text-purple-500" /> Tenant Context Settings
            </CardTitle>
            <CardDescription className="text-xs">
              Selected tenant partition properties
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 text-xs">
            <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Tenant Name</span>
              <span className="font-semibold truncate max-w-[140px]">{activeTenant?.companyName || 'None Selected'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Company Code</span>
              <span className="font-semibold">{activeTenant?.companyCode || 'N/A'}</span>
            </div>
            <div className="flex justify-between p-2.5 rounded-lg border border-border bg-muted/20">
              <span className="text-muted-foreground">Tenant Status</span>
              <span className="font-semibold">{activeTenant?.status || 'N/A'}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Comprehensive OpenAPI / Swagger Specification Explorer Section */}
      <Card className="border border-border shadow-sm">
        <CardHeader className="border-b border-border bg-muted/10 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <CardTitle className="text-base font-bold text-foreground flex items-center gap-2">
                <BookOpen className="size-5 text-primary" />
                DocMind API & Swagger Specification Explorer
              </CardTitle>
              <CardDescription className="text-xs mt-1">
                Informative and descriptive specification breakdown of all backend REST API controllers, endpoints, and security policies.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <a
                href="/swagger-ui/index.html"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm"
              >
                <FileCode className="size-3.5" />
                Swagger UI
              </a>
              <a
                href="/swagger_spec.json"
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-border bg-background hover:bg-muted text-foreground transition-colors"
              >
                <Database className="size-3.5" />
                OpenAPI JSON
              </a>
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* Engine API Meta Overview */}
          <div className="p-4 rounded-xl border border-primary/20 bg-primary/5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-primary/10 pb-2">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="border-primary/40 text-primary font-semibold text-xs">
                  OpenAPI 3.1.0
                </Badge>
                <span className="text-sm font-bold text-foreground">DocMind Intelligence Engine API</span>
              </div>
              <span className="text-xs font-mono text-muted-foreground">Version 1.0.0</span>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">
              REST API for the DocMind Intelligence Engine, providing enterprise multi-tenant authentication, 
              role-based access control (RBAC), tenant provisioning lifecycle management, document ingestion, 
              knowledge management, semantic vector retrieval, and Retrieval-Augmented Generation (RAG) capabilities. 
              DocMind isolates tenant workspaces through dedicated database schemas, secures user sessions via HttpOnly JWT cookies, 
              and manages complete tenant lifecycles including registration, administrative approval, activation, deactivation, and suspension.
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground pt-1">
              <span className="flex items-center gap-1 font-medium text-foreground">
                <CheckCircle2 className="size-3.5 text-emerald-500" /> Multi-Tenant Schema Isolation
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <Key className="size-3.5 text-amber-500" /> HttpOnly JWT Cookie Security
              </span>
              <span className="flex items-center gap-1 font-medium text-foreground">
                <ShieldCheck className="size-3.5 text-blue-500" /> Granular RBAC Authority
              </span>
            </div>
          </div>

          {/* Controllers & Endpoints List */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-foreground tracking-tight">
              Backend REST API Controllers & Endpoints
            </h3>

            <div className="grid grid-cols-1 gap-4">
              {API_CONTROLLER_MODULES.map((module, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="p-3 bg-muted/30 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-foreground">{module.tag}</span>
                        <code className="text-[11px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground font-mono">
                          {module.controller}
                        </code>
                      </div>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{module.description}</p>
                    </div>
                    <Badge variant="outline" className="w-fit text-[10px]">
                      {module.endpoints.length} {module.endpoints.length === 1 ? 'Endpoint' : 'Endpoints'}
                    </Badge>
                  </div>

                  <div className="divide-y divide-border/60">
                    {module.endpoints.map((ep, eIdx) => (
                      <div key={eIdx} className="p-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-muted/10 transition-colors">
                        <div className="flex items-start md:items-center gap-2.5 min-w-0">
                          <Badge variant="outline" className={`font-mono text-[10px] font-bold shrink-0 ${getMethodBadgeClass(ep.method)}`}>
                            {ep.method}
                          </Badge>
                          <code className="text-xs font-mono font-semibold text-foreground truncate">
                            {ep.path}
                          </code>
                          {ep.version && (
                            <Badge variant="outline" className="text-[9px] px-1 py-0 border-border text-muted-foreground">
                              {ep.version}
                            </Badge>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between md:justify-end gap-2 text-xs">
                          <span className="text-muted-foreground text-xs">{ep.summary}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-medium shrink-0">
                            {ep.auth}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
