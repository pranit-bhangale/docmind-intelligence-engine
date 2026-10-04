import React, { useState, useEffect, useRef } from 'react';
import { User, Mail, Lock, ChevronDown, Check, Shield } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/button';
import { cn } from '../../lib/utils';
import { userService } from '../../services/userService';
import { roleService } from '../../services/roleService';
import type { RegistrationRequest } from '../../types/user';
import type { RoleResponse } from '../../types/role';

interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUserAdded: () => void;
}

const isPlatformAdminRole = (roleName: string): boolean => {
  const norm = roleName.toUpperCase().replace('ROLE_', '');
  return norm === 'PLATFORM_ADMIN';
};

export const AddUserModal: React.FC<AddUserModalProps> = ({
  isOpen,
  onClose,
  onUserAdded,
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roles, setRoles] = useState<RoleResponse[]>([]);
  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<RegistrationRequest>({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    roleName: 'ROLE_USER',
  });

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsRoleDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setIsRoleDropdownOpen(false);
      roleService
        .getRoles()
        .then((fetched) => {
          if (fetched && fetched.length > 0) {
            setRoles(fetched);
            const firstSelectable = fetched.find((r) => !isPlatformAdminRole(r.roleName));
            if (firstSelectable) {
              setFormData((prev) => ({ ...prev, roleName: firstSelectable.roleName }));
            }
          }
        })
        .catch(() => {
          // Fallback default roles
          const fallback: RoleResponse[] = [
            { roleId: 1, roleName: 'ROLE_PLATFORM_ADMIN', roleDescription: 'Platform administrator with full platform-level access' },
            { roleId: 2, roleName: 'ROLE_COMPANY_ADMIN', roleDescription: 'Company administrator with administrative access within a tenant' },
            { roleId: 3, roleName: 'ROLE_ADMIN', roleDescription: 'Administrator with elevated access within a tenant' },
            { roleId: 4, roleName: 'ROLE_USER', roleDescription: 'Standard user access' },
          ];
          setRoles(fallback);
          setFormData((prev) => ({ ...prev, roleName: 'ROLE_USER' }));
        });
    }
  }, [isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await userService.registerUser(formData);
      onUserAdded();
      onClose();
      const firstSelectable = roles.find((r) => !isPlatformAdminRole(r.roleName));
      setFormData({
        username: '',
        email: '',
        password: '',
        firstName: '',
        lastName: '',
        roleName: firstSelectable?.roleName || 'ROLE_USER',
      });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to register user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Add New User Account"
      description="Create a new user account and assign roles"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pb-2">
        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">First Name</label>
            <Input
              name="firstName"
              placeholder="first name"
              value={formData.firstName}
              onChange={handleChange}
              icon={<User className="size-3.5" />}
              required
            />
          </div>
          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Last Name</label>
            <Input
              name="lastName"
              placeholder="last name"
              value={formData.lastName}
              onChange={handleChange}
              icon={<User className="size-3.5" />}
              required
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Username</label>
          <Input
            name="username"
            placeholder="username"
            value={formData.username}
            onChange={handleChange}
            icon={<User className="size-3.5" />}
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Email Address</label>
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

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Initial Password</label>
          <Input
            type="password"
            name="password"
            placeholder="Min 8 characters"
            value={formData.password}
            onChange={handleChange}
            icon={<Lock className="size-3.5" />}
            required
            minLength={8}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Assign Role</label>
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="w-full flex items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-ring hover:bg-accent/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <Shield className="size-3.5 text-primary" />
                <span className="font-medium">{formData.roleName}</span>
              </div>
              <ChevronDown
                className={cn(
                  'size-3.5 text-muted-foreground transition-transform duration-200',
                  isRoleDropdownOpen && 'rotate-180'
                )}
              />
            </button>

            {isRoleDropdownOpen && (
              <div className="absolute left-0 bottom-full mb-1 w-full rounded-lg border border-border bg-card p-1 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-150">
                <div className="max-h-36 overflow-y-auto space-y-0.5 p-0.5">
                  {roles.map((r) => {
                    const isReadonly = isPlatformAdminRole(r.roleName);
                    const isSelected = formData.roleName === r.roleName;

                    return (
                      <button
                        key={r.roleId || r.roleName}
                        type="button"
                        disabled={isReadonly}
                        onClick={() => {
                          if (!isReadonly) {
                            setFormData((prev) => ({ ...prev, roleName: r.roleName }));
                            setIsRoleDropdownOpen(false);
                          }
                        }}
                        className={cn(
                          'flex items-center justify-between w-full px-2.5 py-1.5 rounded-md text-xs transition-colors text-left font-sans',
                          isReadonly
                            ? 'opacity-50 cursor-not-allowed bg-muted/20 text-muted-foreground'
                            : isSelected
                            ? 'bg-primary/10 text-primary font-semibold'
                            : 'hover:bg-accent hover:text-foreground text-foreground'
                        )}
                      >
                        <span>{r.roleName}</span>
                        {isReadonly ? (
                          <span className="text-[9px] bg-muted px-1.5 py-0.5 rounded text-muted-foreground font-sans">
                            Read Only
                          </span>
                        ) : isSelected ? (
                          <Check className="size-3 text-primary shrink-0" />
                        ) : null}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 border-t border-border pt-4 mt-4">
          <Button type="button" variant="outline" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" size="sm" disabled={loading}>
            {loading ? 'Creating...' : 'Create Account'}
          </Button>
        </div>
      </form>
    </Modal>
  );
};
