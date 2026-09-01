
import React, { useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useStore } from '../../store/useStore';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const activeTab = useStore((state) => state.activeTab);
  const mainRef = useRef<HTMLElement>(null);

  // Scroll to top of the main container whenever the tab changes
  useEffect(() => {
    if (mainRef.current) {
      mainRef.current.scrollTo({ top: 0, behavior: 'instant' });
    }
  }, [activeTab]);

  return (
    <div className="flex min-h-screen bg-white dark:bg-slate-950 font-sans">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        <main ref={mainRef} className="flex-1 overflow-y-auto bg-white dark:bg-slate-950">
          <div className="w-full pb-16">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
