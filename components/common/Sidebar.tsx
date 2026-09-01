import React from 'react';
import { useStore } from '../../store/useStore';
import { 
  LayoutDashboard, Users, HeartPulse, ShoppingCart, 
  Briefcase, X, Settings, History, Send, Receipt, BellRing, ShieldAlert, Brain, ClipboardList, Coffee, BadgeCheck
} from 'lucide-react';

const LogoImg = "https://i.ibb.co/spSVqW8s/definedlogo.png";

export const Sidebar: React.FC = () => {
  const { user, activeTab, setActiveTab, isMobileMenuOpen, toggleMobileMenu } = useStore();

  const getNavItems = () => {
    const role = user?.role;
    const base = [{ id: 'dashboard', label: 'Home', icon: <LayoutDashboard size={18} /> }];

    if (role === 'SUPER_ADMIN') {
      return [
        ...base,
        { id: 'student-applications', label: 'Student Applicants', icon: <ClipboardList size={18} /> },
        { id: 'students', label: 'Students', icon: <Users size={18} /> },
        { id: 'id-cards', label: 'Student ID Cards', icon: <BadgeCheck size={18} /> },
        { id: 'staff', label: 'Staff members', icon: <Briefcase size={18} /> },
        { id: 'notices', label: 'Announcements', icon: <BellRing size={18} /> },
        { id: 'applications', label: 'Careers', icon: <Send size={18} /> },
        { id: 'orders', label: 'Orders', icon: <Receipt size={18} /> },
        { id: 'system-logs', label: 'Audit Logs', icon: <ShieldAlert size={18} /> },
        { id: 'shop', label: 'Uniform Shop', icon: <ShoppingCart size={18} /> },
        { id: 'settings', label: 'Settings', icon: <Settings size={18} /> },
      ];
    }

    if (role === 'SPECIALIST' || role === 'ADMIN_SUPPORT') {
      return [
        ...base,
        { id: 'my-students', label: 'My Students', icon: <Users size={18} /> },
        { id: 'clinical', label: 'Checklist', icon: <Brain size={18} /> },
        { id: 'clinical-logs', label: 'Task Analysis', icon: <History size={18} /> },
        { id: 'lounge', label: 'Teach Lounge', icon: <Coffee size={18} /> },
        { id: 'settings', label: 'My Profile', icon: <Settings size={18} /> },
      ];
    }

    if (role === 'PARENT' || role === 'STUDENT') {
      const items = [
        ...base,
        { id: 'students', label: 'Student Records', icon: <Users size={18} /> },
        { id: 'fees', label: 'School Fees', icon: <Receipt size={18} /> },
      ];
      if (role === 'PARENT') {
        items.push({ id: 'order-history', label: 'My Orders', icon: <Receipt size={18} /> });
        items.push({ id: 'shop', label: 'Uniform Shop', icon: <ShoppingCart size={18} /> });
      }
      return items;
    }

    return base;
  };

  const navItems = getNavItems();

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    toggleMobileMenu(false);
  };

  const SidebarContent = (
    <div className="relative flex flex-col h-full bg-[#18042e] text-white overflow-hidden border-r border-purple-950/60 shadow-2xl">
      {/* Large Off-Center School Logo Watermark on Main Part */}
      <div className="absolute -right-16 top-32 h-72 w-72 opacity-[0.05] pointer-events-none select-none">
        <img
          src={LogoImg}
          alt=""
          className="h-full w-full object-contain grayscale brightness-0 invert"
        />
      </div>

      {/* Mobile Close Button */}
      <div className="md:hidden flex justify-end p-3 relative z-10">
        <button onClick={() => toggleMobileMenu(false)} className="p-1.5 text-purple-300 hover:text-rose-400 transition-colors">
          <X size={24} />
        </button>
      </div>

      {/* Top Brand Logo */}
      <div className="px-5 py-5 flex items-center gap-3 border-b border-purple-900/30 relative z-10">
        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center p-1.5 shadow-md border border-purple-400/30 shrink-0">
          <img src={LogoImg} alt="Logo" className="w-full h-full object-contain" />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-base font-black text-white leading-none uppercase tracking-wider truncate">Defined Domains</span>
          <span className="text-[8px] font-black text-emerald-400 uppercase tracking-[0.25em] mt-1">Inclusive School</span>
        </div>
      </div>

      {/* Navigation List */}
      <nav className="flex-1 flex flex-col px-3 py-4 space-y-1.5 overflow-y-auto sidebar-scrollbar relative z-10">
        {navItems.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => handleNavClick(item.id)}
              className={`flex items-center gap-3.5 px-3.5 py-2.5 text-[13px] font-bold transition-all rounded-xl group relative text-white ${
                isActive 
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-lg shadow-purple-950/60 border border-purple-400/30' 
                  : 'text-white/90 hover:bg-white/10 hover:text-white'
              }`}
            >
              <span className="text-white transition-transform duration-300 group-hover:scale-110 shrink-0">
                {React.cloneElement(item.icon as React.ReactElement<any>, { size: 18, className: "text-white" })}
              </span>
              <span className="tracking-tight text-white">{item.label}</span>
              {isActive && (
                <div className="absolute right-3 w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Bottom User Profile Section with School Logo Watermark */}
      <div className="relative overflow-hidden px-4 py-3.5 border-t border-purple-900/40 bg-[#140226] flex items-center justify-between">
        {/* Subtle School Logo Watermark */}
        <div className="absolute -right-3 -bottom-3 h-24 w-24 opacity-[0.08] pointer-events-none select-none">
          <img
            src={LogoImg}
            alt=""
            className="h-full w-full object-contain grayscale brightness-0 invert"
          />
        </div>

        <div className="relative z-10 flex items-center gap-2.5 min-w-0">
          <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-purple-600 to-indigo-500 text-white overflow-hidden flex items-center justify-center font-black text-[10px] shadow-sm border border-purple-400/40 shrink-0 uppercase">
            {user?.avatar ? (
              <img src={user.avatar} className="w-full h-full object-cover" alt={user.name} />
            ) : (
              'SA'
            )}
          </div>
          <div className="flex flex-col min-w-0">
            <p className="text-[11px] font-black text-white leading-tight truncate uppercase">
              {user?.name || 'System Administrator'}
            </p>
            <p className="text-[8px] font-black uppercase tracking-widest text-emerald-400 mt-0.5">
              {user?.role?.replace('_', ' ') || 'SUPER ADMIN'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <aside className="hidden md:flex w-64 flex-col h-screen sticky top-0 bg-[#18042e] border-r border-purple-950/60 z-40">
        {SidebarContent}
      </aside>
      <div className={`fixed inset-0 z-[100] md:hidden transition-all duration-500 ${isMobileMenuOpen ? 'visible' : 'invisible'}`}>
        <div className={`absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity duration-500 ${isMobileMenuOpen ? 'opacity-100' : 'opacity-0'}`} onClick={() => toggleMobileMenu(false)} />
        <aside className={`absolute inset-y-0 left-0 w-72 shadow-2xl transition-transform duration-500 transform ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'} bg-[#18042e]`}>
          {SidebarContent}
        </aside>
      </div>
    </>
  );
};
