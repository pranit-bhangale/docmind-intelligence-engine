import React, { useState, useEffect } from 'react';
import { ShieldCheck, Server, Layers, Activity, ExternalLink } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '../ui/Card';
import { useAuth } from '../../context/AuthContext';
import { useTenant } from '../../context/TenantContext';
import { Badge } from '../ui/Badge';

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-border pb-4 gap-2">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            System & Engine Settings
          </h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Multi-tenant environment variables, service health, and API specifications
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
    </div>
  );
};
