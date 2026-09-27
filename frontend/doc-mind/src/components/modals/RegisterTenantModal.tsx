import React, { useState } from 'react';
import { Building2, Mail, User, Lock, Code, ShieldCheck } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/button';
import { tenantService } from '../../services/tenantService';
import { useTenant } from '../../context/TenantContext';
import type { TenantRegisterRequest } from '../../types/tenant';

interface RegisterTenantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterTenantModal: React.FC<RegisterTenantModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { refreshTenants } = useTenant();
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
      setSuccessMsg('Tenant registration submitted successfully! Pending approval.');
      await refreshTenants();
      setTimeout(() => {
        onClose();
        setSuccessMsg(null);
        setFormData({
          companyName: '',
          companyCode: '',
          email: '',
          adminFullName: '',
          adminEmail: '',
          adminUsername: '',
          adminPassword: '',
        });
      }, 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Register New Tenant"
      description="Create a multi-tenant workspace with isolated schema & admin account"
      maxWidth="lg"
    >
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
              placeholder="company name"
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
              placeholder="company code"
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
            placeholder="email"
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
                placeholder="full name"
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
                  placeholder="email"
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
                  placeholder="username"
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

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Registering...' : 'Create Tenant'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
