import React, { useEffect, useMemo, useRef, useState } from 'react';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  ChevronRight,
  Download,
  ExternalLink,
  Loader2,
  ImagePlus,
  Printer,
  QrCode,
  Repeat2,
  Search,
  ShieldCheck,
  Save,
  User,
  Users,
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Student } from '../../types';

import {
  IdentityCard,
  StudentPhoto,
  CARD_WIDTH,
  CARD_HEIGHT,
  LogoImg
} from '../common/IdentityCard';

const VerificationBaseUrl = 'https://defined-domain.vercel.app/';

export const IdCardManagement: React.FC = () => {
  const { students, updateStudent, notify } = useStore();
  const [activeView, setActiveView] = useState<'cards' | 'verify'>('cards');
  const [search, setSearch] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [showingBack, setShowingBack] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [generatingStudentId, setGeneratingStudentId] = useState<string | null>(null);
  const [isEditingId, setIsEditingId] = useState(false);
  const [editedIdImage, setEditedIdImage] = useState('');
  const [editedIdImageName, setEditedIdImageName] = useState('');
  const [editedIdForm, setEditedIdForm] = useState<Partial<Student>>({});
  const [isSavingId, setIsSavingId] = useState(false);
  const [scale, setScale] = useState(1);
  const cardRef = useRef<HTMLDivElement>(null);
  const frontExportRef = useRef<HTMLDivElement>(null);
  const backExportRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  const filteredStudents = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return students;
    return students.filter(student =>
      student.fullName.toLowerCase().includes(query) ||
      student.id.toLowerCase().includes(query) ||
      (student.assignedClass || '').toLowerCase().includes(query)
    );
  }, [search, students]);

  const verificationUrl = selectedStudent
    ? `${VerificationBaseUrl}?id-card=${encodeURIComponent(selectedStudent.firebaseUid || selectedStudent.id)}`
    : '';

  useEffect(() => {
    if (!verificationUrl) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(verificationUrl, { width: 260, margin: 1, color: { dark: '#0b1b36', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [verificationUrl]);

  useEffect(() => {
    const updateScale = () => {
      if (!previewRef.current) return;
      setScale(Math.min(1, (previewRef.current.clientWidth - 8) / CARD_WIDTH));
    };
    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (previewRef.current) observer.observe(previewRef.current);
    return () => observer.disconnect();
  }, [selectedStudent]);

  const exportCanvas = async (element = cardRef.current) => {
    if (!element || !selectedStudent) return null;
    return html2canvas(element, { scale: 3, backgroundColor: '#ffffff', useCORS: true });
  };

  const downloadCard = async () => {
    if (!selectedStudent || isExporting) return;
    setIsExporting(true);
    try {
      const [frontCanvas, backCanvas] = await Promise.all([
        exportCanvas(frontExportRef.current),
        exportCanvas(backExportRef.current),
      ]);
      if (!frontCanvas || !backCanvas) return;
      const safeFullName = selectedStudent.fullName.trim().replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '');
      [
        { canvas: frontCanvas, side: 'front' },
        { canvas: backCanvas, side: 'back' },
      ].forEach(({ canvas, side }) => {
        const link = document.createElement('a');
        link.download = `${safeFullName}_${side}.png`;
        link.href = canvas.toDataURL('image/png');
        document.body.appendChild(link);
        link.click();
        link.remove();
      });
      notify('success', 'Front and back ID card images downloaded.');
    } catch {
      notify('error', 'The ID card could not be downloaded.');
    } finally {
      setIsExporting(false);
    }
  };

  const printCard = async () => {
    if (!selectedStudent || isExporting) return;
    setIsExporting(true);
    try {
      const canvas = await exportCanvas();
      if (!canvas) return;
      const popup = window.open('', '_blank', 'width=1000,height=700');
      if (!popup) throw new Error('Popup blocked');
      popup.document.write(`<html><head><title>${selectedStudent.fullName} ID Card</title><style>body{margin:0;display:grid;place-items:center;min-height:100vh}img{width:856px;max-width:100%}@media print{body{min-height:auto}}</style></head><body><img src="${canvas.toDataURL('image/png')}" onload="window.print();window.close()" /></body></html>`);
      popup.document.close();
    } catch {
      notify('error', 'Allow popups to print the ID card.');
    } finally {
      setIsExporting(false);
    }
  };

  const openCard = async (student: Student) => {
    if (generatingStudentId) return;
    setGeneratingStudentId(student.id);
    try {
      let cardStudent = student;
      if (!student.idCardIssuedAt || !student.idCardExpiresAt || !student.idCardAcademicYear) {
        const issuedAt = student.idCardIssuedAt ? new Date(student.idCardIssuedAt) : new Date();
        const expiresAt = student.idCardExpiresAt ? new Date(student.idCardExpiresAt) : new Date(issuedAt);
        if (!student.idCardExpiresAt) expiresAt.setFullYear(expiresAt.getFullYear() + 2);
        const cardDetails = {
          idCardIssuedAt: issuedAt.toISOString(),
          idCardExpiresAt: expiresAt.toISOString(),
          idCardAcademicYear: student.idCardAcademicYear || String(issuedAt.getFullYear()),
        };
        if (student.firebaseUid) await updateStudent(student.firebaseUid, cardDetails);
        cardStudent = { ...student, ...cardDetails };
      }
      setSelectedStudent(cardStudent);
      setEditedIdImage(cardStudent.idCardImageUrl || cardStudent.imageUrl || '');
      setEditedIdForm({
        ...cardStudent,
        firstName: cardStudent.firstName || cardStudent.fullName.split(' ')[0] || '',
        lastName: cardStudent.lastName || cardStudent.fullName.split(' ').slice(1).join(' '),
      });
      setEditedIdImageName('');
      setIsEditingId(false);
      setShowingBack(false);
      setQrDataUrl('');
    } finally {
      setGeneratingStudentId(null);
    }
  };

  const openIdEditor = () => {
    if (!selectedStudent) return;
    setEditedIdImage(selectedStudent.idCardImageUrl || selectedStudent.imageUrl || '');
    setEditedIdImageName('');
    setEditedIdForm({
      ...selectedStudent,
      firstName: selectedStudent.firstName || selectedStudent.fullName.split(' ')[0] || '',
      lastName: selectedStudent.lastName || selectedStudent.fullName.split(' ').slice(1).join(' '),
    });
    setIsEditingId(true);
  };

  const handleIdImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setEditedIdImageName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 700;
        const ratio = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * ratio));
        canvas.height = Math.max(1, Math.round(image.height * ratio));
        const context = canvas.getContext('2d');
        if (!context) {
          notify('error', 'The selected image could not be processed.');
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        setEditedIdImage(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = () => notify('error', 'Please select a valid image file.');
      image.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  };

  const saveIdChanges = async () => {
    if (!selectedStudent?.firebaseUid || !editedIdImage || isSavingId) return;
    const firstName = (editedIdForm.firstName || '').trim();
    const lastName = (editedIdForm.lastName || '').trim();
    if (!firstName || !lastName || !editedIdForm.assignedClass || !editedIdForm.idCardAcademicYear || !editedIdForm.parentPhone || !editedIdForm.idCardIssuedAt || !editedIdForm.idCardExpiresAt) {
      notify('error', 'Complete all ID card details before saving.');
      return;
    }
    if (new Date(editedIdForm.idCardExpiresAt).getTime() <= new Date(editedIdForm.idCardIssuedAt).getTime()) {
      notify('error', 'The expiry date must be after the issue date.');
      return;
    }
    setIsSavingId(true);
    try {
      const changes: Partial<Student> = {
        firstName,
        lastName,
        fullName: `${firstName} ${lastName}`,
        assignedClass: editedIdForm.assignedClass.trim(),
        parentPhone: editedIdForm.parentPhone.trim(),
        idCardAcademicYear: editedIdForm.idCardAcademicYear.trim(),
        idCardIssuedAt: editedIdForm.idCardIssuedAt,
        idCardExpiresAt: editedIdForm.idCardExpiresAt,
        idCardImageUrl: editedIdImage,
      };
      await updateStudent(selectedStudent.firebaseUid, changes);
      setSelectedStudent({ ...selectedStudent, ...changes });
      setIsEditingId(false);
      setEditedIdImageName('');
      notify('success', 'Student ID details saved to the database.');
    } finally {
      setIsSavingId(false);
    }
  };

  const verifyMatch = useMemo(() => {
    if (activeView !== 'verify' || !search.trim()) return null;
    const query = search.trim().toLowerCase();
    return students.find(student =>
      student.id.toLowerCase() === query ||
      student.firebaseUid?.toLowerCase() === query ||
      student.fullName.toLowerCase() === query
    ) || null;
  }, [activeView, search, students]);

  return (
    <div className="min-h-[calc(100vh-72px)] bg-white dark:bg-slate-950">
      <div className="flex flex-col gap-3 border-b border-slate-200 px-6 py-4 md:flex-row md:items-center md:justify-between md:px-8 dark:border-slate-800">
        <div className="flex items-center gap-2 border-b border-slate-200 md:border-0 dark:border-slate-800">
          <button onClick={() => { setActiveView('cards'); setSearch(''); }} className={`border-b-2 px-4 py-3 text-xs font-bold ${activeView === 'cards' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}><Users size={15} className="mr-2 inline" />Student cards</button>
          <button onClick={() => { setActiveView('verify'); setSearch(''); }} className={`border-b-2 px-4 py-3 text-xs font-bold ${activeView === 'verify' ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-500'}`}><QrCode size={15} className="mr-2 inline" />Verify ID</button>
        </div>
        <div className="relative w-full md:w-80">
          <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input value={search} onChange={event => setSearch(event.target.value)} placeholder={activeView === 'cards' ? 'Search students or classes...' : 'Enter exact student ID or name...'} className="w-full rounded-[9px] border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-4 text-xs font-medium outline-none focus:border-blue-600 dark:border-slate-800 dark:bg-slate-900 dark:text-white" />
        </div>
      </div>

      {activeView === 'cards' && !selectedStudent && (
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead><tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-900/50"><th className="px-6 py-4">Student</th><th className="px-6 py-4">Student ID</th><th className="px-6 py-4">Class</th><th className="px-6 py-4">Guardian</th><th className="px-6 py-4 text-right">Action</th></tr></thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
              {filteredStudents.map(student => (
                <tr key={student.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-900/60">
                  <td className="px-6 py-4"><div className="flex items-center gap-3"><div className="h-9 w-9 overflow-hidden rounded-full bg-blue-50 text-blue-600 grid place-items-center font-bold">{student.imageUrl ? <img src={student.imageUrl} alt="" className="h-full w-full object-cover" /> : student.fullName[0]}</div><span className="text-sm font-bold text-slate-900 dark:text-white">{student.fullName}</span></div></td>
                  <td className="px-6 py-4 font-mono text-xs font-bold text-slate-500">{student.id}</td>
                  <td className="px-6 py-4 text-xs font-semibold text-slate-600 dark:text-slate-300">{student.assignedClass || 'General'}</td>
                  <td className="px-6 py-4 text-xs text-slate-500">{student.parentName || 'Not recorded'}</td>
                  <td className="px-6 py-4 text-right"><button disabled={Boolean(generatingStudentId)} onClick={() => openCard(student)} className="inline-flex items-center gap-2 rounded-[9px] bg-blue-600 px-3.5 py-2 text-xs font-bold text-white hover:bg-blue-700 disabled:cursor-wait disabled:opacity-60">{generatingStudentId === student.id ? <Loader2 size={14} className="animate-spin" /> : null}{student.idCardIssuedAt ? 'View ID' : 'Generate ID'} <ChevronRight size={14} /></button></td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan={5} className="px-6 py-16 text-center text-sm font-semibold text-slate-400">No matching students found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}

      {activeView === 'cards' && selectedStudent && (
        <div className="px-4 py-6 md:px-8">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <button onClick={() => setSelectedStudent(null)} className="inline-flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-slate-900 dark:hover:text-white">← Back to students</button>
            <div className="flex flex-wrap gap-2">
              <button onClick={() => setShowingBack(value => !value)} className="inline-flex items-center gap-2 rounded-[9px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><Repeat2 size={15} />{showingBack ? 'View front' : 'View back'}</button>
              <button onClick={openIdEditor} className="inline-flex items-center gap-2 rounded-[9px] border border-blue-200 bg-blue-50 px-3.5 py-2 text-xs font-bold text-blue-700 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300"><ImagePlus size={15} />Edit ID</button>
              <button onClick={() => window.open(verificationUrl, '_blank', 'noopener,noreferrer')} className="inline-flex items-center gap-2 rounded-[9px] border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs font-bold text-emerald-700"><ExternalLink size={15} />Live verification</button>
              <button onClick={printCard} disabled={isExporting} className="inline-flex items-center gap-2 rounded-[9px] border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-700 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-white"><Printer size={15} />Print</button>
              <button onClick={downloadCard} disabled={isExporting} className="inline-flex items-center gap-2 rounded-[9px] bg-blue-600 px-3.5 py-2 text-xs font-bold text-white disabled:opacity-60">{isExporting ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}{isExporting ? 'Preparing both...' : 'Download both'}</button>
            </div>
          </div>
          <div ref={previewRef} className="w-full overflow-hidden" style={{ height: CARD_HEIGHT * scale }}>
            <div style={{ width: CARD_WIDTH, height: CARD_HEIGHT, transform: `scale(${scale})`, transformOrigin: 'top left' }}>
              <IdentityCard ref={cardRef} student={selectedStudent} showingBack={showingBack} qrDataUrl={qrDataUrl} />
            </div>
          </div>

          <div className="pointer-events-none fixed -left-[10000px] top-0" aria-hidden="true">
            <IdentityCard ref={frontExportRef} student={selectedStudent} showingBack={false} qrDataUrl={qrDataUrl} />
            <IdentityCard ref={backExportRef} student={selectedStudent} showingBack={true} qrDataUrl={qrDataUrl} />
          </div>

          {isEditingId && (
            <div className="fixed inset-0 z-[1200] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm" onMouseDown={event => { if (event.target === event.currentTarget && !isSavingId) setIsEditingId(false); }}>
              <section className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-[15px] border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900">
                <header className="border-b border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/50">
                  <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600">Student ID</p>
                  <h2 className="mt-0.5 text-base font-bold text-slate-900 dark:text-white">Edit ID details</h2>
                </header>
                <div className="p-5">
                  <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                    <div className="h-48 w-36 shrink-0 overflow-hidden rounded-[12px] border border-slate-200 bg-slate-100 dark:border-slate-700 dark:bg-slate-800">
                      {editedIdImage ? <img src={editedIdImage} alt="ID preview" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-slate-400"><User size={38} /></div>}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-slate-900 dark:text-white">ID portrait</p>
                      <p className="mt-1 text-xs leading-5 text-slate-500">Choose a separate portrait for this student’s ID card. It will be compressed and stored as Base64 in the student database record.</p>
                      <label className="mt-4 flex cursor-pointer items-center justify-center gap-2 rounded-[9px] border-2 border-dashed border-blue-200 bg-blue-50 px-4 py-3 text-xs font-bold text-blue-700 transition-colors hover:border-blue-500 dark:border-blue-900 dark:bg-blue-950/30 dark:text-blue-300">
                        <ImagePlus size={16} />Choose image from files
                        <input type="file" accept="image/*" onChange={handleIdImageUpload} className="hidden" />
                      </label>
                      {editedIdImageName && <p className="mt-2 truncate text-[10px] font-medium text-slate-500">Selected: {editedIdImageName}</p>}
                    </div>
                  </div>
                  <div className="mt-6 grid grid-cols-1 gap-4 border-t border-slate-200 pt-5 sm:grid-cols-2 dark:border-slate-800">
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">First name</span><input value={editedIdForm.firstName || ''} onChange={event => setEditedIdForm({ ...editedIdForm, firstName: event.target.value })} className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Last name</span><input value={editedIdForm.lastName || ''} onChange={event => setEditedIdForm({ ...editedIdForm, lastName: event.target.value })} className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Class</span><input value={editedIdForm.assignedClass || ''} onChange={event => setEditedIdForm({ ...editedIdForm, assignedClass: event.target.value })} className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Academic year</span><input value={editedIdForm.idCardAcademicYear || ''} onChange={event => setEditedIdForm({ ...editedIdForm, idCardAcademicYear: event.target.value })} placeholder="e.g. 2026" className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Emergency contact</span><input type="tel" value={editedIdForm.parentPhone || ''} onChange={event => setEditedIdForm({ ...editedIdForm, parentPhone: event.target.value })} className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Issue date</span><input type="date" value={(editedIdForm.idCardIssuedAt || '').slice(0, 10)} onChange={event => setEditedIdForm({ ...editedIdForm, idCardIssuedAt: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' })} className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                    <label className="space-y-1.5"><span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">Expiry date</span><input type="date" value={(editedIdForm.idCardExpiresAt || '').slice(0, 10)} onChange={event => setEditedIdForm({ ...editedIdForm, idCardExpiresAt: event.target.value ? `${event.target.value}T00:00:00.000Z` : '' })} className="w-full rounded-[9px] border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white" /></label>
                  </div>
                </div>
                <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-5 py-4 dark:border-slate-800 dark:bg-slate-800/40">
                  <button onClick={() => setIsEditingId(false)} disabled={isSavingId} className="rounded-[9px] border border-slate-200 bg-white px-4 py-2 text-xs font-bold text-slate-600 disabled:opacity-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">Cancel</button>
                  <button onClick={saveIdChanges} disabled={!editedIdImage || isSavingId} className="inline-flex items-center gap-2 rounded-[9px] bg-blue-600 px-4 py-2 text-xs font-bold text-white disabled:cursor-not-allowed disabled:opacity-60">{isSavingId ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}{isSavingId ? 'Saving...' : 'Save ID'}</button>
                </footer>
              </section>
            </div>
          )}
        </div>
      )}

      {activeView === 'verify' && (
        <div className="px-6 py-8 md:px-8">
          {!search.trim() ? (
            <div className="border-y border-slate-200 py-16 text-center dark:border-slate-800"><QrCode size={38} className="mx-auto text-emerald-500" /><h2 className="mt-4 text-lg font-bold dark:text-white">Verify a student identity</h2><p className="mt-1 text-xs text-slate-500">Enter an exact student ID or full name in the search field.</p></div>
          ) : verifyMatch ? (
            <div className="grid border-y border-emerald-200 bg-emerald-50/40 md:grid-cols-[150px_1fr_auto] md:items-center dark:border-emerald-900 dark:bg-emerald-950/10">
              <div className="h-44 bg-slate-100"> <StudentPhoto student={verifyMatch} /> </div>
              <div className="p-6"><div className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-100 px-3 py-1 text-[10px] font-black uppercase text-emerald-700"><BadgeCheck size={14} />Authentic student identity</div><h2 className="text-xl font-black uppercase text-slate-900 dark:text-white">{verifyMatch.fullName}</h2><p className="mt-1 text-sm font-bold text-violet-600">{verifyMatch.assignedClass || 'General'}</p><p className="mt-2 font-mono text-xs text-slate-500">ID: {verifyMatch.id}</p></div>
              <button onClick={() => { setActiveView('cards'); openCard(verifyMatch); }} className="m-6 inline-flex items-center justify-center gap-2 rounded-[9px] bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white">View ID card <ChevronRight size={14} /></button>
            </div>
          ) : (
            <div className="border-y border-rose-200 bg-rose-50 py-16 text-center dark:border-rose-900 dark:bg-rose-950/10"><ShieldCheck size={38} className="mx-auto text-rose-500" /><h2 className="mt-4 text-lg font-bold text-rose-700">Identity not found</h2><p className="mt-1 text-xs text-rose-500">Check the student ID or full name and try again.</p></div>
          )}
        </div>
      )}
    </div>
  );
};
