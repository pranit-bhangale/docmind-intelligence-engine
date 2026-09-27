import React, { useState } from 'react';
import { Lock, User, Sparkles, ArrowRight } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose }) => {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ username, password });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} maxWidth="sm" className="p-0 overflow-hidden">
      <div className="p-6 text-center border-b border-border bg-gradient-to-b from-primary/5 to-transparent">
        <div className="inline-flex size-10 items-center justify-center rounded-xl bg-primary text-primary-foreground mb-3 shadow-md">
          <Sparkles className="size-5" />
        </div>
        <h2 className="text-lg font-bold text-foreground">Welcome to DocMind</h2>
        <p className="text-xs text-muted-foreground mt-1">
          Multi-Tenant Document Intelligence Engine
        </p>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {error && (
          <div className="p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
            {error}
          </div>
        )}

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Username</label>
          <Input
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter username"
            icon={<User className="size-3.5" />}
            required
          />
        </div>

        <div>
          <label className="text-xs font-medium text-foreground block mb-1">Password</label>
          <Input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            icon={<Lock className="size-3.5" />}
            required
          />
        </div>

        <Button type="submit" className="w-full justify-center gap-2" size="sm" disabled={loading}>
          {loading ? 'Signing in...' : 'Sign In'}
          <ArrowRight className="size-3.5" />
        </Button>
      </form>
    </Modal>
  );
};
