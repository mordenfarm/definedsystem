import React, { useEffect, useMemo, useState } from 'react';
import { BadgeCheck, ShieldAlert } from 'lucide-react';
import { useStore } from '../../store/useStore';

const LogoImg = 'https://i.ibb.co/spSVqW8s/definedlogo.png';

export const StudentIdVerification: React.FC = () => {
  const { students } = useStore();
  const [hasWaited, setHasWaited] = useState(false);
  const cardId = new URLSearchParams(window.location.search).get('id-card') || '';
  const student = useMemo(
    () => students.find(item => item.firebaseUid === cardId || item.id.toLowerCase() === cardId.toLowerCase()),
    [cardId, students]
  );

  useEffect(() => {
    const timer = window.setTimeout(() => setHasWaited(true), 2500);
    return () => window.clearTimeout(timer);
  }, []);

  const isLoading = Boolean(cardId) && students.length === 0 && !hasWaited;
  const issueDate = student?.idCardIssuedAt ? new Date(student.idCardIssuedAt) : new Date();
  const safeIssueDate = Number.isNaN(issueDate.getTime()) ? new Date() : issueDate;
  const storedExpiry = student?.idCardExpiresAt ? new Date(student.idCardExpiresAt) : null;
  const expiryDate = storedExpiry && !Number.isNaN(storedExpiry.getTime()) ? storedExpiry : new Date(safeIssueDate);
  if (!storedExpiry || Number.isNaN(storedExpiry.getTime())) expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  const isExpired = expiryDate.getTime() < Date.now();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-900">
      <header className="flex items-center justify-center gap-3 border-b-4 border-emerald-500 bg-[#0b1b36] px-6 py-4">
        <div className="grid h-11 w-11 place-items-center rounded-full bg-white p-1.5"><img src={LogoImg} alt="Defined Domains" /></div>
        <div><h1 className="text-lg font-black uppercase leading-none tracking-widest text-white">Defined Domains</h1><p className="mt-1 text-[9px] font-bold uppercase tracking-[0.22em] text-emerald-400">Student ID verification</p></div>
      </header>

      <main className="grid flex-1 place-items-center p-5">
        <section className="w-full max-w-md overflow-hidden rounded-[22px] border border-slate-200 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.15)]">
          {isLoading ? (
            <div className="py-20 text-center"><div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-slate-100 border-t-emerald-500" /><h2 className="mt-5 text-sm font-black uppercase tracking-wider">Verifying identity...</h2></div>
          ) : student ? (
            <>
              <div className={`flex items-center justify-center gap-2 px-5 py-3 text-xs font-black uppercase tracking-wider text-white ${isExpired ? 'bg-rose-600' : 'bg-emerald-600'}`}>
                {isExpired ? <ShieldAlert size={18} /> : <BadgeCheck size={18} />}{isExpired ? 'Card expired' : 'Authentic student identity'}
              </div>
              <div className="p-6">
                <div className="flex items-start gap-4 rounded-[16px] border border-slate-200 bg-slate-50 p-4">
                  <div className="h-32 w-24 shrink-0 overflow-hidden rounded-[12px] border-2 border-white bg-slate-200 shadow-sm">
                    {student.idCardImageUrl || student.imageUrl ? <img src={student.idCardImageUrl || student.imageUrl} alt={student.fullName} className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-3xl font-black text-slate-400">{student.fullName[0]}</div>}
                  </div>
                  <div className="min-w-0 pt-1"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Student</p><h2 className="mt-1 text-xl font-black uppercase leading-tight">{student.fullName}</h2><p className="mt-3 text-[9px] font-black uppercase tracking-widest text-slate-400">Grade / Class</p><p className="text-sm font-bold text-violet-700">{student.assignedClass || 'General'}</p></div>
                </div>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="col-span-2 rounded-[12px] border border-slate-200 p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">School</p><p className="mt-1 text-sm font-black text-slate-900">Defined Domains Inclusive School</p></div>
                  <div className="rounded-[12px] border border-slate-200 p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Student ID</p><p className="mt-1 break-all font-mono text-xs font-bold">{student.id}</p></div>
                  <div className="rounded-[12px] border border-slate-200 p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Academic Year</p><p className="mt-1 text-xs font-bold text-slate-900">{student.idCardAcademicYear || safeIssueDate.getFullYear()}</p></div>
                  <div className="rounded-[12px] border border-slate-200 p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Issued</p><p className="mt-1 text-xs font-bold text-slate-900">{safeIssueDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p></div>
                  <div className="rounded-[12px] border border-slate-200 p-3"><p className="text-[9px] font-black uppercase tracking-widest text-slate-400">Valid until</p><p className={`mt-1 text-xs font-bold ${isExpired ? 'text-rose-600' : 'text-emerald-600'}`}>{expiryDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase()}</p></div>
                </div>
              </div>
            </>
          ) : (
            <div className="px-6 py-16 text-center"><div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-rose-50 text-rose-500"><ShieldAlert size={30} /></div><h2 className="mt-5 text-xl font-black uppercase">ID not found</h2><p className="mt-2 text-sm font-medium text-slate-500">This credential does not match an active student record.</p></div>
          )}
        </section>
      </main>
      <footer className="pb-6 text-center text-[9px] font-bold uppercase tracking-widest text-slate-400">Secured by Defined Domains</footer>
    </div>
  );
};
