import React, { useState } from 'react';
import { User, Mail, Lock, Key, ShieldAlert } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { Input } from '../ui/Input';
import { Button } from '../ui/button';
import { useAuth } from '../../context/AuthContext';
import { userService } from '../../services/userService';

interface ProfileSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProfileSettingsModal: React.FC<ProfileSettingsModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { user, refreshUser, logout } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');

  // Profile Form State
  const [firstName, setFirstName] = useState(user?.firstName || '');
  const [lastName, setLastName] = useState(user?.lastName || '');
  const [email, setEmail] = useState(user?.email || '');
  const [username, setUsername] = useState(user?.username || '');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileMsg, setProfileMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Password Form State
  const [oldPassword, setOldPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [pwdLoading, setPwdLoading] = useState(false);
  const [pwdMsg, setPwdMsg] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setProfileLoading(true);
    setProfileMsg(null);
    try {
      await userService.updateProfile({ firstName, lastName, email, username });
      await refreshUser();
      setProfileMsg({ text: 'Profile updated successfully!', type: 'success' });
    } catch (err: unknown) {
      setProfileMsg({
        text: err instanceof Error ? err.message : 'Profile update failed',
        type: 'error',
      });
    } finally {
      setProfileLoading(false);
    }
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwdMsg({ text: 'New password and confirmation do not match', type: 'error' });
      return;
    }
    setPwdLoading(true);
    setPwdMsg(null);
    try {
      await userService.updatePassword({ oldPassword, newPassword, confirmPassword });
      setPwdMsg({ text: 'Password changed successfully!', type: 'success' });
      setOldPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: unknown) {
      setPwdMsg({
        text: err instanceof Error ? err.message : 'Password change failed',
        type: 'error',
      });
    } finally {
      setPwdLoading(false);
    }
  };

  const handleDeleteProfile = async () => {
    if (confirm('Are you sure you want to delete your profile? This action is soft-deleting your account.')) {
      try {
        await userService.deleteProfile();
        await logout();
        onClose();
      } catch (err: unknown) {
        alert(err instanceof Error ? err.message : 'Failed to delete account');
      }
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Account Settings"
      description="Manage your profile information and security settings"
      maxWidth="lg"
    >
      <div className="flex border-b border-border mb-4">
        <button
          onClick={() => setActiveTab('profile')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'profile'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <User className="size-3.5" />
          General Profile
        </button>
        <button
          onClick={() => setActiveTab('security')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-medium border-b-2 transition-colors ${
            activeTab === 'security'
              ? 'border-primary text-primary font-semibold'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          <Key className="size-3.5" />
          Security & Password
        </button>
      </div>

      {activeTab === 'profile' && (
        <form onSubmit={handleUpdateProfile} className="space-y-4">
          {profileMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium ${
                profileMsg.type === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                  : 'border-red-500/20 bg-red-500/10 text-red-600'
              }`}
            >
              {profileMsg.text}
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">First Name</label>
              <Input
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                icon={<User className="size-3.5" />}
              />
            </div>
            <div>
              <label className="text-xs font-medium text-foreground block mb-1">Last Name</label>
              <Input
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                icon={<User className="size-3.5" />}
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Username</label>
            <Input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              icon={<User className="size-3.5" />}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Email Address</label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              icon={<Mail className="size-3.5" />}
            />
          </div>

          <div className="flex justify-between items-center border-t border-border pt-4">
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={handleDeleteProfile}
              className="gap-1.5"
            >
              <ShieldAlert className="size-3.5" />
              Delete Account
            </Button>
            <Button type="submit" size="sm" disabled={profileLoading}>
              {profileLoading ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </form>
      )}

      {activeTab === 'security' && (
        <form onSubmit={handleUpdatePassword} className="space-y-4">
          {pwdMsg && (
            <div
              className={`p-3 rounded-lg border text-xs font-medium ${
                pwdMsg.type === 'success'
                  ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-600'
                  : 'border-red-500/20 bg-red-500/10 text-red-600'
              }`}
            >
              {pwdMsg.text}
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Current Password</label>
            <Input
              type="password"
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              icon={<Lock className="size-3.5" />}
              required
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">New Password</label>
            <Input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              icon={<Lock className="size-3.5" />}
              required
              minLength={8}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-foreground block mb-1">Confirm New Password</label>
            <Input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              icon={<Lock className="size-3.5" />}
              required
            />
          </div>

          <div className="flex justify-end border-t border-border pt-4">
            <Button type="submit" size="sm" disabled={pwdLoading}>
              {pwdLoading ? 'Changing...' : 'Update Password'}
            </Button>
          </div>
        </form>
      )}
    </Modal>
  );
};
