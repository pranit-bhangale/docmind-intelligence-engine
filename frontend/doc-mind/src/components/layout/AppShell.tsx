import React, { useState } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileDrawer } from './MobileDrawer';
import { DashboardView } from '../dashboard/DashboardView';
import { TenantManagementView } from '../tenants/TenantManagementView';
import { UserManagementView } from '../users/UserManagementView';
import { SettingsView } from '../settings/SettingsView';

import { RegisterTenantModal } from '../modals/RegisterTenantModal';
import { AddUserModal } from '../modals/AddUserModal';
import { CommandKModal } from '../modals/CommandKModal';
import { ProfileSettingsModal } from '../modals/ProfileSettingsModal';
import { LoginModal } from '../auth/LoginModal';

export const AppShell: React.FC = () => {
  const navigate = useNavigate();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals state
  const [isRegisterTenantOpen, setIsRegisterTenantOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  return (
    <div className="flex h-screen w-full overflow-hidden bg-background text-foreground antialiased font-sans">
      {/* Desktop Left Sidebar */}
      <div className="hidden md:flex shrink-0 h-full">
        <Sidebar
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />
      </div>

      {/* Mobile Drawer */}
      <MobileDrawer
        isOpen={isMobileDrawerOpen}
        onClose={() => setIsMobileDrawerOpen(false)}
      />

      {/* Main Content Area */}
      <div className="flex flex-1 flex-col min-w-0 h-full overflow-hidden">
        <TopNav
          onToggleMobileDrawer={() => setIsMobileDrawerOpen(true)}
          onOpenCommandK={() => setIsCommandKOpen(true)}
          onOpenRegisterTenantModal={() => setIsRegisterTenantOpen(true)}
          onOpenSettingsModal={() => setIsSettingsModalOpen(true)}
          onOpenLoginModal={() => setIsLoginModalOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          <Routes>
            <Route
              path="/"
              element={
                <DashboardView
                  onNavigate={(path) => navigate(path)}
                  onOpenRegisterTenant={() => setIsRegisterTenantOpen(true)}
                  onOpenAddUser={() => setIsAddUserOpen(true)}
                />
              }
            />
            <Route
              path="/overview"
              element={
                <DashboardView
                  onNavigate={(path) => navigate(path)}
                  onOpenRegisterTenant={() => setIsRegisterTenantOpen(true)}
                  onOpenAddUser={() => setIsAddUserOpen(true)}
                />
              }
            />
            <Route
              path="/dashboard"
              element={
                <DashboardView
                  onNavigate={(path) => navigate(path)}
                  onOpenRegisterTenant={() => setIsRegisterTenantOpen(true)}
                  onOpenAddUser={() => setIsAddUserOpen(true)}
                />
              }
            />
            <Route
              path="/tenants"
              element={
                <TenantManagementView
                  onOpenRegisterModal={() => setIsRegisterTenantOpen(true)}
                />
              }
            />
            <Route
              path="/users"
              element={
                <UserManagementView
                  onOpenAddUserModal={() => setIsAddUserOpen(true)}
                />
              }
            />
            <Route path="/settings" element={<SettingsView />} />
          </Routes>
        </main>
      </div>

      {/* Modals */}
      <RegisterTenantModal
        isOpen={isRegisterTenantOpen}
        onClose={() => setIsRegisterTenantOpen(false)}
      />
      <AddUserModal
        isOpen={isAddUserOpen}
        onClose={() => setIsAddUserOpen(false)}
        onUserAdded={() => {}}
      />
      <CommandKModal
        isOpen={isCommandKOpen}
        onClose={() => setIsCommandKOpen(false)}
        onOpenRegisterTenant={() => setIsRegisterTenantOpen(true)}
        onOpenAddUser={() => setIsAddUserOpen(true)}
      />
      <ProfileSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
      />
      <LoginModal
        isOpen={isLoginModalOpen}
        onClose={() => setIsLoginModalOpen(false)}
      />
    </div>
  );
};
