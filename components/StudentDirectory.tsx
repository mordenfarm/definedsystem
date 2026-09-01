
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  Search, ChevronRight, X, LayoutGrid, List, 
  Trash2, Edit2, ArrowLeft, Loader2, Save, History, Image as ImageIcon
} from 'lucide-react';
import { Student, Role } from '../types';
import { PersonalInfo } from './student-profile/PersonalInfo';
import { HealthRecord } from './student-profile/HealthRecord';
import { PerformanceMatrix } from './student-profile/PerformanceMatrix';
import { PaymentLedger } from './student-profile/PaymentLedger';
import { SecurityRecord } from './student-profile/SecurityRecord';

const STUDENT_COLORS = [
  { bg: 'bg-blue-600', row: 'bg-blue-50', text: 'text-white', border: 'border-blue-900', accent: 'border-blue-600', dark: 'dark:bg-blue-900/40' },
  { bg: 'bg-emerald-600', row: 'bg-emerald-50', text: 'text-white', border: 'border-emerald-900', accent: 'border-emerald-600', dark: 'dark:bg-emerald-900/40' },
  { bg: 'bg-rose-600', row: 'bg-rose-50', text: 'text-white', border: 'border-rose-900', accent: 'border-rose-600', dark: 'dark:bg-rose-900/40' },
  { bg: 'bg-amber-600', row: 'bg-amber-50', text: 'text-white', border: 'border-amber-900', accent: 'border-amber-600', dark: 'dark:bg-amber-900/40' },
  { bg: 'bg-purple-600', row: 'bg-purple-50', text: 'text-white', border: 'border-purple-900', accent: 'border-purple-600', dark: 'dark:bg-purple-900/40' },
  { bg: 'bg-cyan-600', row: 'bg-cyan-50', text: 'text-white', border: 'border-cyan-900', accent: 'border-cyan-600', dark: 'dark:bg-cyan-900/40' },
];

const getStudentColor = (id: string) => {
  const index = id.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % STUDENT_COLORS.length;
  return STUDENT_COLORS[index];
};

