import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Building2, Users, LayoutDashboard, ArrowRight, Settings } from 'lucide-react';
import { Modal } from '../ui/Modal';

interface CommandKModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenRegisterTenant: () => void;
  onOpenAddUser: () => void;
}

export const CommandKModal: React.FC<CommandKModalProps> = ({
  isOpen,
  onClose,
  onOpenRegisterTenant,
  onOpenAddUser,
}) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const actions = [
    {
      id: 'dashboard',
      title: 'Go to Dashboard',
      category: 'Navigation',
      icon: <LayoutDashboard className="size-4" />,
      action: () => {
        navigate('/dashboard');
        onClose();
      },
    },
    {
      id: 'tenants',
      title: 'View All Tenants',
      category: 'Navigation',
      icon: <Building2 className="size-4" />,
      action: () => {
        navigate('/tenants');
        onClose();
      },
    },
    {
      id: 'users',
      title: 'View User Directory',
      category: 'Navigation',
      icon: <Users className="size-4" />,
      action: () => {
        navigate('/users');
        onClose();
      },
    },
    {
      id: 'settings',
      title: 'System Settings',
      category: 'Navigation',
      icon: <Settings className="size-4" />,
      action: () => {
        navigate('/settings');
        onClose();
      },
    },
    {
      id: 'register-tenant',
      title: 'Register New Tenant',
      category: 'Quick Action',
      icon: <Building2 className="size-4 text-primary" />,
      action: () => {
        onClose();
        onOpenRegisterTenant();
      },
    },
    {
      id: 'add-user',
      title: 'Add New User Account',
      category: 'Quick Action',
      icon: <Users className="size-4 text-primary" />,
      action: () => {
        onClose();
        onOpenAddUser();
      },
    },
  ];

  const filtered = actions.filter(
    (a) =>
      a.title.toLowerCase().includes(query.toLowerCase()) ||
      a.category.toLowerCase().includes(query.toLowerCase())
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="lg" className="p-0 overflow-hidden">
      <div className="p-3 border-b border-border flex items-center gap-2">
        <Search className="size-4 text-muted-foreground ml-1" />
        <input
          type="text"
          placeholder="Type a command or search..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoFocus
          className="w-full bg-transparent text-sm text-foreground placeholder:text-muted-foreground focus:outline-none"
        />
      </div>

      <div className="max-h-72 overflow-y-auto p-2 space-y-1">
        {filtered.length === 0 ? (
          <div className="p-6 text-center text-xs text-muted-foreground">
            No matching commands found.
          </div>
        ) : (
          filtered.map((item) => (
            <button
              key={item.id}
              onClick={item.action}
              className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-xs hover:bg-accent transition-colors text-left group"
            >
              <div className="flex items-center gap-3">
                <span className="text-muted-foreground group-hover:text-foreground">
                  {item.icon}
                </span>
                <div>
                  <div className="font-medium text-foreground">{item.title}</div>
                  <div className="text-[10px] text-muted-foreground">{item.category}</div>
                </div>
              </div>
              <ArrowRight className="size-3.5 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
            </button>
          ))
        )}
      </div>
      <div className="px-4 py-2 border-t border-border bg-muted/30 text-[10px] text-muted-foreground flex justify-between">
        <span>Navigation shortcut</span>
        <kbd className="font-sans font-medium">ESC to close</kbd>
      </div>
    </Modal>
  );
};
