
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  Search, 
  ChevronRight, 
  ChevronDown,
  ArrowLeft, 
  Plus, 
  History,
  CheckCircle2,
  Brain,
  FileText,
  Save,
  Loader2,
  PlusCircle,
  Trash2,
  Activity,
  Zap,
  LayoutGrid,
  FileSpreadsheet,
  MessageSquarePlus,
  Clock,
  X,
  Calendar
} from 'lucide-react';
import { Student, TaskStep, PromptLevel, ProgramRequest } from '../types';
import { PROMPT_LEVELS } from '../constants';

export const LessonLogs: React.FC = () => {
  const { students, user, staff, selectedStudentIdForLog, setSelectedStudentIdForLog, addClinicalLog, clinicalLogs, milestoneRecords, settings } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  
  const [activeView, setActiveView] = useState<'selection' | 'workspace' | 'history'>(
    selectedStudentIdForLog ? 'workspace' : 'selection'
  );

  useEffect(() => {
    if (selectedStudentIdForLog) {
      setActiveView('workspace');
    }
  }, [selectedStudentIdForLog]);

  const [workspaceMode, setWorkspaceMode] = useState<'datasheet' | 'program'>('datasheet');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [targetBehavior, setTargetBehavior] = useState('');
  const [method, setMethod] = useState<'Forward Chaining' | 'Backward Chaining' | 'Total Task'>('Total Task');
  
  // Workspace Form State - Pre-load from settings
  const [steps, setSteps] = useState<TaskStep[]>([]);

  useEffect(() => {
    if (settings?.defaultTaskSteps && settings.defaultTaskSteps.length > 0) {
      const initialSteps = settings.defaultTaskSteps.map((desc, i) => ({
        id: `default-${i}-${Date.now()}`,
        description: desc,
        trials: Array(10).fill('-') as PromptLevel[]
      }));
      setSteps(initialSteps);
    } else {
      setSteps([
        { id: '1', description: 'Step 1', trials: Array(10).fill('-') },
        { id: '2', description: 'Step 2', trials: Array(10).fill('-') }
      ]);
    }
  }, [settings?.defaultTaskSteps]);

  const [programRequests, setProgramRequests] = useState<ProgramRequest[]>([
    { id: 'p1', activity: '', echoicTempted: 0, noVerbalTempted: 0, noEchoicNoTempting: 0 }
  ]);
  const [goalPerHour, setGoalPerHour] = useState<string>('');
  const [actualHour, setActualHour] = useState<string>('');

  const selectedStudent = useMemo(() => 
    students.find(s => s.id === selectedStudentIdForLog),
    [students, selectedStudentIdForLog]
  );

  const studentMastery = useMemo(() => {
    if (!selectedStudentIdForLog) return 0;
    const latest = milestoneRecords
      .filter(r => r.studentId === selectedStudentIdForLog)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
    return latest?.overallPercentage || 0;
  }, [milestoneRecords, selectedStudentIdForLog]);

  const availableStudents = useMemo(() => {
    return students.filter(s => {
      const isAdmin = user?.role === 'SUPER_ADMIN';
      const isSpecialist = user?.role === 'SPECIALIST';
      const isSupport = user?.role === 'ADMIN_SUPPORT';

      if (isAdmin) return true;

      if (isSpecialist || isSupport) {
        const staffProfile = staff.find(st => st.id === user?.id);
        if (staffProfile && staffProfile.assignedClasses) {
          if (staffProfile.assignedClasses.includes(s.assignedClass)) return true;
        } else if (isSpecialist && s.assignedStaffId === user?.id) {
          return true;
        }
      }

      return false;
    });
  }, [students, user, staff]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return availableStudents.filter(s => s.fullName.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));
  }, [availableStudents, searchTerm]);

  const selectedStudentIndex = selectedStudent ? availableStudents.findIndex(s => s.id === selectedStudent.id) : -1;
  const previousStudent = selectedStudentIndex > 0 ? availableStudents[selectedStudentIndex - 1] : undefined;
  const nextStudent = selectedStudentIndex >= 0 ? availableStudents[selectedStudentIndex + 1] : undefined;

  const openStudent = (studentId: string) => {
    setSelectedStudentIdForLog(studentId);
    setActiveView('workspace');
  };

  const handleAddStep = () => {
    setSteps([...steps, { id: Date.now().toString(), description: '', trials: Array(10).fill('-') }]);
  };

  const handleRemoveStep = (id: string) => {
    if (confirm("Delete this step from today's lesson?")) {
      setSteps(steps.filter(s => s.id !== id));
    }
  };

  const handleAddProgramRequest = () => {
    setProgramRequests([...programRequests, { id: Date.now().toString(), activity: '', echoicTempted: 0, noVerbalTempted: 0, noEchoicNoTempting: 0 }]);
  };

  const handleSave = async () => {
    if (!selectedStudentIdForLog || !targetBehavior) return;
    setIsSubmitting(true);
    
    const allTrials = steps.flatMap(s => s.trials);
    const independentCount = allTrials.filter(t => t === '+').length;
    const independenceScore = Math.round((independentCount / (allTrials.length || 1)) * 100);

    try {
      await addClinicalLog({
        studentId: selectedStudentIdForLog,
        date: new Date().toISOString(),
        targetBehavior,
        method,
        steps,
        programRequests,
        independenceScore,
        staffId: user?.id || 'unknown',
        goalPerHour: parseFloat(goalPerHour) || 0,
        actualHour: parseFloat(actualHour) || 0
      });
      setActiveView('history');
    } finally {
      setIsSubmitting(false);
    }
  };

  const [studentListPage, setStudentListPage] = useState(1);
  const studentPageSize = 8;
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const paginatedStudents = filteredStudents.slice((studentListPage - 1) * studentPageSize, studentListPage * studentPageSize);

  const inputStyle = `w-full p-3.5 border border-slate-200 dark:border-slate-700 text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800 rounded-[9px] outline-none text-xs font-semibold placeholder:opacity-50 focus:border-blue-600 transition-all`;

  if (activeView === 'selection' || !selectedStudentIdForLog) {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] flex flex-col justify-between animate-in fade-in duration-500 font-sans">
        <div className="flex-1 flex flex-col">
          {/* Table Toolbar Header directly on page */}
          <div className="px-6 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
                Select Student for Task Analysis
              </h2>
            </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Search Input */}
            <div className="relative min-w-[240px]">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input 
                  type="text" 
                  placeholder="Search student or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-[9px] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600" 
                />
              </div>
            </div>
          </div>

          {/* Table Content */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-5 font-semibold">Student ID</th>
                  <th className="py-3.5 px-5 font-semibold">Student Name</th>
                  <th className="py-3.5 px-5 font-semibold">Class Group</th>
                  <th className="py-3.5 px-5 font-semibold">Session Logs</th>
                  <th className="py-3.5 px-5 font-semibold">Last Recorded Activity</th>
                  <th className="py-3.5 px-5 font-semibold">Session Status</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No assigned students found matching your search.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map(student => {
                    const studentLogs = (clinicalLogs || []).filter(l => l.studentId === student.id);
                    const lastLog = studentLogs[studentLogs.length - 1];

                    return (
                      <tr 
                        key={student.id} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => { setSelectedStudentIdForLog(student.id); setActiveView('workspace'); }}
                      >
                        <td className="py-4 px-5 font-mono text-[11px] text-slate-500 font-bold">
                          #{student.id}
                        </td>

                        <td className="py-4 px-5">
                          <div className="flex items-center gap-2.5">
                            {student.imageUrl ? (
                              <img 
                                src={student.imageUrl} 
                                alt={student.fullName} 
                                className="w-8 h-8 rounded-full object-cover border border-slate-200 dark:border-slate-700" 
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-black flex items-center justify-center text-xs">
                                {student.fullName[0]}
                              </div>
                            )}
                            <span className="font-bold text-slate-900 dark:text-white">
                              {student.fullName}
                            </span>
                          </div>
                        </td>

                        <td className="py-4 px-5">
                          <span className="px-2.5 py-1 rounded-[9px] text-[11px] font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                            {student.assignedClass || 'General'}
                          </span>
                        </td>

                        <td className="py-4 px-5 font-semibold text-slate-900 dark:text-white">
                          {studentLogs.length} datasheets
                        </td>

                        <td className="py-4 px-5 text-slate-500">
                          {lastLog ? (
                            <span className="font-medium text-slate-700 dark:text-slate-300 truncate block max-w-[200px]">
                              {lastLog.targetBehavior}
                            </span>
                          ) : (
                            <span className="text-slate-400 italic">No notes yet</span>
                          )}
                        </td>

                        <td className="py-4 px-5">
                          {studentLogs.length > 0 ? (
                            <span className="px-2.5 py-1 rounded-[9px] text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                              Active Sessions
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-[9px] text-[10px] font-bold border bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700">
                              New Learner
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentIdForLog(student.id);
                              setActiveView('workspace');
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[9px] text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 ml-auto"
                          >
                            Launch Notes <ChevronRight size={13} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      {/* Pagination Footer at very bottom */}
      <div className="mt-auto px-6 md:px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
        <div>
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length > 0 ? (studentListPage - 1) * studentPageSize + 1 : 0}</span> to{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {Math.min(studentListPage * studentPageSize, filteredStudents.length)}
          </span> of{' '}
          <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length}</span> results
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setStudentListPage(p => Math.max(1, p - 1))}
            disabled={studentListPage === 1}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Previous
          </button>
          {Array.from({ length: totalStudentPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setStudentListPage(num)}
              className={`w-8 h-8 rounded-[9px] text-xs font-bold transition-all ${
                studentListPage === num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setStudentListPage(p => Math.min(totalStudentPages, p + 1))}
            disabled={studentListPage === totalStudentPages}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-72px)] w-full bg-slate-50/40 pb-16 font-sans animate-in fade-in duration-500 dark:bg-slate-950">
      <header className="flex flex-col justify-between gap-5 border-b border-slate-200 bg-white px-5 py-5 sm:px-6 md:flex-row md:items-center md:px-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col items-start gap-2">
          <button 
            onClick={() => { setActiveView('selection'); setSelectedStudentIdForLog(null); }}
            className="p-1 text-slate-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            title="Back to students"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
                <h1 className="text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white md:text-2xl">{selectedStudent?.fullName}</h1>
                <div className="flex items-center gap-2 mt-1.5">
                   <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Active Worksheet</p>
                   <span className="text-slate-300 dark:text-slate-700">•</span>
                   <p className="text-[10px] text-blue-600 font-bold uppercase">Mastery: {studentMastery}%</p>
                </div>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2">
        <div className="flex rounded-[9px] border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800">
           <button 
            onClick={() => setActiveView('workspace')}
            className={`flex items-center gap-2 px-5 py-2 rounded-[9px] text-xs font-bold transition-all ${activeView === 'workspace' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
           >
             <Plus size={14} /> New Lesson
           </button>
           <button 
            onClick={() => setActiveView('history')}
            className={`flex items-center gap-2 px-5 py-2 rounded-[9px] text-xs font-bold transition-all ${activeView === 'history' ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
           >
             <History size={14} /> Past Notes
           </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <button type="button" onClick={() => previousStudent && openStudent(previousStudent.id)} disabled={!previousStudent} className="flex items-center justify-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"><ArrowLeft size={13} /> Previous student</button>
          <button type="button" onClick={() => nextStudent && openStudent(nextStudent.id)} disabled={!nextStudent} className="flex items-center justify-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-600 hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300">Next student <ChevronRight size={13} /></button>
        </div>
        </div>
      </header>

      {activeView === 'workspace' && (
        <div>
           <div className="flex border-b border-slate-200 bg-white px-6 md:px-8 dark:border-slate-800 dark:bg-slate-950">
              <button 
                onClick={() => setWorkspaceMode('datasheet')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold transition-colors ${workspaceMode === 'datasheet' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                 <FileSpreadsheet size={15} /> Activity Record
              </button>

              <button 
                onClick={() => setWorkspaceMode('program')}
                className={`flex items-center gap-2 border-b-2 px-5 py-3.5 text-xs font-bold transition-colors ${workspaceMode === 'program' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-900 dark:hover:text-white'}`}
              >
                 <MessageSquarePlus size={15} /> Speech Goals
              </button>
           </div>

           <div className="grid min-h-[calc(100vh-205px)] grid-cols-1 bg-white lg:grid-cols-12 dark:bg-slate-900">
             <main className="p-5 sm:p-6 lg:col-span-9 lg:p-8">

           {workspaceMode === 'datasheet' ? (
             <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in slide-in-from-left duration-500">
                <div className="lg:col-span-12 space-y-6">
                   <div className="space-y-6 bg-white dark:bg-slate-900">
                      <header className="flex flex-col md:flex-row items-center justify-between gap-4 border-b border-slate-100 dark:border-slate-800 pb-5">
                         <div className="space-y-1.5 w-full md:w-auto flex-1 max-w-md">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Lesson Name</label>
                            <input 
                              value={targetBehavior}
                              onChange={e => setTargetBehavior(e.target.value)}
                              placeholder="e.g. Brushing Teeth"
                              className={inputStyle}
                            />
                         </div>
                         <div className="space-y-1.5 w-full md:w-auto">
                            <label className="text-[11px] font-bold text-slate-500 uppercase">Learning Method</label>
                            <div className="relative">
                              <select
                                value={method}
                                onChange={e => setMethod(e.target.value as any)}
                                className="w-full min-w-[210px] appearance-none rounded-[9px] border border-slate-200 bg-white py-3.5 pl-4 pr-11 text-xs font-semibold text-slate-900 shadow-sm outline-none transition-all hover:border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 dark:border-slate-700 dark:bg-slate-800 dark:text-white dark:hover:border-slate-600"
                              >
                                <option value="Total Task">Total Task</option>
                                <option value="Forward Chaining">Forward Chaining</option>
                                <option value="Backward Chaining">Backward Chaining</option>
                              </select>
                              <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center text-slate-400">
                                <ChevronDown size={15} />
                              </span>
                            </div>
                         </div>
                      </header>

                      <div className="overflow-x-auto">
                         <table className="w-full text-left border-collapse min-w-[900px]">
                            <thead>
                               <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                                  <th className="py-3 px-4 w-48">Describe Step</th>
                                  {[...Array(10)].map((_, i) => <th key={i} className="py-3 px-1.5 text-center">T{i+1}</th>)}
                                  <th className="py-3 px-4 text-right">Action</th>
                               </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                               {steps.map((step, sIdx) => (
                                 <tr key={step.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                                    <td className="py-3 px-4">
                                       <input 
                                         value={step.description}
                                         onChange={e => {
                                           const next = [...steps];
                                           next[sIdx].description = e.target.value;
                                           setSteps(next);
                                         }}
                                         placeholder="Write step..."
                                         className="w-full bg-transparent font-medium text-xs text-slate-900 dark:text-white outline-none focus:border-b focus:border-blue-600"
                                       />
                                    </td>
                                    {step.trials.map((trial, tIdx) => (
                                      <td key={tIdx} className="py-3 px-1 text-center">
                                        <div className="relative inline-flex">
                                         <select
                                           value={trial}
                                           onChange={e => {
                                             const next = [...steps];
                                             next[sIdx].trials[tIdx] = e.target.value as PromptLevel;
                                             setSteps(next);
                                           }}
                                           title={`Trial ${tIdx + 1}: ${trial === '-' ? 'Not recorded' : trial}`}
                                           className={`h-9 w-11 cursor-pointer appearance-none rounded-[9px] border py-0 pl-2 pr-4 text-left text-[10px] font-black shadow-sm outline-none transition-all hover:-translate-y-0.5 hover:shadow-md focus:ring-4 focus:ring-blue-500/15 ${
                                             trial !== '-' ? 'border-blue-300 dark:border-blue-700' : 'border-slate-200 dark:border-slate-700'
                                           } ${PROMPT_LEVELS.find(pl => pl.key === trial)?.color || 'bg-white text-slate-400 dark:bg-slate-800'}`}
                                         >
                                            <option value="-">-</option>
                                            {PROMPT_LEVELS.map(pl => <option key={pl.key} value={pl.key}>{pl.key}</option>)}
                                         </select>
                                         <ChevronDown size={9} className="pointer-events-none absolute right-1.5 top-1/2 -translate-y-1/2 text-current opacity-55" />
                                        </div>
                                      </td>
                                    ))}
                                    <td className="py-3 px-4 text-right">
                                       <button onClick={() => handleRemoveStep(step.id)} className="text-slate-300 hover:text-rose-600 p-1.5 rounded-[7px] transition-colors"><Trash2 size={15}/></button>
                                    </td>
                                 </tr>
                               ))}
                            </tbody>
                         </table>
                      </div>
                      <button onClick={handleAddStep} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs">
                         <PlusCircle size={16} /> Add Step
                      </button>
                   </div>
                </div>
             </div>
           ) : (
             <div className="space-y-6 bg-white animate-in fade-in duration-300 dark:bg-slate-900">
                <header className="border-b border-slate-100 dark:border-slate-800 pb-4 space-y-1">
                   <h3 className="text-lg font-bold text-slate-900 dark:text-white uppercase">Speech Goal Form</h3>
                   <p className="text-xs text-slate-400">Track vocal requests, verbal repetitions, and echoic prompts</p>
                </header>

                <div className="overflow-x-auto">
                   <table className="w-full text-left border-collapse">
                      <thead>
                         <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                            <th className="py-3.5 px-4 font-semibold">Activity</th>
                            <th className="py-3.5 px-4 font-semibold">Echoic Tempted</th>
                            <th className="py-3.5 px-4 font-semibold">No Verbal Tempted</th>
                            <th className="py-3.5 px-4 font-semibold">Independent</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                         {programRequests.map((req, rIdx) => (
                           <tr key={req.id}>
                              <td className="py-3 px-4">
                                 <input
                                   value={req.activity}
                                   onChange={e => {
                                     const next = [...programRequests];
                                     next[rIdx].activity = e.target.value;
                                     setProgramRequests(next);
                                   }}
                                   placeholder="Activity name..."
                                   className={inputStyle}
                                 />
                              </td>
                              <td className="py-3 px-4">
                                 <input
                                   type="number"
                                   value={req.echoicTempted}
                                   onChange={e => {
                                     const next = [...programRequests];
                                     next[rIdx].echoicTempted = parseInt(e.target.value) || 0;
                                     setProgramRequests(next);
                                   }}
                                   className={`${inputStyle} text-center`}
                                 />
                              </td>
                              <td className="py-3 px-4">
                                 <input
                                   type="number"
                                   value={req.noVerbalTempted}
                                   onChange={e => {
                                     const next = [...programRequests];
                                     next[rIdx].noVerbalTempted = parseInt(e.target.value) || 0;
                                     setProgramRequests(next);
                                   }}
                                   className={`${inputStyle} text-center`}
                                 />
                              </td>
                              <td className="py-3 px-4">
                                 <input
                                   type="number"
                                   value={req.noEchoicNoTempting}
                                   onChange={e => {
                                     const next = [...programRequests];
                                     next[rIdx].noEchoicNoTempting = parseInt(e.target.value) || 0;
                                     setProgramRequests(next);
                                   }}
                                   className={`${inputStyle} text-center`}
                                 />
                              </td>
                           </tr>
                         ))}
                      </tbody>
                   </table>
                </div>

                <button onClick={handleAddProgramRequest} className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-bold text-xs">
                   <PlusCircle size={16} /> Add Program Activity
                </button>
             </div>
           )}
             </main>

             <aside className="border-t border-slate-200 bg-slate-50/80 lg:col-span-3 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-950/70">
               <div className="sticky top-0 space-y-6 p-6 lg:p-7">
                 <div className="border-b border-slate-200 pb-4 dark:border-slate-800">
                   <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">Task analysis overview</p>
                   <h3 className="mt-1 text-sm font-bold text-slate-900 dark:text-white">Current lesson</h3>
                 </div>
                 <div className="border-b border-slate-200 pb-5 dark:border-slate-800">
                   <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Success level</p>
                   <p className="mt-1 font-mono text-4xl font-black text-emerald-600 dark:text-emerald-400">
                     {Math.round((steps.flatMap(s => s.trials).filter(t => t === '+').length / (steps.flatMap(s => s.trials).length || 1)) * 100)}%
                   </p>
                 </div>
                 <div className="space-y-3 text-xs">
                   <div className="flex items-center justify-between"><span className="font-medium text-slate-500">Profile mastery</span><span className="font-bold text-blue-600">{studentMastery}%</span></div>
                   <div className="flex items-center justify-between"><span className="font-medium text-slate-500">Activity type</span><span className="font-bold text-slate-800 dark:text-slate-200">{workspaceMode === 'datasheet' ? 'Task steps' : 'Speech goals'}</span></div>
                   <div className="flex items-center justify-between"><span className="font-medium text-slate-500">Recorded rows</span><span className="font-bold text-slate-800 dark:text-slate-200">{workspaceMode === 'datasheet' ? steps.length : programRequests.length}</span></div>
                 </div>
                 <button onClick={handleSave} disabled={isSubmitting || !targetBehavior} className="flex w-full items-center justify-center gap-2 rounded-[9px] bg-blue-600 py-3.5 text-xs font-bold text-white transition-colors hover:bg-blue-700 disabled:opacity-50">
                   {isSubmitting ? <Loader2 size={14} className="animate-spin" /> : <>Save Lesson Notes <CheckCircle2 size={15}/></>}
                 </button>
                 <button onClick={() => setSelectedStudentIdForLog(null)} className="w-full py-2 text-xs font-bold text-slate-500 transition-colors hover:text-slate-900 dark:hover:text-white">Discard lesson</button>
               </div>
             </aside>
           </div>
        </div>
      )}

      {activeView === 'history' && (
        <div className="w-full overflow-hidden bg-white animate-in fade-in duration-300 dark:bg-slate-950">
           <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">Lesson Datasheet History</h3>
              <div className="flex items-center gap-2">
                 <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                 <span className="text-[11px] font-mono text-slate-400">Database Synced</span>
              </div>
           </div>
           <div className="overflow-x-auto">
             <table className="w-full text-left border-collapse">
                <thead>
                   <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                      <th className="py-3.5 px-5 font-semibold">Date</th>
                      <th className="py-3.5 px-5 font-semibold">Lesson / Target</th>
                      <th className="py-3.5 px-5 font-semibold">Method</th>
                      <th className="py-3.5 px-5 font-semibold">Independence</th>
                      <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                   {(clinicalLogs || []).filter(l => l.studentId === selectedStudentIdForLog).length === 0 ? (
                     <tr><td colSpan={5} className="py-16 text-center text-xs font-semibold text-slate-400">No past datasheets recorded for this learner.</td></tr>
                   ) : clinicalLogs.filter(l => l.studentId === selectedStudentIdForLog).map(log => (
                     <React.Fragment key={log.id}>
                     <tr onClick={() => setExpandedLogId(current => current === log.id ? null : log.id)} className="cursor-pointer hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors">
                        <td className="py-4 px-5 font-mono text-[11px] text-slate-500">
                           {new Date(log.date).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-5 font-bold text-slate-900 dark:text-white">
                           {log.targetBehavior}
                        </td>
                        <td className="py-4 px-5">
                           <span className="px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-[9px] text-[10px] font-bold text-slate-600 dark:text-slate-300">{log.method}</span>
                        </td>
                        <td className="py-4 px-5">
                           <span className="px-2.5 py-1 rounded-[9px] text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                              {log.independenceScore}% Success
                           </span>
                        </td>
                        <td className="py-4 px-5 text-right">
                           <ChevronRight size={16} className={`ml-auto text-slate-400 transition-transform ${expandedLogId === log.id ? 'rotate-90 text-blue-600' : ''}`} />
                        </td>
                     </tr>
                     {expandedLogId === log.id && (
                       <tr>
                         <td colSpan={5} className="border-t border-slate-100 bg-slate-50/50 p-0 dark:border-slate-800 dark:bg-slate-900/60">
                           <div className="grid grid-cols-1 lg:grid-cols-3">
                             <div className="border-b border-slate-200 p-5 lg:border-b-0 lg:border-r dark:border-slate-800">
                               <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400">Session summary</p>
                               <dl className="mt-4 space-y-3 text-xs">
                                 <div className="flex justify-between gap-4"><dt className="text-slate-500">Recorded</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{new Date(log.date).toLocaleString()}</dd></div>
                                 <div className="flex justify-between gap-4"><dt className="text-slate-500">Method</dt><dd className="font-medium text-slate-800 dark:text-slate-200">{log.method}</dd></div>
                                 <div className="flex justify-between gap-4"><dt className="text-slate-500">Goal/hour</dt><dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.goalPerHour || 0}</dd></div>
                                 <div className="flex justify-between gap-4"><dt className="text-slate-500">Actual/hour</dt><dd className="font-mono font-bold text-slate-800 dark:text-slate-200">{log.actualHour || 0}</dd></div>
                               </dl>
                             </div>
                             <div className="overflow-x-auto border-b border-slate-200 lg:col-span-2 lg:border-b-0 dark:border-slate-800">
                               <table className="w-full min-w-[540px] text-left">
                                 <thead><tr className="border-b border-slate-200 text-[9px] font-semibold uppercase text-slate-400 dark:border-slate-800"><th className="px-5 py-3">Task step</th><th className="px-5 py-3">Trial results</th></tr></thead>
                                 <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                   {(log.steps || []).map((step, stepIndex) => (
                                     <tr key={step.id}><td className="px-5 py-3 text-xs font-medium text-slate-800 dark:text-slate-200">{stepIndex + 1}. {step.description}</td><td className="px-5 py-3"><div className="flex flex-wrap gap-1">{(step.trials || []).map((trial, trialIndex) => <span key={trialIndex} className="flex h-6 min-w-6 items-center justify-center rounded bg-white px-1 font-mono text-[9px] font-bold text-slate-600 dark:bg-slate-800 dark:text-slate-300">{trial}</span>)}</div></td></tr>
                                   ))}
                                   {(log.steps || []).length === 0 && <tr><td colSpan={2} className="px-5 py-6 text-center text-xs text-slate-400">No task steps were recorded.</td></tr>}
                                 </tbody>
                               </table>
                             </div>
                           </div>
                         </td>
                       </tr>
                     )}
                     </React.Fragment>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
      )}
    </div>
  );
};
