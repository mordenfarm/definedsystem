
import React, { useEffect } from 'react';
import { useStore } from './store/useStore';
import { AppShell } from './components/common/AppShell';
import { LandingPage } from './components/landing/LandingPage';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { TherapistDashboard } from './components/TherapistDashboard';
import { StaffManagement } from './components/StaffManagement';
import { StudentDirectory } from './components/StudentDirectory';
import { ClinicalABA } from './components/ClinicalABA';
import { LessonLogs } from './components/LessonLogs';
import { AdminClinicalLogs } from './components/AdminClinicalLogs';
import { UniformShop } from './components/UniformShop';
import { SystemSettings } from './components/SystemSettings';
import { StudentDashboard } from './components/student/StudentDashboard';
import { SchoolFees } from './components/student/SchoolFees';
import { ParentNotices } from './components/student/ParentNotices';
import { ApplicationsManagement } from './components/ApplicationsManagement';
import { StudentApplications } from './components/admin/StudentApplications';
import { TransactionsManagement } from './components/TransactionsManagement';
import { OrderHistory } from './components/OrderHistory';
import { ReceiptVerification } from './components/student/ReceiptVerification';
import { OnlineApplication } from './components/landing/OnlineApplication';
import { CareersPage } from './components/landing/CareersPage';
import { NoticesSlideOver } from './components/common/NoticesSlideOver';
import { AdminNotices } from './components/AdminNotices';
import { SystemLogs } from './components/SystemLogs';
import { AlertCircle, BarChart3, Bell, CheckCircle2, FileText, Home, Info, LogOut, Receipt, X } from 'lucide-react';

const NotificationHost = () => {
  const { notifications, removeNotification } = useStore();

  return (
    <div className="fixed top-6 right-6 z-[700] flex flex-col gap-3 pointer-events-none">
      {(notifications || []).map((n) => (
        <div 
          key={n.id} 
          className={`
            pointer-events-auto min-w-[320px] max-w-md p-5 rounded-none shadow-2xl flex items-center justify-between gap-4 border-l-4 animate-notification-in
            ${n.type === 'success' ? 'bg-emerald-50 border-emerald-500 text-emerald-800' : ''}
            ${n.type === 'error' ? 'bg-rose-50 border-rose-500 text-rose-800' : ''}
            ${n.type === 'info' ? 'bg-blue-50 border-blue-500 text-blue-800' : ''}
          `}
        >
          <div className="flex items-center gap-3">
            {n.type === 'success' && <CheckCircle2 size={24} />}
            {n.type === 'error' && <AlertCircle size={24} />}
            {n.type === 'info' && <Info size={24} />}
            <p className="text-sm font-black uppercase tracking-tight">{n.message}</p>
          </div>
          <button onClick={() => removeNotification(n.id)} className="opacity-40 hover:opacity-100 transition-opacity">
            <X size={18} />
          </button>
        </div>
      ))}
    </div>
  );
};

const ParentMobileShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { activeTab, setActiveTab, logout, user } = useStore();

  const navItems = [
    { id: 'dashboard', label: 'Home', icon: Home },
    { id: 'progress', label: 'Progress', icon: BarChart3 },
    { id: 'clinical-history', label: 'Reports', icon: FileText },
    { id: 'fees', label: 'Fees', icon: Receipt },
    { id: 'notices', label: 'Notices', icon: Bell },
  ];

  const handleNav = (id: string) => {
    setActiveTab(id);
  };

  return (
    <div className="min-h-screen bg-[#fbf8ff] dark:bg-slate-950 text-slate-950">
      <button
        onClick={logout}
        className="fixed right-5 top-5 z-[90] h-10 w-10 rounded-full border border-slate-200 bg-white/90 text-slate-500 shadow-[0_10px_28px_rgba(15,23,42,0.10)] backdrop-blur-xl grid place-items-center hover:text-rose-600 transition-colors"
        title={`Logout${user?.name ? ` ${user.name}` : ''}`}
      >
        <LogOut size={16} strokeWidth={2.6} />
      </button>
      <main className="min-h-screen max-w-md mx-auto px-5 pt-5 pb-28 overflow-x-hidden">
        <div key={activeTab} className="animate-parent-tab">
          {children}
        </div>
      </main>
      <nav className="fixed left-4 right-4 bottom-5 z-[80] max-w-sm mx-auto h-[58px] rounded-[29px] border border-white/80 bg-white/85 backdrop-blur-2xl shadow-[0_18px_45px_rgba(15,23,42,0.16)] px-2 flex items-center justify-between">
        {navItems.map(item => {
          const Icon = item.icon;
          const isActive = activeTab === item.id || (item.id === 'dashboard' && activeTab === 'students');
          return (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={`h-11 min-w-0 flex-1 rounded-[22px] flex flex-col items-center justify-center gap-0.5 transition-all duration-300 ${
                isActive ? 'bg-[#7c3aed] text-white shadow-[0_10px_24px_rgba(124,58,237,0.32)] scale-[1.02]' : 'text-slate-500 hover:text-[#7c3aed]'
              }`}
            >
              <Icon size={15} strokeWidth={2.6} />
              <span className="text-[7.5px] font-black leading-none">{item.label}</span>
            </button>
          );
        })}
      </nav>
    </div>
  );
};

