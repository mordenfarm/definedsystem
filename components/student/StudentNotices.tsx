
import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import {
  Bell,
  ChevronRight,
  CreditCard,
  Flame,
  FileText,
  Clock,
  Calendar,
  Sparkles,
  Info
} from 'lucide-react';

export const StudentNotices: React.FC = () => {
  const { user, notices } = useStore();

  const filteredNotices = useMemo(() => {
    if (!user) return [];
    return notices
      .filter(n => n.target === 'ALL' || n.target === user.role)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notices, user]);

  return (
    <div className="space-y-6 pb-10">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Communications</p>
          <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900 dark:text-white">Notices & Alerts</h1>
        </div>
        <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
          <Bell size={20} className="text-blue-600" />
        </div>
      </header>

      {filteredNotices.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 px-10 text-center bg-white dark:bg-slate-900 rounded-[32px] border border-slate-100 dark:border-slate-800 shadow-sm">
          <div className="w-20 h-20 rounded-full bg-slate-50 dark:bg-slate-950 flex items-center justify-center mb-6">
            <Info size={32} className="text-slate-300" />
          </div>
          <h2 className="text-lg font-black uppercase tracking-tight text-slate-900 dark:text-white">No active notices</h2>
          <p className="text-slate-500 text-sm mt-2 max-w-xs">You're all caught up! When the school posts new updates, they'll appear here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredNotices.map((notice) => {
            const isNew = (new Date().getTime() - new Date(notice.timestamp).getTime()) < (3 * 24 * 60 * 60 * 1000);

            return (
              <div
                key={notice.id}
                className="group relative bg-white dark:bg-slate-900 rounded-[28px] p-6 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-800 transition-all hover:shadow-xl hover:shadow-blue-500/5"
              >
                <div className="flex items-start gap-4">
                  <div className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border ${
                    notice.type === 'Fees'
                      ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-100 dark:border-amber-800 text-amber-600'
                      : notice.type === 'Meeting'
                      ? 'bg-rose-50 dark:bg-rose-900/20 border-rose-100 dark:border-rose-800 text-rose-600'
                      : 'bg-blue-50 dark:bg-blue-900/20 border-blue-100 dark:border-blue-800 text-blue-600'
                  }`}>
                    {notice.type === 'Fees' ? <CreditCard size={20} /> : notice.type === 'Meeting' ? <Flame size={20} /> : <FileText size={20} />}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{notice.type}</span>
                        {isNew && (
                          <span className="px-2 py-0.5 bg-blue-600 text-white text-[8px] font-black rounded uppercase animate-pulse">New</span>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Clock size={10} />
                        <span className="text-[10px] font-bold uppercase tracking-tighter">
                          {new Date(notice.timestamp).toLocaleDateString(undefined, { dateStyle: 'medium' })}
                        </span>
                      </div>
                    </div>

                    <h3 className="text-[15px] font-black text-slate-900 dark:text-white uppercase tracking-tight mb-2 leading-snug">
                      {notice.title}
                    </h3>

                    <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">
                      {notice.content}
                    </p>

                    <div className="mt-4 pt-4 border-t border-slate-50 dark:border-slate-800/50 flex items-center justify-between">
                       <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                             <img src="https://i.ibb.co/spSVqW8s/definedlogo.png" alt="DD" className="w-3 h-3 opacity-50" />
                          </div>
                          <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">Defined Domains Admin</span>
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
