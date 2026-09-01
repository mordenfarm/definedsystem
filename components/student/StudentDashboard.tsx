import React, { useMemo } from 'react';
import { useStore } from '../../store/useStore';
import {
  Bell,
  BookOpenCheck,
  CalendarDays,
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
    () => studentProfile
      ? clinicalLogs
        .filter(l => l.studentId === studentProfile.id)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      : [],
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

  const latestNotices = useMemo(() => {
    if (!user) return [];
    return notices
      .filter(n => n.target === 'ALL' || n.target === user.role)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 5);
  }, [notices, user]);

  const isNewNotice = (timestamp: string) => {
    const ageMs = Date.now() - new Date(timestamp).getTime();
    return ageMs >= 0 && ageMs < 3 * 24 * 60 * 60 * 1000;
  };

  const formatDate = (timestamp: string) =>
    new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });

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
      <div className="space-y-5">
        <header className="flex items-center justify-between pr-12">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-[#22c55e]">Progress</p>
            <h1 className="text-2xl font-black tracking-tight">Learning Progress</h1>
          </div>
          <div className="h-11 w-11 rounded-full bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] grid place-items-center">
            <TrendingUp size={18} className="text-[#7c3aed]" />
          </div>
        </header>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 14, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="parentProgressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f7f1ff" stopOpacity={0.08} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#64748b', fontWeight: 800 }} />
                <Tooltip contentStyle={{ border: '1px solid #e2e8f0', borderRadius: 16, boxShadow: '0 16px 32px rgba(15,23,42,0.10)', fontSize: 11, fontWeight: 800 }} />
                <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={4} fill="url(#parentProgressGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black">This week</h2>
            <button onClick={() => setActiveTab('clinical-history')} className="text-[10px] font-black text-[#7c3aed]">See reports</button>
          </div>
          <div className="space-y-2">
            {weeklyRows.map(row => (
              <button key={row.day} onClick={() => setActiveTab('clinical-history')} className="w-full grid grid-cols-[44px_1fr_48px] items-center gap-3 rounded-2xl bg-[#fbf8ff] px-3 py-2 text-left hover:bg-[#f0e6ff] transition-colors">
                <div>
                  <p className="text-xs font-black">{row.day}</p>
                  <p className="text-[9px] font-bold text-slate-400">{row.date}</p>
                </div>
                <div className="h-2 rounded-full bg-slate-200 overflow-hidden">
                  <div className="h-full rounded-full bg-gradient-to-r from-[#7c3aed] to-[#22c55e]" style={{ width: `${Math.max(row.score, row.lessons || row.growth ? 12 : 0)}%` }} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{row.score}%</p>
                  <p className="text-[8px] font-bold text-slate-400">{row.lessons + row.growth} rec</p>
                </div>
              </button>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <header className="flex items-center justify-between pr-12">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-white p-1 shadow-[0_10px_28px_rgba(15,23,42,0.10)] shrink-0">
            <img src={studentProfile.imageUrl || LogoImg} alt={studentProfile.fullName} className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-slate-500">Welcome Back!</p>
            <h1 className="text-[15px] font-black leading-tight truncate">{studentProfile.fullName}</h1>
            <p className="text-[10px] font-bold text-[#7c3aed] truncate">{parentProfile?.name || user?.name || 'Parent portal'}</p>
          </div>
        </div>
        <button onClick={() => setActiveTab('notices')} className="relative h-10 w-10 rounded-full bg-white shadow-[0_10px_28px_rgba(15,23,42,0.08)] grid place-items-center">
          <Bell size={16} className="text-slate-500" />
          {latestNotices.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
        </button>
      </header>

      <section className="relative overflow-hidden rounded-[26px] bg-gradient-to-br from-[#6d28d9] via-[#8b5cf6] to-[#22c55e] p-4 text-white shadow-[0_18px_40px_rgba(124,58,237,0.24)]">
        <div className="absolute -right-10 -top-12 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
        <div className="absolute -left-12 bottom-0 h-28 w-28 rounded-full bg-[#22c55e]/35 blur-2xl" />
        <div className="absolute right-6 bottom-6 h-16 w-16 rounded-full border border-white/25" />
        <div className="relative z-10 flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-black uppercase tracking-widest text-white/75">School fees paid</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight">{compactMoney(paidFees)}</h2>
            <p className="mt-1 text-[11px] font-bold text-white/85">Paid from {compactMoney(totalFees)} total fees</p>
          </div>
          <div className="h-11 w-11 rounded-full bg-white/95 text-[#7c3aed] grid place-items-center shrink-0 shadow-[0_10px_24px_rgba(0,0,0,0.16)]">
            <Receipt size={17} />
          </div>
        </div>
        <div className="relative z-10 mt-4 rounded-2xl bg-white/14 p-3 backdrop-blur-sm">
          <div className="flex items-center justify-between text-[10px] font-black">
            <span>{Math.round(paidRatio * 100)}% paid</span>
            <span>Balance {compactMoney(Math.max(0, totalFees - paidFees))}</span>
          </div>
          <div className="mt-2 h-2.5 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.round(paidRatio * 100))}%` }} />
          </div>
        </div>
        <div className="relative z-10 mt-3 flex items-center justify-between gap-3">
          <span className="rounded-full bg-white/95 px-3 py-1 text-[10px] font-black text-[#16a34a]">{settings.currentTerm || 'Current term'}</span>
          <span className="text-[10px] font-bold text-white/85">Last payment {lastPayment ? compactMoney(lastPayment.amount) : '$0'}</span>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3">
        <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
          <div className="h-7 w-7 rounded-full bg-[#f2e8ff] grid place-items-center mb-2"><BookOpenCheck size={13} className="text-[#7c3aed]" /></div>
          <p className="text-[10px] font-medium text-slate-500">Learning records this week</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black">{weeklyRecords.length}</h3>
            <span className="text-[9px] font-black text-emerald-500">{allRecords.length} total</span>
          </div>
        </div>
        <div className="rounded-[20px] border border-slate-200 bg-white p-3 shadow-[0_8px_22px_rgba(15,23,42,0.05)]">
          <div className="h-7 w-7 rounded-full bg-[#fff0f7] grid place-items-center mb-2"><Medal size={13} className="text-[#db2777]" /></div>
          <p className="text-[10px] font-medium text-slate-500">Latest progress score</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black">{latestScore}%</h3>
            <span className="text-[9px] font-black text-[#16a34a]">Best {highestScore}%</span>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#7c3aed]" />
            <h2 className="text-xs font-black">Latest reports</h2>
          </div>
          <button onClick={() => setActiveTab('clinical-history')} className="text-[9px] font-black text-[#7c3aed]">View all</button>
        </div>
        <div className="space-y-2">
          {studentLogs.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-3 py-4 text-[10px] font-bold text-slate-400">No reports yet.</div>
          ) : studentLogs.slice(0, 3).map(log => (
            <button 
              key={log.id} 
              onClick={() => setActiveTab('clinical-history')} 
              className="w-full rounded-2xl bg-[#fbf8ff] px-3 py-2.5 text-left flex items-center gap-3 hover:bg-[#f0e6ff] transition-colors"
            >
              <div className="h-8 w-8 rounded-full bg-[#7c3aed] text-white grid place-items-center shrink-0">
                <FileText size={13} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black truncate">{log.targetBehavior}</p>
                <p className="text-[9px] font-bold text-slate-400">{new Date(log.date).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[10px] font-black font-mono text-[#16a34a] bg-[#ecfdf5] px-2 py-0.5 rounded-full">+{log.independenceScore}%</span>
                <ChevronRight size={13} className="text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-3 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#7c3aed]" />
            <h2 className="text-xs font-black">Latest notices</h2>
          </div>
          <button onClick={() => setActiveTab('notices')} className="text-[9px] font-black text-[#7c3aed]">View more</button>
        </div>
        <div className="space-y-2">
          {latestNotices.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 px-3 py-4 text-[10px] font-bold text-slate-400">No notices yet.</div>
          ) : latestNotices.map(notice => (
            <button key={notice.id} onClick={() => setActiveTab('notices')} className="w-full rounded-2xl bg-[#fbf8ff] px-3 py-2.5 text-left flex items-center gap-3 hover:bg-[#f0e6ff] transition-colors">
              <div className="h-8 w-8 rounded-full bg-[#7c3aed] text-white grid place-items-center shrink-0">
                {notice.type === 'Fees' ? <CreditCard size={13} /> : notice.type === 'Meeting' ? <Flame size={13} /> : <FileText size={13} />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <p className="text-[11px] font-black truncate">{notice.title}</p>
                  {isNewNotice(notice.timestamp) && <span className="shrink-0 rounded-full bg-emerald-100 px-2 py-0.5 text-[8px] font-black uppercase text-emerald-700">New</span>}
                </div>
                <p className="mt-0.5 text-[9px] font-bold text-slate-400 truncate">{notice.content}</p>
                <p className="mt-1 flex items-center gap-1 text-[8px] font-black uppercase tracking-wide text-slate-400">
                  <CalendarDays size={9} /> Posted {formatDate(notice.timestamp)}
                </p>
              </div>
              <ChevronRight size={13} className="text-slate-300" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