export const StudentDirectory: React.FC = () => {
  const { students, staff, updateStudent, deleteStudent, settings, user, clinicalLogs, milestoneRecords, parents, payments } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [activeProfileTab, setActiveProfileTab] = useState<'personal' | 'health' | 'records' | 'payments' | 'security'>('personal');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Student>>({});
  const [detailRecordDay, setDetailRecordDay] = useState<string | null>(null); 
  const [activeDetailTab, setActiveDetailTab] = useState<'Lesson Notes' | 'Growth Checks'>('Lesson Notes');
  const [timeFilter, setTimeFilter] = useState<'Weekly' | 'Bi-weekly' | 'Monthly' | 'Yearly'>('Weekly');
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [isAddModalClosing, setIsAddModalClosing] = useState(false);
  const [studentImageName, setStudentImageName] = useState('');
  const [newStudent, setNewStudent] = useState<Partial<Student>>({
    firstName: '',
    lastName: '',
    dob: '',
    gender: 'Male',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    homeAddress: '',
    diagnosis: '',
    medicalRecords: '',
    socialHistory: '',
    targetBehaviors: '',
    uniformSizes: '',
    assignedClass: '',
    assignedStaffId: '',
    imageUrl: '',
    enrollmentDate: new Date().toISOString().split('T')[0]
  });

  const { addStudent } = useStore();
  const [isAdding, setIsAdding] = useState(false);

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const isParent = user?.role === 'PARENT';
  const isSpecialist = user?.role === 'SPECIALIST';
  const isSupport = user?.role === 'ADMIN_SUPPORT';
  const borderClass = "border-slate-300 dark:border-slate-800";
  const googleInput = "w-full px-5 py-4 bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 rounded-[15px] text-sm font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 transition-all shadow-sm";
  const googleLabel = "text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300 ml-1";
  const googleSection = "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[15px] p-5 md:p-6 shadow-sm space-y-6";
  const googleStepBadge = "text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-[15px] border border-blue-100 dark:border-blue-800";

  const myStudents = useMemo(() => {
    if (isParent) {
      const parentProfile = parents.find(p => p.firebaseUid === user?.id);
      return parentProfile ? students.filter(s => s.id === parentProfile.studentId) : [];
    }

    if (isSpecialist || isSupport) {
      const staffProfile = staff.find(st => st.id === user?.id);
      if (staffProfile && staffProfile.assignedClasses) {
        return students.filter(s => staffProfile.assignedClasses.includes(s.assignedClass));
      }
    }

    return students;
  }, [students, user, isParent, parents, isSpecialist, isSupport, staff]);

  const studentPerformance = useMemo(() => {
    if (!selectedStudent) return { analysis: [], milestones: [] };
    return {
      analysis: clinicalLogs.filter(l => l.studentId === selectedStudent.id),
      milestones: milestoneRecords.filter(m => m.studentId === selectedStudent.id)
    };
  }, [selectedStudent, clinicalLogs, milestoneRecords]);

  const selectedStudentPayments = useMemo(() => {
    if (!selectedStudent) return [];
    return payments
      .filter(payment => payment.studentId === selectedStudent.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }, [payments, selectedStudent]);

  const handleSaveEdit = async () => {
    if (!selectedStudent || !selectedStudent.firebaseUid || isSaving) return;
    setIsSaving(true);
    try {
      await updateStudent(selectedStudent.firebaseUid, editForm);
      setSelectedStudent({ ...selectedStudent, ...editForm } as Student);
      setIsEditing(false);
    } catch(e) {
      // The store displays the update error to the user.
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent || !selectedStudent.firebaseUid) return;
    if (confirm(`Are you sure you want to PERMANENTLY remove ${selectedStudent.fullName}? this cannot be undone.`)) {
      setIsDeleting(true);
      try {
        await deleteStudent(selectedStudent.firebaseUid);
        setSelectedStudent(null);
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleAddStudent = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsAdding(true);
    try {
      await addStudent(newStudent as Student);
      closeAddStudentForm(true);
      setNewStudent({
        firstName: '',
        lastName: '',
        dob: '',
        gender: 'Male',
        parentName: '',
        parentPhone: '',
        parentEmail: '',
        homeAddress: '',
        diagnosis: '',
        medicalRecords: '',
        socialHistory: '',
        targetBehaviors: '',
        uniformSizes: '',
        assignedClass: '',
        assignedStaffId: '',
        imageUrl: '',
        enrollmentDate: new Date().toISOString().split('T')[0]
      });
      setStudentImageName('');
    } catch (err) {
      console.error(err);
    } finally {
      setIsAdding(false);
    }
  };

  function openAddStudentForm() {
    setIsAddModalClosing(false);
    setShowAddModal(true);
  }

  function closeAddStudentForm(force = false) {
    if (isAdding && !force) return;
    setIsAddModalClosing(true);
    window.setTimeout(() => {
      setShowAddModal(false);
      setIsAddModalClosing(false);
    }, 180);
  }

  function handleStudentImageSelect(file?: File) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setNewStudent(prev => ({ ...prev, imageUrl: String(reader.result || '') }));
      setStudentImageName(file.name);
    };
    reader.readAsDataURL(file);
  }

  const [statusFilter, setStatusFilter] = useState('All');
  const [classFilter, setClassFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 8;

  const filteredStudents = useMemo(() => {
    return (myStudents || []).filter(s => {
      const matchSearch = s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          s.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (s.parentPhone && s.parentPhone.includes(searchTerm));
      const matchClass = classFilter === 'All' || s.assignedClass === classFilter;
      return matchSearch && matchClass;
    });
  }, [myStudents, searchTerm, classFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStudents.length / pageSize));
  const paginatedStudents = filteredStudents.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="w-full min-h-[calc(100vh-72px)] flex flex-col justify-between animate-in fade-in duration-500 font-sans">
      <div className={`${selectedStudent ? 'hidden' : 'flex'} flex-1 flex-col`}>
        {/* Table Toolbar Header directly on page */}
        <div className="px-6 md:px-8 py-4 border-b border-slate-200 dark:border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-3 bg-white dark:bg-slate-950">
        <div className="flex items-center gap-2">
          <h2 className="text-sm md:text-base font-bold text-slate-800 dark:text-white">
            {filteredStudents.length} All Students
          </h2>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] text-xs font-medium text-slate-900 dark:text-white outline-none focus:border-blue-600"
            />
          </div>

          {/* Class Filter Dropdown */}
          <select
            value={classFilter}
            onChange={e => setClassFilter(e.target.value)}
            className="px-3 py-1.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[9px] text-xs font-medium text-slate-700 dark:text-slate-200 outline-none cursor-pointer"
          >
            <option value="All">All Status</option>
            {settings.classes.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          {/* View Mode Toggle */}
          <div className="flex items-center bg-slate-100 dark:bg-slate-900 p-0.5 rounded-[9px] border border-slate-200 dark:border-slate-800">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-[7px] transition-all ${
                viewMode === 'table' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'
              }`}
              title="Table View"
            >
              <List size={15} />
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`p-1.5 rounded-[7px] transition-all ${
                viewMode === 'cards' ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-400'
              }`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
          </div>

          {isAdmin && (
            <button
              onClick={openAddStudentForm}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-[9px] text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 shrink-0"
            >
              + Add Student
            </button>
          )}
        </div>
      </div>

        {/* Table Content */}
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-400 border-b border-slate-100 dark:border-slate-800">
                  <th className="py-3.5 px-5 font-semibold">Student ID</th>
                  <th className="py-3.5 px-5 font-semibold">Student Name</th>
                  <th className="py-3.5 px-5 font-semibold">Assigned Class</th>
                  <th className="py-3.5 px-5 font-semibold">DOB / Age</th>
                  <th className="py-3.5 px-5 font-semibold">Guardian Contact</th>
                  <th className="py-3.5 px-5 font-semibold">Status</th>
                  <th className="py-3.5 px-5 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                {paginatedStudents.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400 font-medium">
                      No students found matching the query.
                    </td>
                  </tr>
                ) : (
                  paginatedStudents.map(student => (
                    <tr
                      key={student.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/50 transition-colors cursor-pointer"
                      onClick={() => {
                        setSelectedStudent(student);
                        setEditForm(student);
                        setIsEditing(false);
                      }}
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

                      <td className="py-4 px-5 text-slate-500 font-mono text-[11px]">
                        {student.dob || 'N/A'}
                      </td>

                      <td className="py-4 px-5 text-slate-600 dark:text-slate-300">
                        <p className="font-medium text-slate-900 dark:text-white">{student.parentName || 'Parent'}</p>
                        <p className="text-[11px] text-slate-400 font-mono">{student.parentPhone || '+263...'}</p>
                      </td>

                      <td className="py-4 px-5">
                        <span className="px-2.5 py-1 rounded-[9px] text-[10px] font-bold border bg-emerald-50 text-emerald-600 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                          Active
                        </span>
                      </td>

                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedStudent(student);
                            setEditForm(student);
                            setIsEditing(false);
                          }}
                          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[9px] transition-colors"
                        >
                          <ChevronRight size={16} />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {paginatedStudents.map(student => (
              <div
                key={student.id}
                onClick={() => {
                  setSelectedStudent(student);
                  setEditForm(student);
                  setIsEditing(false);
                }}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-[9px] p-5 shadow-sm hover:shadow-md hover:border-blue-500 transition-all cursor-pointer flex flex-col justify-between"
              >
                <div className="flex items-center gap-3 mb-4">
                  {student.imageUrl ? (
                    <img
                      src={student.imageUrl}
                      alt={student.fullName}
                      className="w-12 h-12 rounded-full object-cover border border-slate-200 dark:border-slate-700"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-200 font-black flex items-center justify-center text-base">
                      {student.fullName[0]}
                    </div>
                  )}
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white truncate">
                      {student.fullName}
                    </h4>
                    <p className="text-[11px] font-mono text-slate-400">
                      #{student.id}
                    </p>
                  </div>
                </div>

                <div className="space-y-1.5 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div className="flex justify-between text-slate-500">
                    <span>Class</span>
                    <span className="font-semibold text-slate-800 dark:text-slate-200">{student.assignedClass}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Guardian</span>
                    <span className="font-medium text-slate-800 dark:text-slate-200 truncate max-w-[120px]">{student.parentName || 'Parent'}</span>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
                  <span className="px-2 py-0.5 rounded-[9px] text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200">
                    Active
                  </span>
                  <span className="text-xs font-bold text-blue-600 flex items-center gap-1">
                    Profile <ChevronRight size={14} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination Footer at very bottom */}
      <div className={`${selectedStudent ? 'hidden' : 'flex'} mt-auto px-6 md:px-8 py-4 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-950 flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500`}>
        <div>
          Showing <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length > 0 ? (currentPage - 1) * pageSize + 1 : 0}</span> to{' '}
          <span className="font-bold text-slate-900 dark:text-white">
            {Math.min(currentPage * pageSize, filteredStudents.length)}
          </span> of{' '}
          <span className="font-bold text-slate-900 dark:text-white">{filteredStudents.length}</span> results
        </div>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Previous
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              className={`w-8 h-8 rounded-[9px] text-xs font-bold transition-all ${
                currentPage === num
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {num}
            </button>
          ))}
          <button
            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="px-3 py-1.5 rounded-[9px] border border-slate-200 dark:border-slate-700 font-medium hover:bg-slate-50 dark:hover:bg-slate-800 disabled:opacity-40 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>

      {/* Student details stay inside AppShell so the application sidebar remains visible. */}
      {selectedStudent && (() => {
        const totalRecordsCount = studentPerformance.analysis.length + studentPerformance.milestones.length;
        return (
      <div className="min-h-[calc(100vh-72px)] w-full bg-slate-50/40 font-sans animate-in fade-in duration-300 dark:bg-slate-950">
        {/* Breadcrumb Navigation on top */}
        <div className="flex items-center gap-2 border-b border-slate-100 bg-white px-5 py-3 text-xs sm:px-6 md:px-8 dark:border-slate-900 dark:bg-slate-950">
          <button
            onClick={() => setSelectedStudent(null)}
            className="text-slate-400 hover:text-blue-600 transition-colors font-medium"
          >
            Students List
          </button>
          <span className="text-slate-300 dark:text-slate-700">/</span>
          <span className="text-blue-600 dark:text-blue-400 font-semibold">Student Details</span>
        </div>

        {/* Student Profile Hero Header Bar */}
        <div className="flex flex-col justify-between gap-4 border-b border-slate-200 bg-white px-5 py-5 sm:px-6 md:flex-row md:items-center md:px-8 dark:border-slate-800 dark:bg-slate-950">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-100 dark:bg-blue-900/50 border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden flex items-center justify-center font-bold text-lg text-blue-700 dark:text-blue-200 shrink-0">
              {selectedStudent.imageUrl ? (
                <img src={selectedStudent.imageUrl} alt={selectedStudent.fullName} className="w-full h-full object-cover" />
              ) : (
                selectedStudent.fullName[0]
              )}
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base md:text-lg font-bold text-slate-900 dark:text-white">
                  {selectedStudent.fullName}
                </h2>
                <span className="px-2 py-0.5 rounded-[9px] text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-900">
                  Active
                </span>
              </div>
              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400 mt-1 font-medium">
                <span>ID: #{selectedStudent.id}</span>
                <span>•</span>
                <span>{selectedStudent.parentPhone || '+263 775 926 454'}</span>
                <span>•</span>
                <span>Class: {selectedStudent.assignedClass || 'General'}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedStudent(null)}
              className="px-3.5 py-1.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-300 rounded-[9px] text-xs font-semibold transition-all flex items-center gap-1.5"
            >
              <ArrowLeft size={14} />
              <span>Back</span>
            </button>

            {!isParent && isAdmin && (
              <>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3.5 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/30 text-rose-600 border border-rose-200 dark:border-rose-900 rounded-[9px] text-xs font-bold transition-all flex items-center gap-1.5"
                >
                  {isDeleting ? <Loader2 className="animate-spin" size={14} /> : <><Trash2 size={14} /> Delete</>}
                </button>
                <button
                  onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)}
                  disabled={isSaving}
                  className={`px-4 py-1.5 rounded-[9px] transition-all text-xs font-bold shadow-sm ${
                    isEditing ? 'bg-emerald-600 hover:bg-emerald-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'
                  } disabled:cursor-wait disabled:opacity-75`}
                >
                  {isSaving
                    ? <><Loader2 size={14} className="inline mr-1.5 animate-spin" /> Saving...</>
                    : isEditing
                      ? <><Save size={14} className="inline mr-1.5"/> Save Changes</>
                      : <><Edit2 size={14} className="inline mr-1.5"/> Edit Profile</>}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Underline Tabs matching reference screenshot */}
        <div className="no-scrollbar flex gap-7 overflow-x-auto border-b border-slate-200 bg-white px-5 sm:px-6 md:px-8 dark:border-slate-800 dark:bg-slate-950">
          {[
            { id: 'personal', label: 'Identity', count: '03' },
            { id: 'health', label: 'Health', count: '04' },
            { id: 'records', label: 'Progress', count: totalRecordsCount.toString().padStart(2, '0') },
            { id: 'payments', label: 'Billing', count: selectedStudentPayments.length.toString().padStart(2, '0') },
            ...(isAdmin ? [{ id: 'security', label: 'Security', count: '02' }] : [])
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveProfileTab(tab.id as any)}
              className={`py-3.5 text-xs transition-all relative flex items-center gap-2 whitespace-nowrap ${
                activeProfileTab === tab.id
                  ? 'text-blue-600 dark:text-blue-400 font-bold border-b-2 border-blue-600 dark:border-blue-400 -mb-px'
                  : 'text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 font-medium'
              }`}
            >
              <span>{tab.label}</span>
              {tab.count && (
                <span className="px-1.5 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-600 dark:text-slate-300">
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Tab Content Body - Starts near left edge */}
        <div className="w-full px-5 py-6 sm:px-6 md:px-8 md:py-7">
          {activeProfileTab === 'personal' && (
            <PersonalInfo
              student={selectedStudent}
              isEditing={isEditing}
              editForm={editForm}
              setEditForm={setEditForm}
              staff={staff}
              settings={settings}
              isAdmin={isAdmin}
            />
          )}
          {activeProfileTab === 'health' && (
            <HealthRecord
              student={selectedStudent}
              isEditing={isEditing}
              editForm={editForm}
              setEditForm={setEditForm}
              onViewPdf={() => {}}
              onUploadPdf={() => {}}
            />
          )}
          {activeProfileTab === 'records' && (
            <PerformanceMatrix
              student={selectedStudent}
              logs={studentPerformance.analysis}
              milestones={studentPerformance.milestones}
              filter={timeFilter}
              setFilter={setTimeFilter}
              onOpenDay={setDetailRecordDay}
            />
          )}
          {activeProfileTab === 'payments' && (
            <PaymentLedger
              totalPaid={selectedStudent.totalPaid || 0}
              balance={Math.max(0, settings.feesAmount - (selectedStudent.totalPaid || 0))}
              payments={selectedStudentPayments}
            />
          )}
          {activeProfileTab === 'security' && isAdmin && (
            <SecurityRecord
              student={selectedStudent}
              parentEmail={parents.find(parent => parent.studentId === selectedStudent.id)?.email}
              parentPassword={parents.find(parent => parent.studentId === selectedStudent.id)?.password}
              isEditing={isEditing}
              editForm={editForm}
              setEditForm={setEditForm}
            />
          )}
        </div>

        {/* Day Record Log Drawer */}
        {detailRecordDay && (
          <div className="fixed inset-0 z-[1100] flex justify-end">
             <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-sm" onClick={() => setDetailRecordDay(null)} />
             <aside className="relative w-full md:w-[60%] lg:w-[45%] bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300 border-l border-slate-200 dark:border-slate-800">
                <header className="p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white dark:bg-slate-950 z-20">
                   <div>
                      <h3 className="text-base font-bold text-slate-900 dark:text-white leading-none">Record Log</h3>
                      <p className="text-xs font-medium text-blue-600 mt-1">{new Date(detailRecordDay).toDateString()}</p>
                   </div>
                   <button onClick={() => setDetailRecordDay(null)} className="p-2 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-[9px] hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                     <X size={18} />
                   </button>
                </header>

                <div className="flex bg-slate-50 dark:bg-slate-900 p-1 border-b border-slate-200 dark:border-slate-800 px-6 gap-2">
                   {['Lesson Notes', 'Growth Checks'].map(t => (
                     <button
                       key={t}
                       onClick={() => setActiveDetailTab(t as any)}
                       className={`px-4 py-2 text-xs font-bold rounded-[9px] transition-all ${
                         activeDetailTab === t ? 'bg-white dark:bg-slate-800 text-blue-600 dark:text-white shadow-sm' : 'text-slate-400'
                       }`}
                     >
                       {t}
                     </button>
                   ))}
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-6">
                   {activeDetailTab === 'Lesson Notes' && (
                     <div className="space-y-4">
                        {studentPerformance.analysis.filter(l => l.date.split('T')[0] === detailRecordDay).length === 0 ? (
                          <p className="py-12 text-center text-xs text-slate-400 font-medium">No lesson notes recorded for this day.</p>
                        ) : studentPerformance.analysis.filter(l => l.date.split('T')[0] === detailRecordDay).map(log => (
                          <div key={log.id} className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[9px] shadow-sm space-y-4">
                             <div className="flex items-center justify-between">
                                <h4 className="text-xs font-bold text-slate-900 dark:text-white">{log.targetBehavior}</h4>
                                <div className="px-2.5 py-0.5 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-950/30 dark:text-blue-400 dark:border-blue-900 rounded-[9px] text-[10px] font-bold font-mono">+{log.independenceScore}%</div>
                             </div>
                             <div className="space-y-1.5">
                                {log.steps.map((step, idx) => (
                                  <div key={step.id} className="flex items-center justify-between p-2.5 bg-white dark:bg-slate-950 border border-slate-200/80 dark:border-slate-800 rounded-[7px]">
                                     <span className="text-xs font-medium text-slate-800 dark:text-slate-200">{(idx + 1).toString().padStart(2,'0')}. {step.description}</span>
                                     <div className="flex gap-1">
                                        {(step.trials || []).map((t, tidx) => t !== '-' && (
                                          <span key={tidx} className="w-5 h-5 flex items-center justify-center bg-slate-100 dark:bg-slate-800 rounded text-[9px] font-bold text-slate-700 dark:text-slate-300">{t}</span>
                                        ))}
                                     </div>
                                  </div>
                                ))}
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                   {activeDetailTab === 'Growth Checks' && (
                     <div className="space-y-4">
                        {studentPerformance.milestones.filter(m => m.timestamp.split('T')[0] === detailRecordDay).length === 0 ? (
                          <p className="py-12 text-center text-xs text-slate-400 font-medium">No growth checks recorded for this day.</p>
                        ) : studentPerformance.milestones.filter(m => m.timestamp.split('T')[0] === detailRecordDay).map(record => (
                          <div key={record.id} className="bg-slate-50/70 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-5 rounded-[9px] shadow-sm space-y-4">
                             <div className="flex items-center justify-between gap-4">
                                <div>
                                  <h4 className="text-xs font-bold text-slate-900 dark:text-white">{record.ageCategory}</h4>
                                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(record.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                </div>
                                <div className="px-2.5 py-0.5 bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-[9px] text-[10px] font-bold font-mono">{record.overallPercentage}%</div>
                             </div>
                             <div className="space-y-3">
                                {record.sections.map(section => {
                                  const achieved = section.items.filter(item => item.checked).length;
                                  return (
                                    <div key={section.title} className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-[9px] overflow-hidden">
                                      <div className="px-4 py-2 bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
                                        <h5 className="text-[11px] font-bold text-slate-700 dark:text-slate-200">{section.title}</h5>
                                        <span className="text-[10px] font-bold text-emerald-600">{achieved}/{section.items.length}</span>
                                      </div>
                                      <div className="divide-y divide-slate-100 dark:divide-slate-800">
                                        {section.items.map(item => (
                                          <div key={item.id} className="flex items-start justify-between gap-4 px-4 py-2.5 text-xs">
                                            <p className="font-medium text-slate-800 dark:text-slate-200">{item.text}</p>
                                            <span className={`shrink-0 px-2 py-0.5 text-[9px] font-bold rounded-[7px] border ${item.checked ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-slate-50 text-slate-400 border-slate-200'}`}>
                                              {item.checked ? 'Observed' : 'Pending'}
                                            </span>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  );
                                })}
                             </div>
                          </div>
                        ))}
                     </div>
                   )}
                </div>
             </aside>
          </div>
        )}
      </div>
        );
      })()}

      {/* Add Student Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[1200] overflow-hidden">
          <div className={`absolute inset-0 bg-slate-100/95 dark:bg-slate-950/90 backdrop-blur-md ${isAddModalClosing ? 'form-backdrop-out' : 'form-backdrop-in'}`} onClick={() => closeAddStudentForm()} />
          <div className={`relative h-full w-full bg-white dark:bg-slate-950 shadow-2xl flex flex-col overflow-x-hidden ${isAddModalClosing ? 'form-screen-out' : 'form-screen-in'}`}>
            <header className="p-6 md:p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/95 dark:bg-slate-950/95 backdrop-blur-md sticky top-0 z-10">
              <div>
                <h2 className="text-2xl font-semibold tracking-tight text-slate-900 dark:text-white">Register New Student</h2>
                <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a student profile and guardian account.</p>
              </div>
              <button onClick={() => closeAddStudentForm()} className="p-3 rounded-[15px] text-slate-400 hover:text-rose-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"><X size={24}/></button>
            </header>

            <form onSubmit={handleAddStudent} className="flex-1 overflow-y-auto overflow-x-hidden p-4 sm:p-6 lg:p-10 space-y-8 custom-scrollbar bg-slate-50/50 dark:bg-slate-950">
              <div className={`${googleSection} max-w-7xl mx-auto`}>
                <div className="flex items-center gap-3">
                  <span className={googleStepBadge}>01 Identity</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-2">
                  <label className={googleLabel}>First Name</label>
                  <input required type="text" value={newStudent.firstName} onChange={e => setNewStudent({...newStudent, firstName: e.target.value})} className={googleInput} />
                </div>
                <div className="space-y-2">
                  <label className={googleLabel}>Last Name</label>
                  <input required type="text" value={newStudent.lastName} onChange={e => setNewStudent({...newStudent, lastName: e.target.value})} className={googleInput} />
                </div>
                <div className="space-y-2">
                  <label className={googleLabel}>Date of Birth</label>
                  <input required type="date" value={newStudent.dob} onChange={e => setNewStudent({...newStudent, dob: e.target.value})} className={googleInput} />
                </div>
                <div className="space-y-2">
                  <label className={googleLabel}>Gender</label>
                  <select required value={newStudent.gender} onChange={e => setNewStudent({...newStudent, gender: e.target.value as 'Male' | 'Female'})} className={`${googleInput} appearance-none cursor-pointer`}>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={googleLabel}>Student Login Password (Default: 000000)</label>
                  <input type="text" placeholder="Default: 000000" value={newStudent.password || ''} onChange={e => setNewStudent({...newStudent, password: e.target.value})} className={`${googleInput} font-mono`} />
                </div>
                <div className="space-y-2 md:col-span-2">
                  <label className={googleLabel}>Student Profile Image</label>
                  <label className="flex items-center gap-3 px-4 py-3 rounded-[15px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:ring-4 hover:ring-blue-500/10 transition-all shadow-sm">
                    <input type="file" accept="image/*" className="sr-only" onChange={e => handleStudentImageSelect(e.target.files?.[0])} />
                    <div className="w-11 h-11 rounded-[12px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center text-slate-400">
                      {newStudent.imageUrl ? <img src={newStudent.imageUrl} className="w-full h-full object-cover" alt="Student preview" /> : <ImageIcon size={18} />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-600 dark:text-slate-200 truncate">{studentImageName || 'Choose image from device'}</p>
                      <p className="text-[11px] text-slate-400">The image is converted to base64 for the database.</p>
                    </div>
                  </label>
                </div>
                </div>
              </div>

              <div className={`${googleSection} max-w-7xl mx-auto`}>
                <div className="flex items-center gap-3">
                  <span className={googleStepBadge}>02 Guardian</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={googleLabel}>Guardian Name</label>
                    <input required type="text" value={newStudent.parentName} onChange={e => setNewStudent({...newStudent, parentName: e.target.value})} className={googleInput} />
                  </div>
                  <div className="space-y-2">
                    <label className={googleLabel}>Guardian Phone</label>
                    <input required type="tel" value={newStudent.parentPhone} onChange={e => setNewStudent({...newStudent, parentPhone: e.target.value})} className={googleInput} />
                  </div>
                  <div className="space-y-2">
                    <label className={googleLabel}>Guardian Email</label>
                    <input required type="email" value={newStudent.parentEmail} onChange={e => setNewStudent({...newStudent, parentEmail: e.target.value})} className={googleInput} />
                  </div>
                  <div className="space-y-2">
                    <label className={googleLabel}>Guardian Login Password (Default: 000000)</label>
                    <input type="text" placeholder="Default: 000000" value={newStudent.parentPassword || ''} onChange={e => setNewStudent({...newStudent, parentPassword: e.target.value})} className={`${googleInput} font-mono`} />
                  </div>
                </div>
              </div>

              <div className={`${googleSection} max-w-7xl mx-auto`}>
                <div className="flex items-center gap-3">
                  <span className={googleStepBadge}>03 Schooling</span>
                  <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <label className={googleLabel}>Assigned Class</label>
                    <select required value={newStudent.assignedClass} onChange={e => setNewStudent({...newStudent, assignedClass: e.target.value})} className={`${googleInput} appearance-none cursor-pointer`}>
                      <option value="">Select Class</option>
                      {settings.classes.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className={googleLabel}>Assigned Specialist</label>
                    <select required value={newStudent.assignedStaffId} onChange={e => setNewStudent({...newStudent, assignedStaffId: e.target.value})} className={`${googleInput} appearance-none cursor-pointer`}>
                      <option value="">Select Specialist</option>
                      {staff.map(s => <option key={s.id} value={s.id}>{s.fullName}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-2 space-y-2">
                    <label className={googleLabel}>Home Address</label>
                    <textarea rows={2} value={newStudent.homeAddress} onChange={e => setNewStudent({...newStudent, homeAddress: e.target.value})} className={googleInput} />
                  </div>
                </div>
              </div>

              <div className="max-w-7xl mx-auto w-full pb-4">
                <button
                  type="submit"
                  disabled={isAdding}
                  className="w-full py-5 bg-blue-600 text-white font-bold tracking-wide rounded-[15px] shadow-xl shadow-blue-600/20 hover:bg-blue-700 active:scale-[0.99] transition-all flex items-center justify-center gap-3 disabled:opacity-50"
                >
                  {isAdding ? <Loader2 className="animate-spin" size={24} /> : "Create Student Account"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
