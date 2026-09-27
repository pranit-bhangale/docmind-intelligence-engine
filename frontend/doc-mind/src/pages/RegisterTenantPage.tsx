import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, Mail, User, Lock, Code, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/button';
import { tenantService } from '../services/tenantService';
import type { TenantRegisterRequest } from '../types/tenant';

import { Logo } from '../components/common/Logo';

export const RegisterTenantPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState<TenantRegisterRequest>({
    companyName: '',
    companyCode: '',
    email: '',
    adminFullName: '',
    adminEmail: '',
    adminUsername: '',
    adminPassword: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await tenantService.registerTenant(formData);
      setSuccessMsg('Tenant registration submitted! Awaiting platform administrator approval.');
      setFormData({
        companyName: '',
        companyCode: '',
        email: '',
        adminFullName: '',
        adminEmail: '',
        adminUsername: '',
        adminPassword: '',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground p-4 relative overflow-hidden antialiased">
      <div className="w-full max-w-lg space-y-6 my-8">
        <div className="flex items-center justify-between">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="size-3.5" /> Back to Home
          </Link>
          <Logo size="sm" />
        </div>

        <div className="text-center space-y-1">
          <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-md mb-2">
            <Building2 className="size-5" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground">Register New Organization Tenant</h1>
          <p className="text-xs text-muted-foreground">
            Multi-Tenant Workspace Provisioning
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
                {error}
              </div>
            )}
            {successMsg && (
              <div className="p-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                {successMsg}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Company Name</label>
                <Input
                  name="companyName"
                  placeholder="Acme Corporation"
                  value={formData.companyName}
                  onChange={handleChange}
                  icon={<Building2 className="size-3.5" />}
                  required
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">Company Code</label>
                <Input
                  name="companyCode"
                  placeholder="ACME"
                  value={formData.companyCode}
                  onChange={handleChange}
                  icon={<Code className="size-3.5" />}
                  required
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Company Contact Email</label>
              <Input
                type="email"
                name="email"
                placeholder="contact@acme.com"
                value={formData.email}
                onChange={handleChange}
                icon={<Mail className="size-3.5" />}
                required
              />
            </div>

            <div className="border-t border-border pt-3 mt-2">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider block mb-2">
                Tenant Admin Credentials
              </span>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Admin Full Name</label>
                  <Input
                    name="adminFullName"
                    placeholder="Jane Doe"
                    value={formData.adminFullName}
                    onChange={handleChange}
                    icon={<User className="size-3.5" />}
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Admin Email</label>
                    <Input
                      type="email"
                      name="adminEmail"
                      placeholder="admin@acme.com"
                      value={formData.adminEmail}
                      onChange={handleChange}
                      icon={<Mail className="size-3.5" />}
                      required
                    />
                  </div>

                  <div>
                    <label className="text-xs font-medium text-foreground block mb-1">Admin Username</label>
                    <Input
                      name="adminUsername"
                      placeholder="acme_admin"
                      value={formData.adminUsername}
                      onChange={handleChange}
                      icon={<ShieldCheck className="size-3.5" />}
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Admin Password</label>
                  <Input
                    type="password"
                    name="adminPassword"
                    placeholder="••••••••••••"
                    value={formData.adminPassword}
                    onChange={handleChange}
                    icon={<Lock className="size-3.5" />}
                    required
                  />
                </div>
              </div>
            </div>

            <Button type="submit" className="w-full justify-center gap-2 h-9 text-xs mt-2" disabled={loading}>
              {loading ? 'Submitting...' : 'Register Tenant Organization'}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};
