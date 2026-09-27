import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Lock, User, ArrowRight, Building2, Sun, Moon } from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import { Logo } from '../components/common/Logo';

export const LoginPage: React.FC = () => {
  const { login, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard', { replace: true });
    }
  }, [isAuthenticated, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await login({ username, password });
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen w-full items-center justify-center bg-background text-foreground p-4 relative overflow-hidden antialiased">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-40 -left-40 size-96 rounded-full bg-primary/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-40 -right-40 size-96 rounded-full bg-purple-500/10 blur-3xl pointer-events-none" />

      {/* Top Controls */}
      <div className="absolute top-4 right-4 flex items-center gap-2">
        <button
          onClick={toggleTheme}
          className="p-2 rounded-lg border border-border bg-card hover:bg-accent text-muted-foreground hover:text-foreground transition-colors"
        >
          {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <Logo size="lg" subtitle="Multi-Tenant Document Intelligence Engine" onClick={() => navigate('/landing')} />
          <h1 className="text-xl font-bold tracking-tight text-foreground pt-2">Sign In to Your Workspace</h1>
        </div>

        {/* Card Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-md">
          <form onSubmit={handleSubmit} className="space-y-4">
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

            <Button type="submit" className="w-full justify-center gap-2 h-9 text-xs" disabled={loading}>
              {loading ? 'Authenticating...' : 'Sign In'}
              <ArrowRight className="size-3.5" />
            </Button>
          </form>

          <div className="border-t border-border pt-4 mt-6 text-center">
            <p className="text-xs text-muted-foreground">
              Need a new tenant workspace?{' '}
              <Link to="/register-tenant" className="font-semibold text-primary hover:underline inline-flex items-center gap-1">
                <Building2 className="size-3 inline" /> Register Tenant
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
