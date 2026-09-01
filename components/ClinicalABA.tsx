
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { 
  ChevronRight, 
  X, 
  Search, 
  ArrowLeft, 
  Plus, 
  History as HistoryIcon,
  CheckCircle2,
  XCircle,
  Activity,
  AlertTriangle,
  AlertCircle,
  Brain,
  Save,
  Loader2,
  Play,
  ClipboardList,
  Target,
  Clock,
  Zap,
  Info,
  Users
} from 'lucide-react';
import { MilestoneRecord } from '../types';

const calculateAgeMonths = (dob: string) => {
  if (!dob) return 0;
  const d = new Date(dob);
  const now = new Date();
  return (now.getFullYear() - d.getFullYear()) * 12 + (now.getMonth() - d.getMonth());
};

const formatStudentAge = (months: number) => {
  if (months < 12) return `${months} Month${months === 1 ? '' : 's'} Old`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return `${years} Year${years === 1 ? '' : 's'}${remainingMonths ? ` ${remainingMonths} Month${remainingMonths === 1 ? '' : 's'}` : ''} Old`;
};

// Helper to format age groups into Months (<=11m) and Years (>11m)
export const formatStageLabel = (template: { minAge?: number; maxAge?: number; label: string }) => {
  if (template.maxAge !== undefined) {
    if (template.maxAge <= 11) {
      return `${template.minAge || 1} to ${template.maxAge} Months`;
    }
    const minYears = Math.floor((template.minAge || 12) / 12);
    const maxYears = Math.ceil(template.maxAge / 12);
    if (minYears === maxYears) return `${minYears} Year${minYears > 1 ? 's' : ''}`;
    return `${minYears} to ${maxYears} Years`;
  }
  const mMatch = template.label.match(/(\d+)\s*(?:to|-)\s*(\d+)\s*Months/i);
  if (mMatch) {
    const minM = parseInt(mMatch[1]);
    const maxM = parseInt(mMatch[2]);
    if (maxM <= 11) {
      return `${minM} to ${maxM} Months`;
    }
    const minYears = Math.floor(minM / 12);
    const maxYears = Math.ceil(maxM / 12);
    return `${minYears} to ${maxYears} Years`;
  }
  return template.label;
};

