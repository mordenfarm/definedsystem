import React, { useEffect, useMemo, useRef, useState } from 'react';
import QRCode from 'qrcode';
import {
  BadgeCheck,
  CheckCircle2,
  ChevronRight,
  ExternalLink,
  Loader2,
  Printer,
  QrCode,
  Repeat2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  UserCheck
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import { Student } from '../../types';
import {
  IdentityCard,
  CARD_WIDTH,
  CARD_HEIGHT,
  LogoImg
} from '../common/IdentityCard';

const VerificationBaseUrl = 'https://defined-domain.vercel.app/';

export const StudentIdVerification: React.FC = () => {
  const { students } = useStore();
  const [hasWaited, setHasWaited] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [showingBack, setShowingBack] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState('');
  const [scale, setScale] = useState(1);
  const [showTickModal, setShowTickModal] = useState(true);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const previewRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);

  const urlCardId = new URLSearchParams(window.location.search).get('id-card') || '';
  const activeLookupId = urlCardId || searchInput.trim();

  const student = useMemo(() => {
    if (!activeLookupId) return null;
    const query = activeLookupId.toLowerCase();
    return (
      students.find(
        (item) =>
          item.firebaseUid?.toLowerCase() === query ||
          item.id.toLowerCase() === query ||
          item.fullName.toLowerCase() === query
      ) || null
    );
  }, [activeLookupId, students]);

  useEffect(() => {
    const timer = window.setTimeout(() => setHasWaited(true), 1800);
    return () => window.clearTimeout(timer);
  }, []);

  // When a student is found, trigger the animated "ID is Valid" banner first, then reveal card
  useEffect(() => {
    if (student) {
      setShowTickModal(true);
      const timer = window.setTimeout(() => {
        setIsTransitioning(true);
        const hideTimer = window.setTimeout(() => {
          setShowTickModal(false);
          setIsTransitioning(false);
        }, 500);
        return () => window.clearTimeout(hideTimer);
      }, 2200);

      return () => window.clearTimeout(timer);
    } else {
      setShowTickModal(false);
    }
  }, [student?.id, student?.firebaseUid]);

  // Generate QR Code for the student card
  useEffect(() => {
    if (!student) {
      setQrDataUrl('');
      return;
    }
    const targetUrl = `${VerificationBaseUrl}?id-card=${encodeURIComponent(student.firebaseUid || student.id)}`;
    QRCode.toDataURL(targetUrl, {
      width: 260,
      margin: 1,
      color: { dark: '#0b1b36', light: '#ffffff' }
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [student]);

  // Calculate responsive scale for ID Card display
  useEffect(() => {
    const updateScale = () => {
      if (!previewRef.current) return;
      const containerWidth = previewRef.current.clientWidth - 16;
      setScale(Math.min(1, Math.max(0.35, containerWidth / CARD_WIDTH)));
    };

    updateScale();
    const observer = new ResizeObserver(updateScale);
    if (previewRef.current) observer.observe(previewRef.current);
    window.addEventListener('resize', updateScale);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateScale);
    };
  }, [student, showTickModal]);

  const handlePrint = () => {
    window.print();
  };

  const isLoading = Boolean(urlCardId) && students.length === 0 && !hasWaited;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-emerald-500 selection:text-white">
      {/* Top Navbar */}
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-slate-800/80 bg-slate-950/85 px-6 py-3.5 backdrop-blur-md">
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-full border border-emerald-500/40 bg-slate-900 p-1.5 shadow-lg shadow-emerald-950/40">
            <img src={LogoImg} alt="Defined Domains" className="h-full w-full object-contain" />
          </div>
          <div>
            <h1 className="text-base font-black uppercase tracking-wider text-white">Defined Domains</h1>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-emerald-400">Inclusive School • Verification System</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="hidden sm:inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 px-3 py-1 text-[11px] font-bold text-emerald-300">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Live Verification Server
          </span>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 md:p-8">
        {isLoading ? (
          <div className="py-24 text-center">
            <div className="relative mx-auto h-16 w-16">
              <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
              <div className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-emerald-500" />
            </div>
            <h2 className="mt-6 text-base font-bold uppercase tracking-wider text-white">Verifying Student Credential...</h2>
            <p className="mt-2 text-xs text-slate-400">Connecting to secure student identity records</p>
          </div>
        ) : student ? (
          <div className="w-full max-w-4xl flex flex-col items-center">
            {/* Animated Tick / "ID is Valid" Overlay or Screen */}
            {showTickModal ? (
              <div
                className={`w-full max-w-lg overflow-hidden rounded-3xl border border-emerald-500/40 bg-gradient-to-b from-slate-900/95 via-slate-900/90 to-slate-950/95 p-8 text-center shadow-[0_24px_80px_rgba(16,185,129,0.2)] backdrop-blur-xl transition-all duration-500 ${
                  isTransitioning ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                }`}
              >
                {/* Pulsing Green Animated Tick */}
                <div className="relative mx-auto my-4 flex h-28 w-28 items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-emerald-500/20 animate-ping" />
                  <div className="absolute -inset-2 rounded-full bg-gradient-to-tr from-emerald-500/30 to-teal-400/20 blur-md" />
                  <div className="relative flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-400 shadow-2xl shadow-emerald-500/50">
                    <svg
                      className="h-14 w-14 text-white animate-[bounce_1s_ease-in-out_1]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth="3"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                        className="animate-[dash_0.6s_ease-in-out_forwards]"
                      />
                    </svg>
                  </div>
                </div>

                <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-emerald-500/40 bg-emerald-950/60 px-4 py-1.5 text-xs font-black uppercase tracking-widest text-emerald-300 shadow-inner">
                  <ShieldCheck size={16} className="text-emerald-400" />
                  Official Credential Verified
                </div>

                <h2 className="mt-4 text-3xl font-black uppercase tracking-tight text-white sm:text-4xl">
                  ID is <span className="text-emerald-400">Valid</span>
                </h2>

                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {student.fullName}
                </p>

                <div className="mt-5 rounded-2xl border border-slate-800 bg-slate-950/60 p-4 text-left">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">School</p>
                      <p className="mt-0.5 font-bold text-white">Defined Domains Inclusive School</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Student ID</p>
                      <p className="mt-0.5 font-mono font-black text-emerald-400">{student.id.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Class / Grade</p>
                      <p className="mt-0.5 font-bold text-white">{student.assignedClass || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black uppercase tracking-wider text-slate-500">Status</p>
                      <p className="mt-0.5 font-black uppercase text-emerald-400">Authentic Record</p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => setShowTickModal(false)}
                  className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-emerald-900/40 transition hover:from-emerald-500 hover:to-emerald-400"
                >
                  View ID Card Design <ChevronRight size={16} />
                </button>
              </div>
            ) : (
              /* Full High-Fidelity ID Card Display (Exact same design as Admin Portal) */
              <div className="w-full flex flex-col items-center animate-in fade-in zoom-in-95 duration-500">
                {/* Verification Status Header Bar */}
                <div className="mb-6 flex w-full flex-wrap items-center justify-between gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-950/30 px-5 py-3.5 backdrop-blur-md">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-md shadow-emerald-500/30">
                      <CheckCircle2 size={20} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-black uppercase tracking-wider text-white">ID is Valid</h3>
                        <span className="rounded bg-emerald-500/20 border border-emerald-500/40 px-2 py-0.5 text-[9px] font-black uppercase text-emerald-300">Authentic</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-300">
                        {student.fullName} • <span className="font-mono text-emerald-400">{student.id.toUpperCase()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => setShowingBack((val) => !val)}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
                    >
                      <Repeat2 size={15} />
                      {showingBack ? 'Show Front' : 'Show Back'}
                    </button>
                    <button
                      onClick={() => setShowTickModal(true)}
                      className="inline-flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-950/40 px-3.5 py-2 text-xs font-bold text-emerald-300 transition hover:bg-emerald-900/50"
                    >
                      <ShieldCheck size={15} />
                      Validation Status
                    </button>
                    <button
                      onClick={handlePrint}
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-700 bg-slate-900 px-3.5 py-2 text-xs font-bold text-slate-300 transition hover:bg-slate-800 hover:text-white"
                    >
                      <Printer size={15} />
                      Print
                    </button>
                  </div>
                </div>

                {/* Scaled Responsive Card Container */}
                <div
                  ref={previewRef}
                  className="w-full flex justify-center overflow-hidden py-2"
                  style={{ height: CARD_HEIGHT * scale + 10 }}
                >
                  <div
                    style={{
                      width: CARD_WIDTH,
                      height: CARD_HEIGHT,
                      transform: `scale(${scale})`,
                      transformOrigin: 'top center',
                      boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)'
                    }}
                  >
                    <IdentityCard
                      ref={cardRef}
                      student={student}
                      showingBack={showingBack}
                      qrDataUrl={qrDataUrl}
                    />
                  </div>
                </div>

                <div className="mt-6 text-center text-xs text-slate-500">
                  <p>Secured & Verified by Defined Domains Inclusive School Authority</p>
                  <p className="mt-1 text-[10px] uppercase tracking-widest text-slate-600">
                    Masvingo, Zimbabwe • Live Database Hash: {student.firebaseUid || student.id}
                  </p>
                </div>
              </div>
            )}
          </div>
        ) : activeLookupId ? (
          /* ID Not Found State */
          <div className="w-full max-w-md rounded-3xl border border-rose-900/50 bg-slate-900/90 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-rose-500/10 text-rose-500">
              <ShieldAlert size={40} />
            </div>
            <h2 className="mt-5 text-2xl font-black uppercase tracking-tight text-white">ID Not Recognized</h2>
            <p className="mt-2 text-xs font-medium leading-relaxed text-slate-400">
              The query <span className="font-mono font-bold text-rose-300">"{activeLookupId}"</span> does not match an active student record in Defined Domains Inclusive School database.
            </p>

            <div className="mt-6 border-t border-slate-800 pt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Try Searching Again</p>
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  placeholder="e.g. DD002 or Student Name"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 rounded-xl border border-slate-800 bg-slate-950 px-4 py-2.5 text-xs font-semibold text-white outline-none focus:border-emerald-500"
                />
              </div>
            </div>
          </div>
        ) : (
          /* Search / Lookup Form when no query in URL */
          <div className="w-full max-w-lg rounded-3xl border border-slate-800 bg-slate-900/80 p-8 text-center shadow-2xl backdrop-blur-xl">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl border border-emerald-500/30 bg-emerald-950/40 text-emerald-400 shadow-lg shadow-emerald-950/50">
              <QrCode size={32} />
            </div>
            <h2 className="mt-5 text-2xl font-black uppercase tracking-tight text-white">
              Student ID Verification
            </h2>
            <p className="mt-2 text-xs font-medium text-slate-400">
              Enter an official student ID number or full student name to verify enrollment and view the authentic ID card record.
            </p>

            <div className="mt-6 flex flex-col gap-3">
              <div className="relative">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Enter Student ID (e.g. DD002, DD003) or Name..."
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="w-full rounded-xl border border-slate-800 bg-slate-950 py-3 pl-11 pr-4 text-xs font-semibold text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-3 gap-2 text-left border-t border-slate-800/80 pt-5">
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
                <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Total Enrolled</p>
                <p className="mt-1 text-sm font-black text-white">{students.length} Students</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
                <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Term</p>
                <p className="mt-1 text-sm font-black text-emerald-400">Term 3 2026</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-2.5">
                <p className="text-[8.5px] font-black uppercase tracking-wider text-slate-500">Security</p>
                <p className="mt-1 text-sm font-black text-violet-400">Live SSL QR</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-[10px] font-bold uppercase tracking-widest text-slate-600">
        © 2026 Defined Domains Inclusive School • Student Identity Verification System
      </footer>
    </div>
  );
};
