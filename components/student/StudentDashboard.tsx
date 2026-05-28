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
      <div className="space-y-5">
        <header className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black text-[#8b5cf6]">Progress graph</p>
            <h1 className="text-2xl font-black tracking-tight">Learning pulse</h1>
          </div>
          <div className="h-11 w-11 rounded-full bg-white shadow-lg grid place-items-center">
            <TrendingUp size={18} className="text-[#7c3aed]" />
          </div>
        </header>

        <section className="rounded-[30px] bg-white p-4 shadow-[0_18px_45px_rgba(76,29,149,0.12)]">
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={graphData} margin={{ top: 14, right: 4, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="parentProgressGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#7c3aed" stopOpacity={0.45} />
                    <stop offset="100%" stopColor="#f7f1ff" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} stroke="#eee7ff" />
                <XAxis dataKey="week" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7c6f94', fontWeight: 800 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: '#7c6f94', fontWeight: 800 }} />
                <Tooltip contentStyle={{ border: '0', borderRadius: 18, boxShadow: '0 18px 35px rgba(76,29,149,0.16)', fontSize: 11, fontWeight: 800 }} />
                <Area type="monotone" dataKey="score" stroke="#7c3aed" strokeWidth={4} fill="url(#parentProgressGradient)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="rounded-[30px] bg-white p-4 shadow-[0_18px_45px_rgba(76,29,149,0.12)]">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-black">This week</h2>
            <span className="text-[10px] font-black text-[#8b5cf6]">{weeklyRecords.length} records</span>
          </div>
          <div className="space-y-2">
            {weeklyRows.map(row => (
              <div key={row.day} className="grid grid-cols-[44px_1fr_48px] items-center gap-3 rounded-2xl bg-[#fbf8ff] px-3 py-2">
                <div>
                  <p className="text-xs font-black">{row.day}</p>
                  <p className="text-[9px] font-bold text-slate-400">{row.date}</p>
                </div>
                <div className="h-2 rounded-full bg-[#eadcff] overflow-hidden">
                  <div className="h-full rounded-full bg-[#7c3aed]" style={{ width: `${Math.max(row.score, row.lessons || row.growth ? 12 : 0)}%` }} />
                </div>
                <div className="text-right">
                  <p className="text-xs font-black">{row.score}%</p>
                  <p className="text-[8px] font-bold text-slate-400">{row.lessons + row.growth} rec</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="h-[calc(100svh-116px)] overflow-hidden flex flex-col gap-3">
      <header className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="h-12 w-12 rounded-full overflow-hidden bg-white p-1 shadow-lg shrink-0">
            <img src={studentProfile.imageUrl || LogoImg} alt={studentProfile.fullName} className="h-full w-full rounded-full object-cover" />
          </div>
          <div className="min-w-0">
            <p className="text-[10px] font-medium text-slate-500">Welcome Back!</p>
            <h1 className="text-[15px] font-black leading-tight truncate">{studentProfile.fullName}</h1>
            <p className="text-[10px] font-bold text-[#8b5cf6] truncate">{parentProfile?.name || user?.name || 'Parent portal'}</p>
          </div>
        </div>
        <button onClick={() => toggleNotices(true)} className="relative h-10 w-10 rounded-full bg-white shadow-lg grid place-items-center">
          <Bell size={16} className="text-slate-500" />
          {latestNotices.length > 0 && <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-white" />}
        </button>
      </header>

      <section className={`relative shrink-0 h-[154px] rounded-[22px] bg-gradient-to-br ${feeTone} p-4 text-white overflow-hidden shadow-[0_18px_42px_rgba(124,58,237,0.28)]`}>
        <div className="absolute -right-10 -bottom-14 h-36 w-36 rounded-full border border-white/35" />
        <div className="absolute right-9 bottom-8 h-3 w-3 rounded-full border-2 border-white bg-white/20" />
        <svg className="absolute inset-x-0 bottom-0 h-20 w-full opacity-80" viewBox="0 0 320 100" preserveAspectRatio="none">
          <path d="M0,64 C44,18 82,82 122,58 C172,28 184,18 220,42 C254,66 256,86 284,44 C304,16 314,12 320,24" fill="none" stroke="white" strokeWidth="2" />
        </svg>
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black">Paid fees out of total</p>
            <Receipt size={16} />
          </div>
          <h2 className="mt-3 text-[26px] font-black tracking-tight">{compactMoney(paidFees)}</h2>
          <p className="text-[11px] font-bold">out of {compactMoney(totalFees)}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="rounded-full bg-white/95 px-2 py-0.5 text-[9px] font-black text-[#7c3aed]">{Math.round(paidRatio * 100)}%</span>
            <span className="text-[10px] font-bold">Last paid {lastPayment ? compactMoney(lastPayment.amount) : '$0'}</span>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-2 gap-3 shrink-0">
        <div className="rounded-[18px] bg-white p-3 shadow-[0_12px_30px_rgba(76,29,149,0.10)]">
          <div className="h-7 w-7 rounded-full bg-[#f2e8ff] grid place-items-center mb-2"><BookOpenCheck size={13} className="text-[#7c3aed]" /></div>
          <p className="text-[10px] font-medium text-slate-500">This week</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black">{weeklyRecords.length}</h3>
            <span className="text-[9px] font-black text-emerald-500">Term {allRecords.length}</span>
          </div>
        </div>
        <div className="rounded-[18px] bg-white p-3 shadow-[0_12px_30px_rgba(76,29,149,0.10)]">
          <div className="h-7 w-7 rounded-full bg-[#fff0f7] grid place-items-center mb-2"><Medal size={13} className="text-[#db2777]" /></div>
          <p className="text-[10px] font-medium text-slate-500">Scores</p>
          <div className="flex items-end justify-between">
            <h3 className="text-2xl font-black">{latestScore}%</h3>
            <span className="text-[9px] font-black text-[#7c3aed]">High {highestScore}%</span>
          </div>
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-3 shadow-[0_12px_30px_rgba(76,29,149,0.10)] min-h-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText size={14} className="text-[#7c3aed]" />
            <h2 className="text-xs font-black">Latest reports</h2>
          </div>
          <button onClick={() => setActiveTab('clinical-history')} className="text-[9px] font-black text-[#7c3aed]">View all</button>
        </div>
        <div className="space-y-2">
          {studentLogs.length === 0 ? (
            <div className="rounded-2xl bg-[#fbf8ff] px-3 py-4 text-[10px] font-bold text-slate-400">No reports yet.</div>
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
                <span className="text-[10px] font-black font-mono text-[#7c3aed] bg-[#f0e6ff] px-2 py-0.5 rounded-full">+{log.independenceScore}%</span>
                <ChevronRight size={13} className="text-slate-300" />
              </div>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-[22px] bg-white p-3 shadow-[0_12px_30px_rgba(76,29,149,0.10)] min-h-0 flex-1">
        <div className="mb-2 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-[#7c3aed]" />
            <h2 className="text-xs font-black">Latest notices</h2>
          </div>
          <button onClick={() => toggleNotices(true)} className="text-[9px] font-black text-[#7c3aed]">View more</button>
        </div>
        <div className="space-y-2">
          {latestNotices.length === 0 ? (
            <div className="rounded-2xl bg-[#fbf8ff] px-3 py-4 text-[10px] font-bold text-slate-400">No notices yet.</div>
          ) : latestNotices.map(notice => (
            <button key={notice.id} onClick={() => toggleNotices(true)} className="w-full rounded-2xl bg-[#fbf8ff] px-3 py-2 text-left flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-[#7c3aed] text-white grid place-items-center shrink-0">
                {notice.type === 'Fees' ? <CreditCard size={13} /> : notice.type === 'Meeting' ? <Flame size={13} /> : <FileText size={13} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black truncate">{notice.title}</p>
                <p className="text-[9px] font-bold text-slate-400 truncate">{notice.content}</p>
              </div>
              <ChevronRight size={13} className="text-slate-300" />
            </button>
          ))}
        </div>
      </section>
    </div>
  );
};
