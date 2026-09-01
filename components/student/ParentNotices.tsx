import React, { useMemo, useState } from 'react';
import { Bell, CalendarDays, ChevronRight, CreditCard, FileText, Flame, MessageCircle } from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Notice } from '../../types';

const formatNoticeDate = (timestamp: string) =>
  new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

const isNewNotice = (timestamp: string) => {
  const ageMs = Date.now() - new Date(timestamp).getTime();
  return ageMs >= 0 && ageMs < 3 * 24 * 60 * 60 * 1000;
};

const NoticeIcon: React.FC<{ notice: Notice }> = ({ notice }) => {
  if (notice.type === 'Fees') return <CreditCard size={16} />;
  if (notice.type === 'Meeting') return <Flame size={16} />;
  return <FileText size={16} />;
};

export const ParentNotices: React.FC = () => {
  const { notices, user, markNoticeAsViewed } = useStore();
  const parentNotices = useMemo(() => {
    if (!user) return [];
    return notices
      .filter(notice => notice.target === 'ALL' || notice.target === user.role)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [notices, user]);

  const [selectedId, setSelectedId] = useState<string | null>(parentNotices[0]?.id || null);
  const selectedNotice = parentNotices.find(notice => notice.id === selectedId) || parentNotices[0] || null;

  const openNotice = (notice: Notice) => {
    setSelectedId(notice.id);
    if (user && !notice.views?.some(view => view.userId === user.id)) {
      markNoticeAsViewed(notice.id);
    }
  };

  return (
    <div className="space-y-4 pb-2">
      <header className="pr-12">
        <p className="text-[10px] font-black uppercase tracking-widest text-[#22c55e]">Parent portal</p>
        <h1 className="mt-1 text-2xl font-black tracking-tight text-slate-950">Notices</h1>
        <p className="mt-1 text-[11px] font-bold text-slate-500">Messages and updates from the school office.</p>
      </header>

      {parentNotices.length === 0 ? (
        <section className="rounded-[24px] border border-slate-200 bg-white p-6 text-center shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="mx-auto h-12 w-12 rounded-full bg-slate-100 text-slate-400 grid place-items-center">
            <Bell size={18} />
          </div>
          <p className="mt-4 text-sm font-black">No notices yet</p>
          <p className="mt-1 text-xs font-bold text-slate-500">New school notices will appear here.</p>
        </section>
      ) : (
        <>
          <section className="space-y-2">
            {parentNotices.map(notice => {
              const active = selectedNotice?.id === notice.id;
              return (
                <button
                  key={notice.id}
                  onClick={() => openNotice(notice)}
                  className={`w-full rounded-[20px] border p-3 text-left flex items-center gap-3 transition-all ${
                    active
                      ? 'border-[#7c3aed] bg-white shadow-[0_12px_28px_rgba(124,58,237,0.12)]'
                      : 'border-slate-200 bg-white/80 shadow-[0_8px_20px_rgba(15,23,42,0.04)]'
                  }`}
                >
                  <div className={`h-10 w-10 rounded-full grid place-items-center shrink-0 ${active ? 'bg-[#7c3aed] text-white' : 'bg-[#f2e8ff] text-[#7c3aed]'}`}>
                    <NoticeIcon notice={notice} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-xs font-black text-slate-950">{notice.title}</p>
                      {isNewNotice(notice.timestamp) && (
                        <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-700">New</span>
                      )}
                    </div>
                    <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500">{notice.content}</p>
                    <p className="mt-1 flex items-center gap-1 text-[9px] font-black uppercase tracking-wide text-slate-400">
                      <CalendarDays size={10} /> {formatNoticeDate(notice.timestamp)}
                    </p>
                  </div>
                  <ChevronRight size={14} className="text-slate-300 shrink-0" />
                </button>
              );
            })}
          </section>

          {selectedNotice && (
            <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-[#f2e8ff] px-2.5 py-1 text-[9px] font-black uppercase text-[#7c3aed]">{selectedNotice.type}</span>
                    {isNewNotice(selectedNotice.timestamp) && (
                      <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-[9px] font-black uppercase text-emerald-700">New</span>
                    )}
                  </div>
                  <h2 className="mt-3 text-lg font-black leading-tight text-slate-950">{selectedNotice.title}</h2>
                </div>
                <div className="h-10 w-10 rounded-full bg-[#7c3aed] text-white grid place-items-center shrink-0">
                  <NoticeIcon notice={selectedNotice} />
                </div>
              </div>
              <p className="mt-2 flex items-center gap-1 text-[10px] font-black uppercase tracking-wide text-slate-400">
                <CalendarDays size={11} /> Posted {formatNoticeDate(selectedNotice.timestamp)}
              </p>
              <p className="mt-4 whitespace-pre-wrap text-sm font-medium leading-6 text-slate-700">{selectedNotice.content}</p>
              <div className="mt-5 rounded-[18px] bg-slate-50 p-3">
                <p className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  <MessageCircle size={12} /> Replies
                </p>
                {selectedNotice.replies?.length ? (
                  <div className="mt-3 space-y-2">
                    {selectedNotice.replies.map(reply => (
                      <div key={reply.id} className="rounded-2xl bg-white px-3 py-2">
                        <p className="text-[10px] font-black text-slate-900">{reply.userName}</p>
                        <p className="mt-1 text-xs font-medium text-slate-600">{reply.message}</p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="mt-2 text-xs font-bold text-slate-400">No replies yet.</p>
                )}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
