
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Users, Activity, HeartPulse, ShoppingCart, 
  ChevronRight, ArrowUpRight, TrendingUp,
  FileText, ShieldAlert, Package, Search, Plus,
  UserPlus, BellRing, Settings, Send, Receipt, History,
  Filter, DollarSign, Target, Database, ShieldCheck, CalendarDays
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const ActionCard = ({ label, icon: Icon, onClick, tone, iconTone }: any) => (
  <button 
    onClick={onClick}
    className={`group flex w-full flex-col items-center justify-center rounded-xl border p-3 text-center shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-md active:scale-95 ${tone}`}
  >
    <div className={`mb-2 rounded-lg p-2 transition-transform group-hover:scale-110 ${iconTone}`}>
      <Icon size={18} />
    </div>
    <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-400 leading-tight">{label}</span>
  </button>
);

const StatBox = ({ title, value, change, icon: Icon, color }: any) => (
  <div className="bg-white dark:bg-slate-900 gh-box p-5 flex flex-col justify-between hover:shadow-md transition-all group relative overflow-hidden">
    <div className="flex items-start justify-between relative z-10">
      <div>
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">{title}</p>
        <h3 className="text-3xl font-black mt-2 text-ghText dark:text-white font-mono tracking-tighter">{value}</h3>
      </div>
      <div className={`p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 border border-ghBorder dark:border-slate-700 ${color} group-hover:bg-white dark:group-hover:bg-slate-700 transition-colors shadow-sm`}>
        <Icon size={22} />
      </div>
    </div>
    <div className="mt-4 flex items-center gap-2 relative z-10">
      <span className="flex items-center text-[10px] font-black text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 px-2 py-0.5 rounded-full border border-emerald-100 dark:border-emerald-900/50">
        <ArrowUpRight size={12} className="mr-0.5" /> {change}
      </span>
      <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">v last month</span>
    </div>
    <div className="absolute -right-4 -bottom-4 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity">
      <Icon size={120} />
    </div>
  </div>
);

