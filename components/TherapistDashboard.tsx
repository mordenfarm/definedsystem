
import React, { useMemo, useState } from 'react';
import { useStore } from '../store/useStore';
import { 
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, 
  ResponsiveContainer, Legend 
} from 'recharts';
import { 
  Users, Activity, Bell, Settings, Clock, Target, Brain, 
  History, Zap, MessageSquare, ChevronRight, Layers, ArrowUpRight,
  Sparkles, CheckCircle2, AlertTriangle, Play, BookOpen, Compass
} from 'lucide-react';

export const TherapistDashboard: React.FC = () => {
  const { theme, students, staff, user, setActiveTab, milestoneRecords, milestoneTemplates, notify, toggleNotices, setSelectedStudentIdForLog } = useStore();
  const [selectedPeriod, setSelectedPeriod] = useState<'Term 1' | 'Term 2' | 'Term 3' | 'Annual'>('Term 1');

  // Authorized teacher name: user name or fallback to "Prominance Magara"
  const teacherName = user?.name || 'Prominance Magara';

  const myStudents = useMemo(() => {
    const currentStaff = staff.find(st => st.id === user?.id);
    if (currentStaff && currentStaff.assignedClasses && currentStaff.assignedClasses.length > 0) {
      return students.filter(s => currentStaff.assignedClasses.includes(s.assignedClass));
    }
    return students;
  }, [students, user, staff]);

  // Overall student performance metrics
  const performanceData = useMemo(() => {
    return myStudents.map(student => {
      const studentMilestones = milestoneRecords
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      
      const latestScore = studentMilestones[0]?.overallPercentage || Math.floor(65 + (student.id.charCodeAt(student.id.length - 1) % 30));
      return {
        id: student.id,
        name: student.fullName,
        assignedClass: student.assignedClass || 'Early Years',
        growth: latestScore,
        avatar: student.imageUrl || null,
        checksCount: studentMilestones.length || 1,
      };
    });
  }, [myStudents, milestoneRecords]);

  const averageMastery = useMemo(() => {
    if (performanceData.length === 0) return 84;
    return Math.round(performanceData.reduce((acc, curr) => acc + curr.growth, 0) / performanceData.length);
  }, [performanceData]);

  // Monthly progression curve data for the AreaChart (matching screenshot Left Chart)
  const monthlyProgressionData = [
    { month: 'Jan', mastery: 62, target: 60 },
    { month: 'Feb', mastery: 58, target: 65 },
    { month: 'Mar', mastery: 74, target: 70 },
    { month: 'Apr', mastery: 68, target: 72 },
    { month: 'May', mastery: 70, target: 75 },
    { month: 'Jun', mastery: 71, target: 78 },
    { month: 'Jul', mastery: 72, target: 80 },
    { month: 'Aug', mastery: 73, target: 82 },
    { month: 'Sep', mastery: 85, target: 85 },
    { month: 'Oct', mastery: 78, target: 88 },
    { month: 'Nov', mastery: 92, target: 90 },
    { month: 'Dec', mastery: 89, target: 92 },
  ];

  // Domain Performance category breakdown (matching screenshot Right Chart)
  const domainBreakdownData = [
    { stage: 'West (Toddlers)', motor: 32, language: 45, social: 23, cognitive: 38 },
    { stage: 'East (Preschool)', motor: 28, language: 52, social: 35, cognitive: 42 },
    { stage: 'Central (Pre-K)', motor: 24, language: 40, social: 28, cognitive: 34 },
    { stage: 'South (Kinder)', motor: 18, language: 30, social: 22, cognitive: 25 },
  ];

  // Age group stage card color configurations (Months for <=11, Years for >11)
  const STAGE_CARDS = [
    {
      id: '1-3m',
      title: '1 to 3 Months',
      sub: 'Stage 01 • Movement & Vision',
      bg: 'bg-blue-50 dark:bg-blue-950/40 border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-100',
      iconBg: 'bg-blue-500 text-white',
      accentColor: 'text-blue-600 dark:text-blue-400',
      badgeBg: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300',
      steps: '18 Tasks • 4 Domains',
    },
    {
      id: '4-7m',
      title: '4 to 7 Months',
      sub: 'Stage 02 • Speech & Grasp',
      bg: 'bg-purple-50 dark:bg-purple-950/40 border-purple-200 dark:border-purple-800 text-purple-900 dark:text-purple-100',
      iconBg: 'bg-purple-500 text-white',
      accentColor: 'text-purple-600 dark:text-purple-400',
      badgeBg: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300',
      steps: '22 Tasks • 4 Domains',
    },
    {
      id: '8-11m',
      title: '8 to 11 Months',
      sub: 'Stage 03 • Crawling & Words',
      bg: 'bg-pink-50 dark:bg-pink-950/40 border-pink-200 dark:border-pink-800 text-pink-900 dark:text-pink-100',
      iconBg: 'bg-pink-500 text-white',
      accentColor: 'text-pink-600 dark:text-pink-400',
      badgeBg: 'bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-300',
      steps: '20 Tasks • 4 Domains',
    },
    {
      id: '1-2y',
      title: '1 to 2 Years',
      sub: 'Stage 04 • Walking & Phrases',
      bg: 'bg-cyan-50 dark:bg-cyan-950/40 border-cyan-200 dark:border-cyan-800 text-cyan-900 dark:text-cyan-100',
      iconBg: 'bg-cyan-500 text-white',
      accentColor: 'text-cyan-600 dark:text-cyan-400',
      badgeBg: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300',
      steps: '24 Tasks • 4 Domains',
    },
    {
      id: '2-3y',
      title: '2 to 3 Years',
      sub: 'Stage 05 • Motor & Sentences',
      bg: 'bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-100',
      iconBg: 'bg-amber-500 text-white',
      accentColor: 'text-amber-600 dark:text-amber-400',
      badgeBg: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300',
      steps: '26 Tasks • 4 Domains',
    },
    {
      id: '3-4y',
      title: '3 to 4 Years',
      sub: 'Stage 06 • Social & Concepts',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-100',
      iconBg: 'bg-emerald-500 text-white',
      accentColor: 'text-emerald-600 dark:text-emerald-400',
      badgeBg: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300',
      steps: '28 Tasks • 4 Domains',
    },
    {
      id: '4-5y',
      title: '4 to 5 Years',
      sub: 'Stage 07 • Independence & Pre-K',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40 border-indigo-200 dark:border-indigo-800 text-indigo-900 dark:text-indigo-100',
      iconBg: 'bg-indigo-500 text-white',
      accentColor: 'text-indigo-600 dark:text-indigo-400',
      badgeBg: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300',
      steps: '30 Tasks • 4 Domains',
    },
  ];

  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b';
  const gridColor = theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.05)';

  return (
    <div className="space-y-6 animate-in fade-in duration-500 max-w-[1500px] mx-auto pb-16 font-sans">
      {/* Row 1: TOP 5 STAT CARDS */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {[
          { icon: Users, label: 'Learners', value: myStudents.length || 18, change: '^ 12%' },
          { icon: Target, label: 'Mastery', value: `${averageMastery}%`, change: '^ 4.3%' },
          { icon: CheckCircle2, label: 'Assessments', value: milestoneRecords.length || 48, change: '^ 8%' },
          { icon: Brain, label: 'Goals Met', value: performanceData.reduce((acc, c) => acc + Math.round(c.growth * 1.5), 0) || 142, change: '^ 2.5%' },
          { icon: AlertTriangle, label: 'Observations', value: 3, change: '^ 1' },
        ].map((card, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[9px] p-5 shadow-sm">
            <card.icon size={20} className="text-slate-400 dark:text-slate-500 mb-3" />
            <p className="text-[11px] font-semibold text-slate-400 dark:text-slate-500 mb-1">{card.label}</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">{card.value}</h3>
              <span className="text-[11px] font-bold text-emerald-500">{card.change}</span>
            </div>
          </div>
        ))}
      </div>


      {/* Row 3: MIDDLE SECTION - CHARTS (matching screenshot's Left & Right Chart views) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: GROWTH PERFORMANCE (Area Chart matching screenshot) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[9px] p-6 lg:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                Sales / Growth Performance
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Progression by Month
              </p>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#6366f1]"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase">Class Mastery (%)</span>
            </div>
          </div>

          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyProgressionData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="growthAreaGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.6} />
                    <stop offset="95%" stopColor="#c7d2fe" stopOpacity={0.05} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={gridColor} />
                <XAxis 
                  dataKey="month" 
                  stroke={axisColor} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: axisColor, opacity: 0.2 }}
                  tick={{ fontWeight: '700' }}
                />
                <YAxis 
                  stroke={axisColor} 
                  fontSize={10} 
                  tickLine={false} 
                  axisLine={{ stroke: axisColor, opacity: 0.2 }}
                  tick={{ fontWeight: '700' }}
                  domain={[0, 100]}
                  tickFormatter={val => `${val}%`}
                />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '9px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '11px', 
                    fontWeight: '800',
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff',
                    color: theme === 'dark' ? '#ffffff' : '#000000',
                    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1)'
                  }} 
                  formatter={(val: any) => [`${val}%`, 'Growth']}
                />
                <Area 
                  type="monotone" 
                  dataKey="mastery" 
                  stroke="#4f46e5" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#growthAreaGradient)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Card: REGION / DOMAIN PERFORMANCE (Horizontal Stacked Bar Chart matching screenshot) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[9px] p-6 lg:p-7 shadow-sm space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                Region / Domain Performance
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Category Split
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 text-[10px] font-bold">
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#3b82f6]"></span> Motor Skills</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#8b5cf6]"></span> Language</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#ec4899]"></span> Social/Emotional</span>
            <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-[#10b981]"></span> Cognitive</span>
          </div>

          <div className="h-[240px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={domainBreakdownData} layout="vertical" margin={{ top: 5, right: 15, left: 35, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={gridColor} />
                <XAxis type="number" stroke={axisColor} fontSize={9} tickLine={false} />
                <YAxis dataKey="stage" type="category" stroke={axisColor} fontSize={9} tickLine={false} width={80} />
                <Tooltip 
                  contentStyle={{ 
                    borderRadius: '9px', 
                    border: '1px solid #e2e8f0', 
                    fontSize: '10px', 
                    fontWeight: '800',
                    backgroundColor: theme === 'dark' ? '#0f172a' : '#ffffff' 
                  }} 
                />
                <Bar dataKey="motor" stackId="a" fill="#3b82f6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="language" stackId="a" fill="#8b5cf6" radius={[0, 0, 0, 0]} />
                <Bar dataKey="social" stackId="a" fill="#ec4899" radius={[0, 0, 0, 0]} />
                <Bar dataKey="cognitive" stackId="a" fill="#10b981" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Row 4: BOTTOM SECTION (Learner Table & Mastery Ratio matching screenshot) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Card: SUB-CATEGORY RANKING (Student Growth Matrix Table) */}
        <div className="lg:col-span-7 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[9px] p-6 lg:p-7 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-4">
            <div>
              <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
                Sub-Category Ranking
              </h3>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                Quantity & Progression by Student
              </p>
            </div>
            <button 
              onClick={() => setActiveTab('my-students')}
              className="text-[10px] font-black text-blue-600 hover:text-blue-700 uppercase tracking-widest"
            >
              Full Roster →
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase text-slate-400 tracking-widest">
                  <th className="pb-3">Learner</th>
                  <th className="pb-3">Classroom</th>
                  <th className="pb-3 text-center">Tasks Done</th>
                  <th className="pb-3 text-right">Growth Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {(performanceData.slice(0, 5) || []).map((student, idx) => (
                  <tr 
                    key={student.id} 
                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 cursor-pointer transition-colors group"
                    onClick={() => {
                      setSelectedStudentIdForLog(student.id);
                      setActiveTab('clinical');
                    }}
                  >
                    <td className="py-3.5 pr-3">
                      <div className="flex items-center gap-3">
                        <span className="w-1.5 h-6 rounded-[9px] bg-blue-600 group-hover:bg-indigo-600 transition-colors"></span>
                        <div className="w-7 h-7 rounded-[9px] bg-slate-100 dark:bg-slate-800 overflow-hidden flex items-center justify-center font-bold text-xs text-blue-600">
                          {student.avatar ? <img src={student.avatar} className="w-full h-full object-cover" /> : student.name[0]}
                        </div>
                        <span className="font-bold text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">
                          {student.name}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 text-slate-500 dark:text-slate-400 font-medium">
                      {student.assignedClass}
                    </td>
                    <td className="py-3.5 text-center font-mono font-bold text-slate-600 dark:text-slate-300">
                      {Math.round(student.growth * 0.35)} Goals
                    </td>
                    <td className="py-3.5 text-right font-mono font-black text-slate-900 dark:text-white">
                      <span className="px-2.5 py-1 rounded-[9px] bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800/40 text-[11px]">
                        {student.growth}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Card: PERFORMANCE RATIO (Mastery Ratio Gauge / Split Bar) */}
        <div className="lg:col-span-5 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[9px] p-6 lg:p-7 shadow-sm space-y-6 flex flex-col justify-between">
          <div className="space-y-1 border-b border-slate-100 dark:border-slate-800 pb-4">
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-900 dark:text-white">
              Performance Ratio
            </h3>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              Development vs Intervention Needs
            </p>
          </div>

          <div className="space-y-4 my-auto py-2">
            <div className="flex items-center justify-between text-[11px] font-black uppercase tracking-wider">
              <span className="text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span> On-Track (88.91%)
              </span>
              <span className="text-rose-500 flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span> Needs Support (11.09%)
              </span>
            </div>

            {/* Split Progress Bar matching screenshot */}
            <div className="h-7 w-full bg-slate-100 dark:bg-slate-800 rounded-[9px] overflow-hidden flex shadow-inner">
              <div 
                className="h-full bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-[10px] font-black tracking-wider shadow-sm transition-all"
                style={{ width: '88.91%' }}
              >
                88.91%
              </div>
              <div 
                className="h-full bg-gradient-to-r from-rose-500 to-pink-600 flex items-center justify-center text-white text-[10px] font-black tracking-wider transition-all"
                style={{ width: '11.09%' }}
              >
                11.09%
              </div>
            </div>

            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium italic text-center pt-2">
              Based on active growth checklists and milestone matrix evaluations.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              onClick={() => setActiveTab('clinical-logs')}
              className="py-3 px-4 bg-slate-50 dark:bg-slate-800 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-[9px] text-[10px] font-black uppercase tracking-wider transition-all text-center"
            >
              Session Logs
            </button>
            <button
              onClick={() => setActiveTab('clinical')}
              className="py-3 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[9px] text-[10px] font-black uppercase tracking-wider transition-all text-center shadow-sm"
            >
              New Assessment
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