// Distinct stage color palettes for cards
const STAGE_THEMES = [
  { bg: 'bg-blue-50/90 dark:bg-blue-950/40', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-200', iconBg: 'bg-blue-500 text-white', badge: 'bg-blue-100 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300' },
  { bg: 'bg-purple-50/90 dark:bg-purple-950/40', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-200', iconBg: 'bg-purple-500 text-white', badge: 'bg-purple-100 dark:bg-purple-900/60 text-purple-800 dark:text-purple-300' },
  { bg: 'bg-pink-50/90 dark:bg-pink-950/40', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-900 dark:text-pink-200', iconBg: 'bg-pink-500 text-white', badge: 'bg-pink-100 dark:bg-pink-900/60 text-pink-800 dark:text-pink-300' },
  { bg: 'bg-cyan-50/90 dark:bg-cyan-950/40', border: 'border-cyan-200 dark:border-cyan-800', text: 'text-cyan-900 dark:text-cyan-200', iconBg: 'bg-cyan-500 text-white', badge: 'bg-cyan-100 dark:bg-cyan-900/60 text-cyan-800 dark:text-cyan-300' },
  { bg: 'bg-amber-50/90 dark:bg-amber-950/40', border: 'border-amber-200 dark:border-amber-800', text: 'text-amber-900 dark:text-amber-200', iconBg: 'bg-amber-500 text-white', badge: 'bg-amber-100 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300' },
  { bg: 'bg-emerald-50/90 dark:bg-emerald-950/40', border: 'border-emerald-200 dark:border-emerald-800', text: 'text-emerald-900 dark:text-emerald-200', iconBg: 'bg-emerald-500 text-white', badge: 'bg-emerald-100 dark:bg-emerald-900/60 text-emerald-800 dark:text-emerald-300' },
  { bg: 'bg-indigo-50/90 dark:bg-indigo-950/40', border: 'border-indigo-200 dark:border-indigo-800', text: 'text-indigo-900 dark:text-indigo-200', iconBg: 'bg-indigo-500 text-white', badge: 'bg-indigo-100 dark:bg-indigo-900/60 text-indigo-800 dark:text-indigo-300' },
];

export const ClinicalABA: React.FC = () => {
  const { students, staff, user, selectedStudentIdForLog, setSelectedStudentIdForLog, saveMilestoneRecord, milestoneRecords, milestoneTemplates } = useStore();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState<'new' | 'history'>('history'); 
  const [activeTemplateId, setActiveTemplateId] = useState<string | null>(null);
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [checkedFlags, setCheckedFlags] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);
  const [viewingRecord, setViewingRecord] = useState<MilestoneRecord | null>(null);

  const teacherName = user?.name || 'Prominance Magara';
  const isSpecialist = user?.role === 'SPECIALIST';
  const isSupport = user?.role === 'ADMIN_SUPPORT';
  const isRestrictedRole = user?.role === 'PARENT' || user?.role === 'STUDENT';

  useEffect(() => {
    if (isRestrictedRole) {
      setActiveTab('history');
    }
  }, [isRestrictedRole]);

  useEffect(() => {
    if (selectedStudentIdForLog && !isRestrictedRole) {
      setActiveTab('new');
    }
  }, [selectedStudentIdForLog]);

  const availableStudents = useMemo(() => {
    return students.filter(s => {
      if (isSpecialist || isSupport) {
        const staffProfile = staff.find(st => st.id === user?.id);
        if (staffProfile && staffProfile.assignedClasses && staffProfile.assignedClasses.length > 0) {
          if (!staffProfile.assignedClasses.includes(s.assignedClass)) return false;
        }
      }
      return true;
    });
  }, [students, isSpecialist, isSupport, user, staff]);

  const filteredStudents = useMemo(() => {
    const query = searchTerm.toLowerCase();
    return availableStudents.filter(s => s.fullName.toLowerCase().includes(query) || s.id.toLowerCase().includes(query));
  }, [availableStudents, searchTerm]);

  const selectedStudent = students.find(s => s.id === selectedStudentIdForLog);
  const activeTemplate = milestoneTemplates.find(t => t.id === activeTemplateId);
  const studentAgeMonths = selectedStudent ? calculateAgeMonths(selectedStudent.dob) : 0;
  const selectedStudentIndex = selectedStudent ? availableStudents.findIndex(s => s.id === selectedStudent.id) : -1;
  const previousStudent = selectedStudentIndex > 0 ? availableStudents[selectedStudentIndex - 1] : undefined;
  const nextStudent = selectedStudentIndex >= 0 ? availableStudents[selectedStudentIndex + 1] : undefined;

  const openStudent = (studentId: string) => {
    setSelectedStudentIdForLog(studentId);
    setActiveTemplateId(null);
    setCheckedItems(new Set());
    setCheckedFlags(new Set());
    setActiveTab('new');
  };

  const goToPreviousStudent = () => {
    if (previousStudent) openStudent(previousStudent.id);
  };

  const goToNextStudent = () => {
    if (nextStudent) openStudent(nextStudent.id);
  };

  const sortedTemplates = useMemo(() => {
    return [...milestoneTemplates].sort((a, b) => a.minAge - b.minAge);
  }, [milestoneTemplates]);

  const history = useMemo(() => {
    return (milestoneRecords || [])
      .filter(r => r.studentId === selectedStudentIdForLog)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [milestoneRecords, selectedStudentIdForLog]);

  const handleSave = async () => {
    if (isRestrictedRole || !selectedStudent || !activeTemplate) return;
    setIsSaving(true);
    try {
      const sections = activeTemplate.sections.map((s, sIdx) => ({
        title: s.title,
        items: s.items.map((text, iIdx) => ({
          id: `${sIdx}-${iIdx}`,
          text,
          checked: checkedItems.has(`${sIdx}-${iIdx}`)
        }))
      }));

      const redFlags = (activeTemplate.redFlags || []).map((text, idx) => ({
        id: `flag-${idx}`,
        text,
        checked: checkedFlags.has(`flag-${idx}`)
      }));

      const totalItems = sections.reduce((acc, s) => acc + s.items.length, 0);
      const checkedCount = checkedItems.size;

      await saveMilestoneRecord({
        studentId: selectedStudent.id,
        ageCategory: formatStageLabel(activeTemplate),
        sections,
        redFlags,
        overallPercentage: Math.round((checkedCount / (totalItems || 1)) * 100)
      });
      
      setActiveTemplateId(null);
      setCheckedItems(new Set());
      setCheckedFlags(new Set());
      setActiveTab('history');
    } finally {
      setIsSaving(false);
    }
  };

  const toggleItem = (id: string) => {
    const next = new Set(checkedItems);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedItems(next);
  };

  const toggleFlag = (id: string) => {
    const next = new Set(checkedFlags);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setCheckedFlags(next);
  };

  const calculateProgress = () => {
    if (!activeTemplate) return 0;
    const totalItems = activeTemplate.sections.reduce((acc, s) => acc + s.items.length, 0);
    return Math.round((checkedItems.size / (totalItems || 1)) * 100);
  };

  const [studentListPage, setStudentListPage] = useState(1);
  const studentPageSize = 8;
  const totalStudentPages = Math.max(1, Math.ceil(filteredStudents.length / studentPageSize));
  const paginatedStudents = filteredStudents.slice((studentListPage - 1) * studentPageSize, studentListPage * studentPageSize);

  if (!selectedStudent) {
    return (
      <div className="w-full min-h-[calc(100vh-72px)] flex flex-col justify-between animate-in fade-in duration-500 font-sans">
        <div className="flex-1 flex flex-col">
          {/* Table Toolbar Header directly on page */}
          <div className="px-6 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-950">
            <div className="flex items-center gap-2">
              <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
                Select Student to Assess
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
                  <th className="py-3.5 px-5 font-semibold">Learner Name</th>
                  <th className="py-3.5 px-5 font-semibold">Class Group</th>
                  <th className="py-3.5 px-5 font-semibold">Age (Months / Years)</th>
                  <th className="py-3.5 px-5 font-semibold">Total Assessments</th>
                  <th className="py-3.5 px-5 font-semibold">Evaluation Status</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No learners found matching the query.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map(student => {
                    const studentChecks = (milestoneRecords || []).filter(r => r.studentId === student.id);
                    const ageMos = calculateAgeMonths(student.dob);
                    const ageFormatted = ageMos > 11 ? `${Math.floor(ageMos / 12)}y ${ageMos % 12}m (${ageMos}m)` : `${ageMos} Months`;
                    
                    return (
                      <tr 
                        key={student.id} 
                        className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                        onClick={() => setSelectedStudentIdForLog(student.id)}
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

                        <td className="py-4 px-5 font-mono text-[11px] text-slate-600 dark:text-slate-300">
                          {ageFormatted}
                        </td>

                        <td className="py-4 px-5">
                          <span className="font-semibold text-slate-900 dark:text-white">
                            {studentChecks.length} checks recorded
                          </span>
                        </td>

                        <td className="py-4 px-5">
                          {studentChecks.length > 0 ? (
                            <span className="px-2.5 py-1 rounded-[9px] text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                              Evaluated
                            </span>
                          ) : (
                            <span className="px-2.5 py-1 rounded-[9px] text-[10px] font-bold border bg-amber-50 text-amber-600 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900">
                              Pending Check
                            </span>
                          )}
                        </td>

                        <td className="py-4 px-5 text-right">
                          <button 
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedStudentIdForLog(student.id);
                            }}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[9px] text-[11px] font-bold transition-all shadow-sm flex items-center gap-1 ml-auto"
                          >
                            Assess <ChevronRight size={13} />
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
      {/* Flat student header, matching the student details page. */}
      <header className="flex flex-col justify-between gap-5 border-b border-slate-200 bg-white px-5 py-5 sm:px-6 md:flex-row md:items-center md:px-8 dark:border-slate-800 dark:bg-slate-950">
        <div className="flex flex-col items-start gap-2">
          <button 
            onClick={() => { setSelectedStudentIdForLog(null); setActiveTemplateId(null); setActiveTab('history'); }}
            className="p-1 text-slate-400 transition-colors hover:text-blue-600 dark:hover:text-blue-400"
            title="Back to student list"
          >
            <ArrowLeft size={19} />
          </button>
          <div>
            <h1 className="text-xl font-bold leading-none tracking-tight text-slate-900 dark:text-white md:text-2xl">
              {selectedStudent.fullName}
            </h1>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
              <Clock size={12} className="text-blue-500" />
              {formatStudentAge(calculateAgeMonths(selectedStudent.dob))} • {selectedStudent.assignedClass}
            </p>
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-2">
          <div className="flex rounded-[9px] border border-slate-200 bg-slate-100 p-1 dark:border-slate-800 dark:bg-slate-900">
            {!isRestrictedRole && (
              <button
                onClick={() => { setActiveTab('new'); setActiveTemplateId(null); setViewingRecord(null); }}
                className={`flex items-center gap-2 px-5 py-2 rounded-[9px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'new' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
              >
                <Plus size={14} /> New Check
              </button>
            )}
            <button
              onClick={() => { setActiveTab('history'); setActiveTemplateId(null); setViewingRecord(null); }}
              className={`flex items-center gap-2 px-5 py-2 rounded-[9px] text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'history' ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-300'}`}
            >
              <HistoryIcon size={14} /> Past Checks
            </button>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={goToPreviousStudent}
              disabled={!previousStudent}
              className="flex items-center justify-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title={previousStudent ? `Open ${previousStudent.fullName}` : 'This is the first student'}
            >
              <ArrowLeft size={13} /> Previous student
            </button>
            <button
              type="button"
              onClick={goToNextStudent}
              disabled={!nextStudent}
              className="flex items-center justify-center gap-1.5 rounded-[9px] border border-slate-200 bg-white px-3 py-2 text-[9px] font-bold uppercase tracking-wider text-slate-600 transition-colors hover:border-blue-300 hover:text-blue-600 disabled:cursor-not-allowed disabled:opacity-40 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              title={nextStudent ? `Open ${nextStudent.fullName}` : 'This is the last student'}
            >
              Next student <ChevronRight size={13} />
            </button>
          </div>
        </div>
      </header>

      {activeTab === 'history' ? (
        viewingRecord ? (
          <div className="w-full bg-white animate-in fade-in duration-300 dark:bg-slate-950">
            <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-6 py-5 sm:flex-row sm:items-center md:px-8 dark:border-slate-800">
              <div className="flex items-center gap-3">
                <button onClick={() => setViewingRecord(null)} className="p-1 text-slate-400 transition-colors hover:text-blue-600" title="Back to past checks">
                  <ArrowLeft size={19} />
                </button>
                <div>
                  <p className="text-[9px] font-bold uppercase tracking-[0.18em] text-blue-600">Completed assessment</p>
                  <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">{viewingRecord.ageCategory}</h2>
                  <p className="mt-1 text-[10px] font-medium text-slate-400">
                    {new Date(viewingRecord.timestamp).toLocaleString()} • {staff.find(s => s.id === viewingRecord.staffId)?.fullName || teacherName}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-[9px] border border-blue-200 bg-blue-50 px-4 py-2 text-blue-600 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-400">
                <Target size={15} />
                <span className="font-mono text-lg font-black">{viewingRecord.overallPercentage}%</span>
              </div>
            </div>

            {viewingRecord.sections.map((section, sectionIndex) => (
              <section key={`${section.title}-${sectionIndex}`} className="border-b border-slate-200 dark:border-slate-800">
                <div className="flex items-center justify-between bg-slate-50/80 px-6 py-3 md:px-8 dark:bg-slate-800/50">
                  <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-slate-700 dark:text-slate-200">{section.title}</h3>
                  <span className="text-[10px] font-medium text-slate-400">{section.items.filter(item => item.checked).length} of {section.items.length} achieved</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[620px] text-left">
                    <thead>
                      <tr className="border-y border-slate-100 bg-white text-[9px] font-semibold uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900">
                        <th className="w-20 px-8 py-3">No.</th>
                        <th className="px-4 py-3">Checklist item</th>
                        <th className="px-8 py-3 text-right">Result</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                      {section.items.map((item, itemIndex) => (
                        <tr key={item.id || `${sectionIndex}-${itemIndex}`}>
                          <td className="px-8 py-4 font-mono text-[10px] font-bold text-slate-400">{(itemIndex + 1).toString().padStart(2, '0')}</td>
                          <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200">{item.text}</td>
                          <td className="px-8 py-4 text-right">
                            <span className={`inline-flex items-center gap-1.5 rounded-[9px] border px-3 py-1 text-[9px] font-bold ${item.checked ? 'border-emerald-200 bg-emerald-50 text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'}`}>
                              {item.checked ? <CheckCircle2 size={11} /> : <XCircle size={11} />}
                              {item.checked ? 'Achieved' : 'Not achieved'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </section>
            ))}

            <section>
              <div className="flex items-center justify-between bg-rose-50/70 px-6 py-3 md:px-8 dark:bg-rose-950/20">
                <h3 className="text-[11px] font-bold uppercase tracking-[0.14em] text-rose-600">Developmental warning signs</h3>
                <span className="text-[10px] font-medium text-rose-400">{viewingRecord.redFlags.filter(flag => flag.checked).length} observed</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[620px] text-left">
                  <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                    {viewingRecord.redFlags.length === 0 ? (
                      <tr><td className="px-8 py-8 text-center text-slate-400">No warning signs were included in this assessment.</td></tr>
                    ) : viewingRecord.redFlags.map((flag, flagIndex) => (
                      <tr key={flag.id || `flag-${flagIndex}`}>
                        <td className="w-20 px-8 py-4 font-mono text-[10px] font-bold text-slate-400">{(flagIndex + 1).toString().padStart(2, '0')}</td>
                        <td className="px-4 py-4 font-medium text-slate-800 dark:text-slate-200">{flag.text}</td>
                        <td className="px-8 py-4 text-right">
                          <span className={`inline-flex rounded-[9px] border px-3 py-1 text-[9px] font-bold ${flag.checked ? 'border-rose-200 bg-rose-50 text-rose-600 dark:border-rose-900 dark:bg-rose-950/30' : 'border-slate-200 bg-slate-50 text-slate-400 dark:border-slate-700 dark:bg-slate-800'}`}>
                            {flag.checked ? 'Observed' : 'Not observed'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
        ) : (
        <div className="w-full overflow-hidden bg-white dark:bg-slate-950">
           <div className="overflow-x-auto">
             <table className="w-full text-left">
                <thead className="bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 text-slate-900 dark:text-white font-black uppercase text-[10px] tracking-widest">
                   <tr>
                      <th className="px-8 py-5">Date</th>
                      <th className="px-8 py-5">Developmental Stage</th>
                      <th className="px-8 py-5">Teacher</th>
                      <th className="px-8 py-5 text-center">Score</th>
                      <th className="px-8 py-5 text-right">View</th>
                   </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                   {history.length === 0 ? (
                     <tr><td colSpan={5} className="px-8 py-20 text-center text-xs font-bold text-slate-400 uppercase italic tracking-widest">No past checklist evaluations recorded yet.</td></tr>
                   ) : history.map(record => (
                     <tr 
                      key={record.id} 
                      className="hover:bg-slate-50 dark:hover:bg-blue-900/10 transition-colors cursor-pointer group"
                      onClick={() => setViewingRecord(record)}
                     >
                        <td className="px-8 py-6 font-mono font-bold text-xs dark:text-white">{new Date(record.timestamp).toLocaleDateString()}</td>
                        <td className="px-8 py-6 uppercase font-black text-[11px] text-slate-700 dark:text-slate-200">{record.ageCategory}</td>
                        <td className="px-8 py-6 text-[10px] font-bold text-slate-500 uppercase">{staff.find(s => s.id === record.staffId)?.fullName || teacherName}</td>
                        <td className="px-8 py-6 text-center">
                           <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-[9px] border border-blue-100 dark:border-blue-800">
                              <Target size={14} />
                              <span className="font-black font-mono text-base">{record.overallPercentage}%</span>
                           </div>
                        </td>
                        <td className="px-8 py-6 text-right"><ChevronRight size={18} className="ml-auto text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" /></td>
                     </tr>
                   ))}
                </tbody>
             </table>
           </div>
        </div>
        )
      ) : activeTemplateId ? (
        <div className="mt-6 grid min-h-[calc(100vh-190px)] grid-cols-1 border-y border-slate-200 bg-white animate-in fade-in duration-300 lg:grid-cols-12 dark:border-slate-800 dark:bg-slate-900">
           <main className="space-y-6 p-5 sm:p-6 lg:col-span-9 lg:p-8">
              <div className="relative overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
                 <div className="p-7 md:p-8 border-b border-slate-100 dark:border-slate-800 flex flex-col md:flex-row items-center justify-between gap-6 bg-slate-50/50 dark:bg-slate-950/20">
                    <div className="flex items-center gap-5">
                       <div className="w-14 h-14 bg-blue-600 text-white rounded-[9px] flex items-center justify-center shadow-sm">
                          <ClipboardList size={26} />
                       </div>
                       <div>
                          <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600 mb-1.5 block">Active Evaluation</h3>
                          <h4 className="text-2xl font-black uppercase tracking-tight dark:text-white leading-none">
                            {formatStageLabel(activeTemplate!)}
                          </h4>
                       </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setActiveTemplateId(null)}
                      className="flex items-center gap-2 rounded-[9px] border border-slate-200 bg-white px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-slate-500 transition-colors hover:text-slate-900 dark:border-slate-800 dark:bg-slate-950 dark:hover:text-white"
                    >
                      <ArrowLeft size={14} /> Checklist list
                    </button>
                 </div>

                 <div className="p-0 space-y-0">
                    {activeTemplate?.sections.map((section, sIdx) => (
                      <div key={section.title} className="group">
                         <div className="bg-slate-100/70 dark:bg-slate-800/80 px-8 py-3.5 flex items-center justify-between border-b border-slate-200 dark:border-slate-700">
                            <h5 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-300">{section.title}</h5>
                            <span className="text-[10px] font-bold text-slate-400 uppercase">{section.items.length} Goals</span>
                         </div>
                         <div className="overflow-x-auto">
                            <table className="w-full text-left border-collapse">
                               <thead>
                                  <tr className="bg-slate-50 dark:bg-slate-900 border-b border-slate-100 dark:border-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-400">
                                     <th className="px-8 py-3 w-16">No.</th>
                                     <th className="px-4 py-3">Description</th>
                                     <th className="px-8 py-3 text-right">Status</th>
                                  </tr>
                               </thead>
                               <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                  {section.items.map((item, iIdx) => {
                                     const id = `${sIdx}-${iIdx}`;
                                     const isChecked = checkedItems.has(id);
                                     return (
                                       <tr 
                                        key={id} 
                                        onClick={() => toggleItem(id)}
                                        className={`group/row cursor-pointer transition-colors ${isChecked ? 'bg-emerald-50/40 dark:bg-emerald-950/20' : 'hover:bg-slate-50 dark:hover:bg-slate-800/40'}`}
                                       >
                                          <td className="px-8 py-4 font-mono text-[10px] font-bold text-slate-400">{(iIdx + 1).toString().padStart(2, '0')}</td>
                                          <td className={`px-4 py-4 text-xs font-bold leading-relaxed ${isChecked ? 'text-emerald-700 dark:text-emerald-400' : 'text-slate-800 dark:text-slate-200'}`}>
                                             {item}
                                          </td>
                                          <td className="px-8 py-4 text-right">
                                             <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-[9px] text-[9px] font-black uppercase border transition-all ${isChecked ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm' : 'bg-white dark:bg-slate-900 border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-400'}`}>
                                                {isChecked ? <CheckCircle2 size={12} /> : <div className="w-3 h-3 rounded-[3px] border border-slate-300 dark:border-slate-600" />}
                                                {isChecked ? 'Passed' : 'Pending'}
                                             </div>
                                          </td>
                                       </tr>
                                     );
                                  })}
                               </tbody>
                            </table>
                         </div>
                      </div>
                    ))}

                    {activeTemplate?.redFlags && activeTemplate.redFlags.length > 0 && (
                      <div className="bg-rose-50/50 dark:bg-rose-950/20 p-8 space-y-6 border-t border-rose-100 dark:border-rose-900/30">
                         <div className="flex items-center justify-between border-b border-rose-200/60 dark:border-rose-800 pb-4">
                            <h5 className="text-lg font-black uppercase tracking-tight text-rose-600 flex items-center gap-2.5">
                               <AlertTriangle size={20} /> Developmental Warning Signs
                            </h5>
                            <span className="text-[9px] font-black uppercase bg-rose-600 text-white px-3 py-1 rounded-[9px] shadow-sm">Observation</span>
                         </div>
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                            {activeTemplate.redFlags.map((flag, idx) => {
                               const id = `flag-${idx}`;
                               const isChecked = checkedFlags.has(id);
                               return (
                                 <button 
                                  key={id} 
                                  onClick={() => toggleFlag(id)}
                                  className={`flex items-start gap-3.5 p-4 rounded-[9px] border transition-all text-left ${isChecked ? 'bg-white dark:bg-slate-800 border-rose-500 shadow-sm' : 'bg-white/60 dark:bg-slate-900 border-dashed border-rose-200 dark:border-rose-800'}`}
                                 >
                                    <div className={`mt-0.5 w-5 h-5 rounded-[5px] border flex items-center justify-center shrink-0 transition-all ${isChecked ? 'bg-rose-600 border-rose-600 text-white' : 'bg-white dark:bg-slate-800 border-rose-300 dark:border-rose-700'}`}>
                                       {isChecked && <X size={12} strokeWidth={3} />}
                                    </div>
                                    <span className={`text-xs font-bold leading-relaxed ${isChecked ? 'text-rose-700 dark:text-rose-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                      {flag}
                                    </span>
                                 </button>
                               );
                            })}
                         </div>
                      </div>
                    )}
                 </div>
              </div>
           </main>

           <aside className="border-t border-slate-200 bg-slate-50/80 lg:col-span-3 lg:border-l lg:border-t-0 dark:border-slate-800 dark:bg-slate-950/70">
              <div className="sticky top-0 space-y-6 p-6 lg:p-7">
                 <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
                    <div className="w-10 h-10 rounded-[9px] bg-blue-50 dark:bg-blue-900/30 text-blue-600 flex items-center justify-center">
                       <Brain size={20} />
                    </div>
                    <div>
                       <h3 className="text-xs font-black uppercase tracking-wider text-slate-900 dark:text-white">Assessment Overview</h3>
                       <p className="text-[10px] text-slate-400 font-bold uppercase">Sync to Parent Records</p>
                    </div>
                 </div>

                 <div className="border-y border-slate-200 py-5 dark:border-slate-800">
                    <p className="mb-1 text-[9px] font-black uppercase tracking-widest text-slate-400">Growth score</p>
                    <div className="flex items-end justify-between gap-4">
                      <p className="font-mono text-4xl font-black text-blue-600">{calculateProgress()}%</p>
                      <Activity size={24} className="mb-1 text-blue-500" />
                    </div>
                 </div>

                 <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                       <span className="font-bold text-slate-500">Tasks Passed</span>
                       <span className="font-black text-emerald-600 dark:text-emerald-400 font-mono">{checkedItems.size} Completed</span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                       <span className="font-bold text-slate-500">Warnings Noted</span>
                       <span className="font-black text-rose-600 dark:text-rose-400 font-mono">{checkedFlags.size} Observed</span>
                    </div>
                 </div>

                 <button 
                   onClick={handleSave}
                   disabled={isSaving}
                   className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-[9px] text-xs font-black uppercase tracking-widest shadow-sm transition-all flex items-center justify-center gap-2.5 disabled:opacity-50 active:scale-95"
                 >
                    {isSaving ? <Loader2 size={16} className="animate-spin" /> : <><Save size={16} /> Save & Record Growth</>}
                 </button>
                 <button 
                   onClick={() => setActiveTemplateId(null)}
                   className="w-full py-3 text-slate-500 hover:text-slate-900 dark:hover:text-white transition-colors text-xs font-bold uppercase tracking-wider"
                 >
                   Cancel Selection
                 </button>
              </div>
           </aside>
        </div>
      ) : (
        <div className="w-full bg-white animate-in fade-in duration-500 dark:bg-slate-950">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
                  <th className="px-5 py-3 font-semibold">Stage</th>
                  <th className="px-5 py-3 font-semibold">Developmental age</th>
                  <th className="px-5 py-3 font-semibold">Categories</th>
                  <th className="px-5 py-3 font-semibold">Check items</th>
                  <th className="px-5 py-3 font-semibold">Age match</th>
                  <th className="px-5 py-3 text-right font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {sortedTemplates.map((template, tIdx) => {
                  const stageTheme = STAGE_THEMES[tIdx % STAGE_THEMES.length];
                  const stageLabel = formatStageLabel(template);
                  const isRecommended = studentAgeMonths >= template.minAge && studentAgeMonths <= template.maxAge;
                  const itemCount = template.sections.reduce((total, section) => total + section.items.length, 0);

                  return (
                    <tr
                      key={template.id}
                      onClick={() => { setActiveTemplateId(template.id); setCheckedItems(new Set()); setCheckedFlags(new Set()); }}
                      className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50"
                    >
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-lg font-black leading-none ${stageTheme.iconBg}`}>
                            {(tIdx + 1).toString().padStart(2, '0')}
                          </div>
                          <span className="font-bold text-slate-900 dark:text-white">Stage {(tIdx + 1).toString().padStart(2, '0')}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{stageLabel}</td>
                      <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{template.sections.length} categories</td>
                      <td className="px-5 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{itemCount} items</td>
                      <td className="px-5 py-4">
                        {isRecommended ? (
                          <span className="inline-flex items-center gap-1 rounded-[9px] border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[9px] font-bold text-emerald-600 dark:border-emerald-900 dark:bg-emerald-950/30 dark:text-emerald-400"><Zap size={10} fill="currentColor" /> Recommended</span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400">Available</span>
                        )}
                      </td>
                      <td className="px-5 py-4 text-right">
                        <button className="ml-auto inline-flex items-center gap-1 rounded-[9px] bg-blue-600 px-3 py-1.5 text-[10px] font-bold text-white transition-colors hover:bg-blue-700">Start check <ChevronRight size={12} /></button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