const App: React.FC = () => {
  const { view, setView, activeTab, isLoggedIn, theme, user, initializeData } = useStore();
  const isParentPortal = isLoggedIn && (user?.role === 'PARENT' || user?.role === 'STUDENT') && view !== 'verify' && view !== 'apply' && view !== 'careers';

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    initializeData();
    
    const params = new URLSearchParams(window.location.search);
    if (params.has('v')) {
      setView('verify');
    }
  }, [theme]);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [view, activeTab]);

  const renderContent = () => {
    if (view === 'verify') return <ReceiptVerification />;
    if (view === 'apply') return <OnlineApplication />;
    if (view === 'careers') return <CareersPage />;

    if (!isLoggedIn) {
      if (view === 'login') {
        return (
          <div className="relative w-screen h-screen overflow-hidden animate-notification-in">
            <LoginPage />
          </div>
        );
      }
      return <LandingPage />;
    }

    const role = user?.role;

    if (role === 'STUDENT' || role === 'PARENT') {
      if (activeTab === 'dashboard' || activeTab === 'progress') return <StudentDashboard />;
      if (activeTab === 'students' || activeTab === 'my-students') return <StudentDirectory />;
      if (activeTab === 'clinical-history' || activeTab === 'reports') return <AdminClinicalLogs />;
      if (activeTab === 'notices') return <ParentNotices />;
      if (activeTab === 'order-history') return <OrderHistory />;
      if (activeTab === 'shop') return <UniformShop />;
      if (activeTab === 'settings') return <SystemSettings />;
      if (activeTab === 'fees') return <SchoolFees />;
    }

    if (role === 'SPECIALIST' || role === 'ADMIN_SUPPORT') {
      if (activeTab === 'dashboard') return <TherapistDashboard />;
      if (activeTab === 'my-students' || activeTab === 'students') return <StudentDirectory />;
      if (activeTab === 'clinical') return <ClinicalABA />;
      if (activeTab === 'clinical-logs') return <LessonLogs />;
      if (activeTab === 'settings') return <SystemSettings />;
    }

    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'staff':
      case 'admin':
        return <StaffManagement />;
      case 'applications':
        return <ApplicationsManagement />;
      case 'student-applications':
        return <StudentApplications />;
      case 'orders':
        return <TransactionsManagement />;
      case 'order-history':
        return <OrderHistory />;
      case 'students':
      case 'my-students':
        return <StudentDirectory />;
      case 'clinical':
        return <ClinicalABA />;
      case 'clinical-logs':
        return <LessonLogs />;
      case 'shop': return <UniformShop />;
      case 'settings': return <SystemSettings />;
      case 'notices': return <AdminNotices />;
      case 'system-logs': return <SystemLogs />;
      
      default:
        return (
          <div className="flex flex-col items-center justify-center min-h-[400px] text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 p-12">
             <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-800 flex items-center justify-center mb-6">
               <span className="text-4xl">⚙️</span>
             </div>
             <h2 className="text-2xl font-black uppercase tracking-tight">Module Loading</h2>
             <p className="text-slate-500 mt-2 max-w-sm">The <b>{activeTab}</b> module is being configured for your account.</p>
          </div>
        );
    }
  };

  return (
    <>
      <NotificationHost />
      {!isParentPortal && <NoticesSlideOver />}
      {isParentPortal ? (
        <ParentMobileShell>
          {renderContent()}
        </ParentMobileShell>
      ) : isLoggedIn && view !== 'verify' && view !== 'apply' && view !== 'careers' ? (
        <AppShell>
          {renderContent()}
        </AppShell>
      ) : (
        renderContent()
      )}
    </>
  );
};

export default App;
