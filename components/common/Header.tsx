
import React from 'react';
import { useStore } from '../../store/useStore';
import { Bell, Moon, Sun, Menu, ShoppingCart, LogOut } from 'lucide-react';

export const Header: React.FC = () => {
  const { user, theme, toggleTheme, toggleMobileMenu, cart, activeTab, setActiveTab, notices, toggleNotices, logout } = useStore();

  const canSeeShop = user?.role === 'SUPER_ADMIN' || user?.role === 'PARENT' || user?.role === 'ADMIN_SUPPORT';
  
  const relevantNoticesCount = React.useMemo(() => {
    if (!user) return 0;
    return notices.filter(n => 
      (n.target === 'ALL' || n.target === user.role || (user.role === 'SUPER_ADMIN')) &&
      (!n.recipientUserId || n.recipientUserId === user.id || user.role === 'SUPER_ADMIN')
    ).length;
  }, [notices, user]);

  const getPortalTitle = () => {
    switch (user?.role) {
      case 'SUPER_ADMIN': return 'Admin Dashboard';
      case 'SPECIALIST': return 'Therapist Dashboard';
      case 'ADMIN_SUPPORT': return 'Admin Support Dashboard';
      case 'PARENT': return 'Parent Dashboard';
      case 'STUDENT': return 'Student Dashboard';
      default: return 'Defined Domain Dashboard';
    }
  };

  const getHeaderContent = () => {
    const pageTitles: Record<string, { title: string; subtitle?: string }> = {
      'student-applications': { title: 'Student Applicants', subtitle: 'Review submissions and provide enrollment next steps.' },
      staff: { title: 'Staff List' },
      notices: { title: 'Notice Board' },
      applications: { title: 'Job Applications' },
      orders: { title: 'Order Transactions' },
      'system-logs': { title: 'System Logs' },
      students: { title: 'Students' },
      'my-students': { title: 'My Students' },
      clinical: { title: 'Growth Checklist' },
      'clinical-logs': { title: 'Task Analysis' },
      lounge: { title: 'Teach Lounge' },
      shop: { title: 'School Uniform Shop' },
      settings: { title: user?.role === 'SUPER_ADMIN' ? 'Settings' : 'My Profile' },
    };
    return activeTab === 'dashboard' ? { title: getPortalTitle() } : (pageTitles[activeTab] || { title: getPortalTitle() });
  };

  const headerContent = getHeaderContent();

  return (
    <header className="min-h-[72px] bg-white/95 dark:bg-slate-950/95 border-b border-slate-200 dark:border-slate-800 px-6 md:px-10 py-2.5 flex items-center justify-between sticky top-0 z-40 backdrop-blur-md">
      {/* The top bar identifies the portal; individual page titles live in page content. */}
      <div className="flex items-center gap-3.5 min-w-0">
        <button 
          onClick={() => toggleMobileMenu()}
          className="md:hidden p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[9px] transition-colors"
        >
          <Menu size={20} />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-base font-bold tracking-tight text-slate-800 md:text-lg dark:text-white">{headerContent.title}</h1>
          {headerContent.subtitle && <p className="mt-0.5 hidden truncate text-[10px] font-medium text-slate-400 sm:block">{headerContent.subtitle}</p>}
        </div>
      </div>

      {/* Right side: Global Actions */}
      <div className="flex items-center gap-2.5">
          {canSeeShop && (
            <button 
              onClick={() => setActiveTab('shop')}
              className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[9px] transition-all"
              title="Uniform Shop"
            >
              <ShoppingCart size={18} />
              {cart.length > 0 && (
                <span className="absolute top-1 right-1 w-3.5 h-3.5 bg-blue-600 text-white text-[8px] font-bold rounded-full border border-white dark:border-slate-950 flex items-center justify-center">
                  {cart.length}
                </span>
              )}
            </button>
          )}
          
          <button 
            onClick={toggleTheme}
            className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[9px] transition-colors"
            title="Toggle Theme"
          >
            {theme === 'light' ? <Moon size={18} /> : <Sun size={18} />}
          </button>

          <button 
            onClick={() => toggleNotices(true)}
            className="relative p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[9px] transition-colors"
            title="Notifications"
          >
            <Bell size={18} />
            {relevantNoticesCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rose-500 rounded-full border border-white dark:border-slate-950 animate-pulse"></span>
            )}
          </button>

          <div className="h-5 w-px bg-slate-200 dark:bg-slate-800 mx-1 hidden sm:block"></div>

          <button 
            onClick={logout}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 dark:bg-blue-600 text-white rounded-[9px] text-xs font-bold hover:bg-rose-600 transition-all active:scale-95 group"
          >
            <LogOut size={14} className="group-hover:-translate-x-0.5 transition-transform" />
            <span className="hidden sm:inline">Logout</span>
          </button>
      </div>
    </header>
  );
};