export const Dashboard: React.FC = () => {
  const { students, staff, clinicalLogs, user, setActiveTab, orders, applications, notices, settings, milestoneRecords } = useStore();
  const [tableSearch, setTableSearch] = useState('');
  const [classFilter, setClassFilter] = useState('All');
  const [chartRange, setChartRange] = useState<'7d' | '30d'>('7d');

  const processedGraphData = useMemo(() => {
    const days = chartRange === '7d' ? 7 : 30;
    const data = [];
    const now = new Date();
    
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      
      const count = (clinicalLogs || []).filter(log => log.date.startsWith(dateStr)).length;
      
      data.push({
        name: d.toLocaleDateString(undefined, { 
          weekday: days === 7 ? 'short' : undefined, 
          day: 'numeric', 
          month: days === 30 ? 'short' : undefined 
        }),
        sessions: count,
        fullDate: dateStr
      });
    }
    return data;
  }, [clinicalLogs, chartRange]);

  const studentPerformanceList = useMemo(() => {
    return students.map(student => {
      const latestMilestone = milestoneRecords
        .filter(r => r.studentId === student.id)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
      
      const balance = Math.max(0, settings.feesAmount - (student.totalPaid || 0));
      
      return {
        ...student,
        mastery: latestMilestone?.overallPercentage || 0,
        balance
      };
    });
  }, [students, milestoneRecords, settings.feesAmount]);

  const filteredStudents = studentPerformanceList.filter(s => {
    const matchesSearch = s.fullName.toLowerCase().includes(tableSearch.toLowerCase()) || s.id.toLowerCase().includes(tableSearch.toLowerCase());
    const matchesClass = classFilter === 'All' || s.assignedClass === classFilter;
    return matchesSearch && matchesClass;
  });

  return (
    <div className="w-full space-y-7 px-5 py-6 pb-20 animate-fade-up sm:px-6 md:px-8">
      <section className="space-y-4">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          <ActionCard label="Add Student" icon={UserPlus} tone="border-blue-200 bg-blue-50/80 dark:border-blue-900 dark:bg-blue-950/25" iconTone="bg-blue-100 text-blue-600 dark:bg-blue-900/60 dark:text-blue-300" onClick={() => setActiveTab('students')} />
          <ActionCard label="Add Staff" icon={Users} tone="border-emerald-200 bg-emerald-50/80 dark:border-emerald-900 dark:bg-emerald-950/25" iconTone="bg-emerald-100 text-emerald-600 dark:bg-emerald-900/60 dark:text-emerald-300" onClick={() => setActiveTab('staff')} />
          <ActionCard label="Checklist" icon={HeartPulse} tone="border-rose-200 bg-rose-50/80 dark:border-rose-900 dark:bg-rose-950/25" iconTone="bg-rose-100 text-rose-600 dark:bg-rose-900/60 dark:text-rose-300" onClick={() => setActiveTab('clinical')} />
          <ActionCard label="Announce" icon={BellRing} tone="border-violet-200 bg-violet-50/80 dark:border-violet-900 dark:bg-violet-950/25" iconTone="bg-violet-100 text-violet-600 dark:bg-violet-900/60 dark:text-violet-300" onClick={() => setActiveTab('notices')} />
          <ActionCard label="Orders" icon={Receipt} tone="border-orange-200 bg-orange-50/80 dark:border-orange-900 dark:bg-orange-950/25" iconTone="bg-orange-100 text-orange-600 dark:bg-orange-900/60 dark:text-orange-300" onClick={() => setActiveTab('orders')} />
          <ActionCard label="Uniforms" icon={ShoppingCart} tone="border-fuchsia-200 bg-fuchsia-50/80 dark:border-fuchsia-900 dark:bg-fuchsia-950/25" iconTone="bg-fuchsia-100 text-fuchsia-600 dark:bg-fuchsia-900/60 dark:text-fuchsia-300" onClick={() => setActiveTab('shop')} />
          <ActionCard label="Logs" icon={ShieldAlert} tone="border-slate-300 bg-slate-100 dark:border-slate-700 dark:bg-slate-800/70" iconTone="bg-slate-200 text-slate-700 dark:bg-slate-700 dark:text-slate-200" onClick={() => setActiveTab('system-logs')} />
          <ActionCard label="Settings" icon={Settings} tone="border-indigo-200 bg-indigo-50/80 dark:border-indigo-900 dark:bg-indigo-950/25" iconTone="bg-indigo-100 text-indigo-600 dark:bg-indigo-900/60 dark:text-indigo-300" onClick={() => setActiveTab('settings')} />
        </div>
      </section>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatBox title="Enrolled Students" value={students.length} change="12%" icon={Users} color="text-googleBlue" />
        <StatBox title="Session Notes" value={clinicalLogs.length} change="8%" icon={Activity} color="text-indigo-600" />
        <StatBox title="Active Staff" value={staff.length} change="2%" icon={ShieldAlert} color="text-emerald-600" />
        <StatBox title="Procurement" value={`$${(orders.length * 125).toLocaleString()}`} change="5%" icon={Package} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="flex flex-col overflow-hidden rounded-[9px] border border-ghBorder bg-white shadow-sm lg:col-span-2 dark:border-slate-800 dark:bg-slate-900">
          <div className="p-6 border-b border-ghBorder dark:border-slate-800 bg-ghBg/50 dark:bg-slate-950/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <TrendingUp size={18} className="text-googleBlue" />
              <h3 className="text-sm font-black uppercase tracking-widest text-ghText dark:text-white">Activity Growth</h3>
            </div>
            
            <div className="flex items-center bg-ghBg dark:bg-slate-800 p-1 rounded-xl border border-ghBorder dark:border-slate-700">
               <button 
                onClick={() => setChartRange('7d')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartRange === '7d' ? 'bg-white dark:bg-slate-700 text-googleBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 <CalendarDays size={14} /> 7 Days
               </button>
               <button 
                onClick={() => setChartRange('30d')}
                className={`flex items-center gap-2 px-4 py-1.5 rounded-lg text-[10px] font-black uppercase transition-all ${chartRange === '30d' ? 'bg-white dark:bg-slate-700 text-googleBlue shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
               >
                 <CalendarDays size={14} /> 30 Days
               </button>
            </div>
          </div>
          
          <div className="p-8 h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={processedGraphData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1a73e8" stopOpacity={0.15}/>
                    <stop offset="95%" stopColor="#1a73e8" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#d0d7de33" />
                <XAxis 
                  dataKey="name" 
                  stroke="#57606a" 
                  fontSize={10} 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fontWeight: 800 }} 
                  interval={chartRange === '30d' ? 4 : 0}
                />
                <YAxis stroke="#57606a" fontSize={10} axisLine={false} tickLine={false} tick={{ fontWeight: 800 }} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }} 
                  labelClassName="text-googleBlue"
                />
                <Area type="monotone" dataKey="sessions" stroke="#1a73e8" strokeWidth={3} fill="url(#colorSessions)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white dark:bg-slate-900 border border-ghBorder dark:border-slate-800 flex flex-col shadow-sm rounded-[2.5rem] overflow-hidden">
            <div className="p-6 border-b border-ghBorder dark:border-slate-800 bg-ghBg/50 dark:bg-slate-950/50">
              <h3 className="text-sm font-black uppercase tracking-widest dark:text-white">Recent Updates</h3>
            </div>
            <div className="p-4 space-y-3">
              {[
                { label: 'Careers', value: applications.filter(a => a.status === 'Pending').length, icon: Send, color: 'text-amber-500', tab: 'applications' },
                { label: 'Unpaid Orders', value: orders.filter(o => o.status === 'Uncollected').length, icon: Receipt, color: 'text-blue-500', tab: 'orders' },
                { label: 'Notices', value: notices.length, icon: BellRing, color: 'text-emerald-500', tab: 'notices' },
                { label: 'System Errors', value: 0, icon: ShieldAlert, color: 'text-rose-500', tab: 'system-logs' },
              ].map((log, i) => (
                <button 
                  key={i}
                  onClick={() => setActiveTab(log.tab)}
                  className="w-full flex items-center justify-between p-3 rounded-xl border border-ghBorder dark:border-slate-800 hover:bg-ghBg dark:hover:bg-slate-800 transition-all group shadow-sm active:scale-95"
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-2 bg-slate-50 dark:bg-slate-950 border border-ghBorder dark:border-slate-800 rounded-lg group-hover:scale-110 transition-transform ${log.color}`}>
                      <log.icon size={16} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-slate-700 dark:text-slate-300">{log.label}</span>
                  </div>
                  <div className="flex items-center gap-3">
                     <span className="text-[10px] font-black font-mono text-slate-400 bg-slate-100 dark:bg-slate-800 px-2 py-0.5 rounded-lg">{log.value}</span>
                     <ChevronRight size={12} className="text-slate-300" />
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <section className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 px-1">
          <div className="flex items-center gap-3">
             <Target size={18} className="text-googleBlue" />
             <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-400">Student List</h2>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-googleBlue" />
              <input 
                type="text" 
                placeholder="Filter names..." 
                value={tableSearch}
                onChange={e => setTableSearch(e.target.value)}
                className="pl-9 pr-4 py-2 bg-white dark:bg-slate-900 border border-ghBorder dark:border-slate-800 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-googleBlue transition-all w-full sm:w-64"
              />
            </div>
            <div className="flex items-center gap-2 bg-white dark:bg-slate-900 border border-ghBorder dark:border-slate-800 px-3 py-2 rounded-xl">
               <Filter size={14} className="text-slate-400" />
               <select 
                 value={classFilter}
                 onChange={e => setClassFilter(e.target.value)}
                 className="bg-transparent text-[10px] font-black uppercase tracking-widest outline-none cursor-pointer text-slate-700 dark:text-slate-400"
               >
                 <option value="All">All Classes</option>
                 {(settings?.classes || []).map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 border border-ghBorder dark:border-slate-800 rounded-[2.5rem] overflow-hidden shadow-sm">
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-ghBg/50 dark:bg-slate-950/50 border-b border-ghBorder dark:border-slate-800 text-[9px] font-black uppercase tracking-[0.2em] text-slate-400">
                    <tr>
                       <th className="px-8 py-5">Student Photo & Name</th>
                       <th className="px-8 py-5">Class</th>
                       <th className="px-8 py-5 text-center">Progress</th>
                       <th className="px-8 py-5">Paid</th>
                       <th className="px-8 py-5">Balance</th>
                       <th className="px-8 py-5 text-right">View</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                    {filteredStudents.length === 0 ? (
                      <tr>
                        <td colSpan={6} className="py-20 text-center">
                           <Database size={48} className="mx-auto text-slate-100 mb-4" />
                           <p className="text-[10px] font-black uppercase text-slate-300 italic tracking-widest">No matching entry found</p>
                        </td>
                      </tr>
                    ) : filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-900/5 group transition-colors cursor-pointer" onClick={() => setActiveTab('students')}>
                         <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 overflow-hidden border border-slate-200 dark:border-slate-700 shadow-sm flex items-center justify-center font-black text-xs uppercase text-blue-600">
                                  {student.imageUrl ? <img src={student.imageUrl} className="w-full h-full object-cover" alt={student.fullName} /> : student.fullName[0]}
                               </div>
                               <div>
                                  <p className="text-[11px] font-black uppercase tracking-tight text-slate-950 dark:text-white leading-none">{student.fullName}</p>
                                  <p className="text-[9px] font-mono text-slate-400 mt-1 uppercase tracking-widest">{student.id}</p>
                               </div>
                            </div>
                         </td>
                         <td className="px-8 py-6">
                            <span className="px-3 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-[9px] font-black uppercase border border-slate-200 dark:border-slate-700 text-slate-500">
                               {student.assignedClass}
                            </span>
                         </td>
                         <td className="px-8 py-6">
                            <div className="flex items-center justify-center gap-3">
                               <div className="w-24 h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                                  <div 
                                    className={`h-full transition-all duration-1000 ${student.mastery > 75 ? 'bg-emerald-500' : student.mastery > 40 ? 'bg-googleBlue' : 'bg-amber-500'}`} 
                                    style={{ width: `${student.mastery}%` }}
                                  />
                               </div>
                               <span className="text-[10px] font-black font-mono text-slate-700 dark:text-slate-400">{student.mastery}%</span>
                            </div>
                         </td>
                         <td className="px-8 py-6 font-black font-mono text-[13px] text-emerald-600">
                            ${(student.totalPaid || 0).toLocaleString()}
                         </td>
                         <td className="px-8 py-6">
                            <span className={`text-[13px] font-black font-mono ${student.balance > 0 ? 'text-rose-600' : 'text-slate-300'}`}>
                               ${student.balance.toLocaleString()}
                            </span>
                         </td>
                         <td className="px-8 py-6 text-right">
                            <button className="p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800 text-slate-400 group-hover:bg-googleBlue group-hover:text-white transition-all shadow-sm">
                               <ChevronRight size={18} />
                            </button>
                         </td>
                      </tr>
                    ))}
                 </tbody>
              </table>
           </div>
           <div className="p-8 bg-ghBg/30 dark:bg-slate-950/30 border-t border-ghBorder dark:border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-3 text-slate-400">
                 <ShieldCheck size={16} className="text-emerald-500" />
                 <span className="text-[9px] font-black uppercase tracking-widest">Secure Records Sync</span>
              </div>
              <p className="text-[9px] font-mono text-slate-400 uppercase">{filteredStudents.length} Active Student Profiles</p>
           </div>
        </div>
      </section>
    </div>
  );
};
