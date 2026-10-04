import React, { useState } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import { KnowledgeProvider } from '../../context/KnowledgeContext';
import { useAuth } from '../../context/AuthContext';
import { Sidebar } from './Sidebar';
import { TopNav } from './TopNav';
import { MobileDrawer } from './MobileDrawer';
import { Chat } from '../chat/Chat';
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
  const { isAdmin, canAccessTenants, canAccessUsers } = useAuth();
  const navigate = useNavigate();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileDrawerOpen, setIsMobileDrawerOpen] = useState(false);

  // Modals state
  const [isRegisterTenantOpen, setIsRegisterTenantOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isCommandKOpen, setIsCommandKOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const dashboardElement = (
    <div className="overflow-y-auto h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
      <DashboardView
        onNavigate={(path) => navigate(path)}
        onOpenRegisterTenant={() => setIsRegisterTenantOpen(true)}
        onOpenAddUser={() => setIsAddUserOpen(true)}
      />
    </div>
  );

  return (
    <KnowledgeProvider>
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

          <main className="flex-1 overflow-hidden relative">
            <Routes>
              <Route path="/" element={isAdmin ? dashboardElement : <Chat />} />
              <Route path="/chat" element={isAdmin ? <Navigate to="/dashboard" replace /> : <Chat />} />
              <Route path="/overview" element={isAdmin ? dashboardElement : <Navigate to="/chat" replace />} />
              <Route path="/dashboard" element={isAdmin ? dashboardElement : <Navigate to="/chat" replace />} />
              <Route
                path="/tenants"
                element={
                  canAccessTenants ? (
                    <div className="overflow-y-auto h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                      <TenantManagementView
                        onOpenRegisterModal={() => setIsRegisterTenantOpen(true)}
                      />
                    </div>
                  ) : (
                    <Navigate to="/chat" replace />
                  )
                }
              />
              <Route
                path="/users"
                element={
                  canAccessUsers ? (
                    <div className="overflow-y-auto h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                      <UserManagementView
                        onOpenAddUserModal={() => setIsAddUserOpen(true)}
                      />
                    </div>
                  ) : (
                    <Navigate to={isAdmin ? "/dashboard" : "/chat"} replace />
                  )
                }
              />
              <Route
                path="/settings"
                element={
                  <div className="overflow-y-auto h-full p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">
                    <SettingsView />
                  </div>
                }
              />
              <Route path="/app/*" element={isAdmin ? <Navigate to="/dashboard" replace /> : <Chat />} />
              <Route path="*" element={<Navigate to={isAdmin ? "/dashboard" : "/chat"} replace />} />
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
    </KnowledgeProvider>
  );
};
