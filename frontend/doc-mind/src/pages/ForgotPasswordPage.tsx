import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  KeyRound,
  Lock,
  Mail,
  Moon,
  RefreshCw,
  Sun,
} from 'lucide-react';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/button';
import { Logo } from '../components/common/Logo';
import { useTheme } from '../context/ThemeContext';
import { authService } from '../services/authService';

type Step = 'request' | 'verify' | 'reset' | 'success';

export const ForgotPasswordPage: React.FC = () => {
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();

  // Wizard state
  const [step, setStep] = useState<Step>('request');

  // Form states
  const [email, setEmail] = useState('');
  const [companyCode, setCompanyCode] = useState('');
  const [challengeId, setChallengeId] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // UI state
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [infoMessage, setInfoMessage] = useState<string | null>(null);

  // Step 1: Request Password Reset OTP
  const handleRequestReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await authService.requestPasswordReset({
        email: email.trim(),
        companyCode: companyCode.trim() ? companyCode.trim() : undefined,
      });

      if (response.challengeId) {
        setChallengeId(response.challengeId);
      }
      setInfoMessage(response.message || 'Verification code sent to your email.');
      setStep('verify');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to send password reset code.');
    } finally {
      setLoading(false);
    }
  };

  // Resend OTP in Step 2
  const handleResendOtp = async () => {
    if (!email.trim()) return;
    setResending(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await authService.requestPasswordReset({
        email: email.trim(),
        companyCode: companyCode.trim() ? companyCode.trim() : undefined,
      });

      if (response.challengeId) {
        setChallengeId(response.challengeId);
      }
      setInfoMessage('A new verification code has been dispatched to your email.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to resend verification code.');
    } finally {
      setResending(false);
    }
  };

  // Step 2: Verify OTP
  // Note: Company Code is FIRST, OTP is SECOND. ChallengeId is submitted automatically behind the scenes.
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otp.trim()) {
      setError('Please enter the OTP verification code.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      const response = await authService.verifyPasswordResetOtp({
        challengeId, // automatically attached from Step 1 behind the scenes
        otp: otp.trim(),
        companyCode: companyCode.trim() ? companyCode.trim() : undefined,
      });

      setInfoMessage(response.message || 'OTP verified successfully.');
      setStep('reset');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid or expired verification code.');
    } finally {
      setLoading(false);
    }
  };

  // Step 3: Change Forgotten Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    setError(null);
    setInfoMessage(null);

    try {
      await authService.resetPassword({
        email: email.trim(),
        companyCode: companyCode.trim() ? companyCode.trim() : undefined,
        passwordRequest: {
          password: newPassword,
          confirmPassword,
        },
      });

      setStep('success');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to reset password.');
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
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun className="size-4 text-amber-400" /> : <Moon className="size-4" />}
        </button>
      </div>

      <div className="w-full max-w-md space-y-6">
        {/* Brand Header */}
        <div className="text-center flex flex-col items-center space-y-2">
          <Logo size="lg" subtitle="Multi-Tenant Document Intelligence Engine" onClick={() => navigate('/landing')} />
          <h1 className="text-xl font-bold tracking-tight text-foreground pt-2">
            {step === 'request' && 'Reset Your Password'}
            {step === 'verify' && 'Verify Your Code'}
            {step === 'reset' && 'Create New Password'}
            {step === 'success' && 'Password Updated'}
          </h1>
          <p className="text-xs text-muted-foreground max-w-sm">
            {step === 'request' && "Enter your account email and company code (if applicable) to receive a secure recovery code."}
            {step === 'verify' && `We've sent a 6-digit verification code to ${email}.`}
            {step === 'reset' && 'Please choose a strong new password for your account.'}
            {step === 'success' && 'Your password has been successfully reset. You can now log in.'}
          </p>
        </div>

        {/* Step Progression Indicators */}
        {step !== 'success' && (
          <div className="flex items-center justify-center gap-2">
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'request' ? 'w-8 bg-primary' : 'w-4 bg-primary/40'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'verify' ? 'w-8 bg-primary' : step === 'reset' ? 'w-4 bg-primary/40' : 'w-4 bg-muted'
              }`}
            />
            <div
              className={`h-1.5 rounded-full transition-all duration-300 ${
                step === 'reset' ? 'w-8 bg-primary' : 'w-4 bg-muted'
              }`}
            />
          </div>
        )}

        {/* Card Form */}
        <div className="rounded-2xl border border-border bg-card p-6 shadow-2xl backdrop-blur-md">
          {error && (
            <div className="mb-4 p-3 rounded-lg border border-red-500/20 bg-red-500/10 text-red-600 dark:text-red-400 text-xs font-medium">
              {error}
            </div>
          )}

          {infoMessage && (
            <div className="mb-4 p-3 rounded-lg border border-border bg-muted/60 text-foreground text-xs font-medium">
              {infoMessage}
            </div>
          )}

          {/* STEP 1: Request Password Reset */}
          {step === 'request' && (
            <form onSubmit={handleRequestReset} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-foreground">Company Code</label>
                </div>
                <Input
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="Enter your company code"
                  icon={<Building2 className="size-3.5" />}
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Registered Email <span className="text-red-500">*</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter registered email address"
                  icon={<Mail className="size-3.5" />}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full justify-center gap-2 h-9 text-xs" disabled={loading}>
                {loading ? 'Sending Code...' : 'Send Verification Code'}
                <ArrowRight className="size-3.5" />
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Back to Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 2: Verify OTP (Company Code first, then OTP; ChallengeId handled behind the scenes) */}
          {step === 'verify' && (
            <form onSubmit={handleVerifyOtp} className="space-y-4">
              {/* Field 1: Company Code First */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-medium text-foreground">Company Code</label>
                </div>
                <Input
                  value={companyCode}
                  onChange={(e) => setCompanyCode(e.target.value)}
                  placeholder="Enter your company code"
                  icon={<Building2 className="size-3.5" />}
                />
              </div>

              {/* Field 2: OTP */}
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Verification Code (OTP) <span className="text-red-500">*</span>
                </label>
                <Input
                  type="text"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit OTP"
                  icon={<KeyRound className="size-3.5" />}
                  maxLength={10}
                  required
                  autoFocus
                />
              </div>

              <Button type="submit" className="w-full justify-center gap-2 h-9 text-xs" disabled={loading}>
                {loading ? 'Verifying...' : 'Verify Code & Proceed'}
                <ArrowRight className="size-3.5" />
              </Button>

              <div className="flex items-center justify-between pt-2 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setError(null);
                    setInfoMessage(null);
                    setStep('request');
                  }}
                  className="text-muted-foreground hover:text-foreground inline-flex items-center gap-1 transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Change Email
                </button>

                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={resending}
                  className="text-primary hover:underline inline-flex items-center gap-1 transition-colors disabled:opacity-50"
                >
                  <RefreshCw className={`size-3 ${resending ? 'animate-spin' : ''}`} />
                  {resending ? 'Resending...' : 'Resend Code'}
                </button>
              </div>
            </form>
          )}

          {/* STEP 3: Reset Password */}
          {step === 'reset' && (
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  New Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password"
                  icon={<Lock className="size-3.5" />}
                  required
                  autoFocus
                />
              </div>

              <div>
                <label className="text-xs font-medium text-foreground block mb-1">
                  Confirm New Password <span className="text-red-500">*</span>
                </label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm new password"
                  icon={<Lock className="size-3.5" />}
                  required
                />
              </div>

              <Button type="submit" className="w-full justify-center gap-2 h-9 text-xs" disabled={loading}>
                {loading ? 'Resetting Password...' : 'Reset Password'}
                <ArrowRight className="size-3.5" />
              </Button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => navigate('/login')}
                  className="text-xs text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5 transition-colors"
                >
                  <ArrowLeft className="size-3" />
                  Cancel and Return to Sign In
                </button>
              </div>
            </form>
          )}

          {/* STEP 4: Success State */}
          {step === 'success' && (
            <div className="text-center py-4 space-y-4">
              <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="size-8" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-semibold text-foreground">Password Reset Complete</h3>
                <p className="text-xs text-muted-foreground">
                  Your credentials have been securely updated. You can now log into your workspace with your new password.
                </p>
              </div>
              <Button
                onClick={() => navigate('/login')}
                className="w-full justify-center gap-2 h-9 text-xs"
              >
                Sign In With New Password
                <ArrowRight className="size-3.5" />
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
