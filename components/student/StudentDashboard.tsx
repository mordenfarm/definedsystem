import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import {
  Bell,
  BookOpenCheck,
  ChevronRight,
  CreditCard,
  FileText,
  Flame,
  Medal,
  Receipt,
  Sparkles,
  TrendingUp,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

const LogoImg = 'https://i.ibb.co/spSVqW8s/definedlogo.png';

const startOfWeek = () => {
  const today = new Date();
  const day = today.getDay() || 7;
  const monday = new Date(today);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(today.getDate() - day + 1);
  return monday;
};

const compactMoney = (value: number) => `$${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const StudentDashboard: React.FC = () => {
  const {
    user,
    students,
    parents,
    settings,
    milestoneRecords,
    clinicalLogs,
    payments,
    notices,
    setActiveTab,
    toggleNotices,
    activeTab,
  } = useStore();

  const studentProfile = useMemo(() => {
    if (user?.role === 'STUDENT') return students.find(s => s.firebaseUid === user.id);
    if (user?.role === 'PARENT') {
      const parentProfile = parents.find(p => p.firebaseUid === user.id);
      return parentProfile ? students.find(s => s.id === parentProfile.studentId) : null;
    }
    return null;
  }, [user, students, parents]);

  const parentProfile = useMemo(() => {
    if (user?.role !== 'PARENT') return null;
    return parents.find(p => p.firebaseUid === user.id) || null;
  }, [user, parents]);

  const studentLogs = useMemo(
    () => studentProfile ? clinicalLogs.filter(l => l.studentId === studentProfile.id) : [],
    [clinicalLogs, studentProfile]
  );

  const studentMilestones = useMemo(
    () => studentProfile ? milestoneRecords.filter(r => r.studentId === studentProfile.id) : [],
    [milestoneRecords, studentProfile]
  );

  const studentPayments = useMemo(
    () => studentProfile
      ? payments.filter(p => p.studentId === studentProfile.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : [],
    [payments, studentProfile]
  );

  const allRecords = useMemo(() => {
    const lessons = studentLogs.map(log => ({
      date: log.date,
      score: log.independenceScore || 0,
      type: 'Lesson',
    }));
    const growth = studentMilestones.map(record => ({
      date: record.timestamp,
      score: record.overallPercentage || 0,
      type: 'Growth',
    }));
    return [...lessons, ...growth].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [studentLogs, studentMilestones]);

  const weekStart = useMemo(() => startOfWeek(), []);
  const weeklyRecords = useMemo(
    () => allRecords.filter(record => new Date(record.date) >= weekStart),
    [allRecords, weekStart]
  );

  const latestScore = allRecords[0]?.score || 0;
  const highestScore = allRecords.reduce((best, record) => Math.max(best, record.score), 0);
  const totalFees = settings.feesAmount || 0;
  const paidFees = studentProfile?.totalPaid || 0;
  const paidRatio = totalFees > 0 ? paidFees / totalFees : 0;
  const lastPayment = studentPayments[0];
  const feeTone = paidRatio < 0.5 ? 'from-[#ff3d62] to-[#ff8f2f]' : 'from-[#7c3aed] to-[#ff8f2f]';

  const latestNotices = useMemo(() => {
    if (!user) return [];
    return notices
      .filter(n => n.target === 'ALL' || n.target === user.role)
      .slice(0, 2);
  }, [notices, user]);

  const weeklyRows = useMemo(() => {
    const monday = startOfWeek();
    return ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'].map((label, idx) => {
      const date = new Date(monday);
      date.setDate(monday.getDate() + idx);
      const key = date.toISOString().split('T')[0];
      const lessons = studentLogs.filter(l => l.date.split('T')[0] === key);
      const growth = studentMilestones.filter(m => m.timestamp.split('T')[0] === key);
      const scores = [...lessons.map(l => l.independenceScore || 0), ...growth.map(m => m.overallPercentage || 0)];
      return {
        day: label,
        date: key.slice(5),
        lessons: lessons.length,
        growth: growth.length,
        score: scores.length ? Math.round(scores.reduce((sum, score) => sum + score, 0) / scores.length) : 0,
      };
    });
  }, [studentLogs, studentMilestones]);

  const graphData = useMemo(() => {
    const lastSix = Array.from({ length: 6 }).map((_, idx) => {
      const d = new Date();
      d.setDate(d.getDate() - (5 - idx) * 7);
      const week = `${d.getMonth() + 1}/${d.getDate()}`;
      const start = new Date(d);
      start.setHours(0, 0, 0, 0);
      const end = new Date(start);
      end.setDate(start.getDate() + 7);
      const records = allRecords.filter(record => {
        const rd = new Date(record.date);
        return rd >= start && rd < end;
      });
      const avg = records.length ? Math.round(records.reduce((sum, record) => sum + record.score, 0) / records.length) : 0;
      return { week, score: avg, records: records.length };
    });
    return lastSix;
  }, [allRecords]);

  if (!studentProfile) {
    return <div className="h-[70svh] grid place-items-center text-xs font-black uppercase tracking-widest text-[#7c3aed]">Loading portal</div>;
  }

  if (activeTab === 'progress') {
    return (
      <div className="space-y-6 pb-10">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-600">Performance Metrics</p>
            <h1 className="text-2xl font-black tracking-tight uppercase text-slate-900 dark:text-white">Learning Progress</h1>
          </div>
          <div className="h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 flex items-center justify-center">
            <TrendingUp size={20} className="text-blue-600" />
          </div>
        </header>

        <section className="rounded-[32px] bg-white dark:bg-slate-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-50 dark:border-slate-800">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 14, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="parentProgressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="#2563eb" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#f1f5f9" strokeDasharray="3 3" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 700 }} />
                <Tooltip
                  contentStyle={{
                    border: '0',
                    borderRadius: 16,
                    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                    fontSize: 11,
                    fontWeight: 800,
                    backgroundColor: '#1e293b',
                    color: '#fff'
                  }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="score" stroke="#2563eb" strokeWidth={4} fill="url(#parentProgressGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[32px] bg-white dark:bg-slate-900 p-6 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-sm font-black uppercase tracking-tight text-slate-900 dark:text-white">Weekly Breakdown</h2>
            <button
              onClick={() => setActiveTab('clinical-history')}
              className="text-[10px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1"
            >
              See Reports <ChevronRight size={12} />
            </button>
          </div>
          <div className="space-y-3">
            {weeklyRows.map(row => (
              <div key={row.day} className="grid grid-cols-[50px_1fr_48px] items-center gap-4 rounded-2xl bg-slate-50 dark:bg-slate-950 px-4 py-3 border border-slate-100 dark:border-slate-800">
                <div>
                  <p className="text-xs font-black text-slate-900 dark:text-white">{row.day}</p>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{row.date}</p>
                </div>
                <div className="h-2 rounded-full bg-slate-200 dark:bg-slate-800 overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-600 shadow-[0_0_8px_rgba(37,99,235,0.4)]"
                    style={{ width: `${Math.max(row.score, row.lessons || row.growth ? 12 : 0)}%` }}
                  />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black text-slate-900 dark:text-white">{row.score}%</p>
                  <p className="text-[8px] font-bold text-slate-400 uppercase">{row.lessons + row.growth} rec</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  const latestNotices5 = notices
    .filter(n => n.target === 'ALL' || n.target === user?.role)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 5);

  return (
    <div className="flex flex-col gap-6 pb-10">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-4 min-w-0">
          <div className="h-14 w-14 rounded-2xl overflow-hidden bg-white dark:bg-slate-900 p-1 shadow-2xl shadow-blue-500/10 border border-slate-100 dark:border-slate-800 shrink-0">
            <img src={studentProfile.imageUrl || LogoImg} alt={studentProfile.fullName} className="h-full w-full rounded-xl object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Dashboard Terminal</p>
            <h1 className="text-lg font-black leading-tight truncate text-slate-900 dark:text-white uppercase tracking-tight">{studentProfile.fullName}</h1>
            <p className="text-[10px] font-black text-blue-600 truncate uppercase tracking-widest">{parentProfile?.name || user?.name || 'Parent portal'}</p>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('notices')}
          className="relative h-12 w-12 rounded-2xl bg-white dark:bg-slate-900 shadow-xl shadow-slate-200/50 dark:shadow-none border border-slate-100 dark:border-slate-800 flex items-center justify-center transition-transform active:scale-90"
        >
          <Bell size={20} className="text-slate-500" />
          {latestNotices5.length > 0 && <span className="absolute right-3 top-3 h-2.5 w-2.5 rounded-full bg-rose-500 ring-2 ring-white dark:ring-slate-900" />}
        </button>
      </header>

      <section className={`relative shrink-0 rounded-[32px] bg-slate-900 p-6 text-white overflow-hidden shadow-2xl shadow-blue-900/20 border border-slate-800`}>
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600/10 blur-[80px] rounded-full"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-indigo-600/10 blur-[60px] rounded-full"></div>

        <div className="relative z-10">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-blue-600/20 rounded-lg backdrop-blur-sm border border-blue-500/20">
                <CreditCard size={16} className="text-blue-400" />
              </div>
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Tuition Status</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${paidRatio >= 1 ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
              {paidRatio >= 1 ? 'Settled' : 'Outstanding'}
            </span>
          </div>

          <div className="flex items-baseline gap-2">
            <h2 className="text-4xl font-black tracking-tighter">{compactMoney(paidFees)}</h2>
            <span className="text-slate-500 font-bold text-sm">/ {compactMoney(totalFees)}</span>
          </div>

          <div className="mt-6 space-y-3">
            <div className="h-2 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full shadow-[0_0_12px_rgba(37,99,235,0.5)] transition-all duration-1000"
                style={{ width: `${Math.min(paidRatio * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                {lastPayment ? `Last payment: ${compactMoney(lastPayment.amount)} on ${new Date(lastPayment.timestamp).toLocaleDateString()}` : 'No payments recorded'}
              </p>
              <span className="text-xs font-black text-blue-400">{Math.round(paidRatio * 100)}%</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-4 shrink-0">
        <div className="rounded-[28px] bg-white dark:bg-slate-900 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-800 transition-transform active:scale-95">
          <div className="h-10 w-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-4 border border-blue-100 dark:border-blue-800">
            <BookOpenCheck size={18} className="text-blue-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Records</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{weeklyRecords.length}</h3>
            <span className="text-[9px] font-black text-emerald-500 uppercase">Term {allRecords.length}</span>
          </div>
        </div>
        <div className="rounded-[28px] bg-white dark:bg-slate-900 p-5 shadow-[0_15px_40px_rgba(0,0,0,0.04)] border border-slate-50 dark:border-slate-800 transition-transform active:scale-95">
          <div className="h-10 w-10 rounded-xl bg-rose-50 dark:bg-rose-900/20 flex items-center justify-center mb-4 border border-rose-100 dark:border-rose-800">
            <Medal size={18} className="text-rose-600" />
          </div>
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Avg Mastery</p>
          <div className="flex items-baseline justify-between mt-1">
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">{latestScore}%</h3>
            <span className="text-[9px] font-black text-blue-600 uppercase">Max {highestScore}%</span>
          </div>
        </div>
      </section>

      <section className="rounded-[32px] bg-white dark:bg-slate-900 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Latest Reports</h2>
          </div>
          <button onClick={() => setActiveTab('clinical-history')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">View All</button>
        </div>
        <div className="space-y-3">
          {studentLogs.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 px-4 py-8 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800">No reports found</div>
          ) : studentLogs.slice(0, 3).map(log => (
            <button 
              key={log.id} 
              onClick={() => setActiveTab('clinical-history')} 
              className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950 px-4 py-4 text-left flex items-center gap-4 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
            >
              <div className="h-10 w-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20 group-hover:scale-110 transition-transform">
                <FileText size={16} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black truncate uppercase text-slate-900 dark:text-white">{log.targetBehavior}</p>
                <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(log.date).toLocaleDateString(undefined, { dateStyle: 'medium' })}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <span className="text-[11px] font-black font-mono text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2.5 py-1 rounded-lg">+{log.independenceScore}%</span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[32px] bg-white dark:bg-slate-900 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.05)] border border-slate-50 dark:border-slate-800">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full"></div>
            <h2 className="text-xs font-black uppercase tracking-widest text-slate-900 dark:text-white">Latest Notices</h2>
          </div>
          <button onClick={() => setActiveTab('notices')} className="text-[10px] font-black text-blue-600 uppercase tracking-widest px-3 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">View More</button>
        </div>
        <div className="space-y-3">
          {latestNotices5.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 dark:bg-slate-950 px-4 py-8 text-[10px] font-bold text-slate-400 text-center uppercase tracking-widest border border-dashed border-slate-200 dark:border-slate-800">No active notices</div>
          ) : latestNotices5.map(notice => {
            const isNew = (new Date().getTime() - new Date(notice.date).getTime()) < (3 * 24 * 60 * 60 * 1000);
            return (
              <button
                key={notice.id}
                onClick={() => setActiveTab('notices')}
                className="w-full rounded-2xl bg-slate-50 dark:bg-slate-950 px-4 py-4 text-left flex items-center gap-4 hover:bg-white dark:hover:bg-slate-900 hover:shadow-xl hover:shadow-slate-200/50 dark:hover:shadow-none transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-800 group"
              >
                <div className="h-10 w-10 rounded-xl bg-slate-900 dark:bg-slate-800 text-white flex items-center justify-center shrink-0 border border-slate-700">
                  {notice.type === 'Fees' ? <CreditCard size={16} /> : notice.type === 'Meeting' ? <Flame size={16} /> : <Bell size={16} />}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-[11px] font-black truncate uppercase text-slate-900 dark:text-white">{notice.title}</p>
                    {isNew && (
                      <span className="px-1.5 py-0.5 bg-blue-600 text-white text-[7px] font-black rounded uppercase animate-pulse">New</span>
                    )}
                  </div>
                  <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter truncate">{new Date(notice.date).toLocaleDateString(undefined, { dateStyle: 'medium' })} • {notice.content}</p>
                </div>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-600 transition-colors" />
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
