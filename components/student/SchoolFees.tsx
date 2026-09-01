import React, { useEffect, useMemo, useState } from 'react';
import { useStore } from '../../store/useStore';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Loader2,
  Receipt,
  ShieldCheck,
  Wallet,
  X,
} from 'lucide-react';
import { PaymentRecord } from '../../types';
import {
  generateReceiptDownload,
  RECEIPT_DOWNLOAD_COUNTDOWN_SECONDS,
  RECEIPT_DOWNLOAD_LOADING_TEXT,
  ReceiptDownloadFormat,
} from '../../reports/receipt_generator';

const PAYMENT_API_BASE_URL = ((import.meta as any).env?.VITE_PAYMENT_API_BASE_URL || 'https://defined-domain-payments.vercel.app').replace(/\/$/, '');

const currency = (amount: number) => `$${amount.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const SchoolFees: React.FC = () => {
  const { user, students, parents, settings, updateStudent, payments, addPayment } = useStore();
  const [paymentAmount, setPaymentAmount] = useState('');
  const [selectedTerm, setSelectedTerm] = useState(settings.currentTerm || 'Term 1');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [zbPopup, setZbPopup] = useState(false);
  const [receipt, setReceipt] = useState<{ amount: number; reference: string; timestamp: string; term: string } | null>(null);
  const [downloadPayment, setDownloadPayment] = useState<PaymentRecord | null>(null);
  const [downloadFormat, setDownloadFormat] = useState<ReceiptDownloadFormat | null>(null);
  const [downloadCountdown, setDownloadCountdown] = useState(RECEIPT_DOWNLOAD_COUNTDOWN_SECONDS);
  const [downloadStep, setDownloadStep] = useState<'choose' | 'loading'>('choose');

  const studentProfile = useMemo(() => {
    if (user?.role === 'STUDENT') return students.find(s => s.firebaseUid === user.id);
    if (user?.role === 'PARENT') {
      const parent = parents.find(p => p.firebaseUid === user.id);
      return parent ? students.find(s => s.id === parent.studentId) : null;
    }
    return null;
  }, [user, students, parents]);

  const parentProfile = useMemo(() => {
    if (user?.role !== 'PARENT') return null;
    return parents.find(p => p.firebaseUid === user.id) || null;
  }, [user, parents]);

  const studentPayments = useMemo(
    () => studentProfile
      ? payments.filter(p => p.studentId === studentProfile.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      : [],
    [payments, studentProfile]
  );

  const totalFees = settings.feesAmount || 0;
  const paidFees = studentProfile?.totalPaid || 0;
  const balance = Math.max(0, totalFees - paidFees);
  const paidRatio = totalFees > 0 ? paidFees / totalFees : 0;
  const amount = Number(paymentAmount);

  const validateAmount = () => {
    if (!studentProfile || !studentProfile.firebaseUid) return false;
    if (!amount || Number.isNaN(amount) || amount <= 0) return false;
    if (balance > 0 && amount > balance) return false;
    return true;
  };

  const closeDownloadModal = () => {
    setDownloadPayment(null);
    setDownloadFormat(null);
    setDownloadCountdown(RECEIPT_DOWNLOAD_COUNTDOWN_SECONDS);
    setDownloadStep('choose');
    setIsGenerating(false);
  };

  const openDownloadModal = (payment: PaymentRecord) => {
    setDownloadPayment(payment);
    setDownloadFormat(null);
    setDownloadCountdown(RECEIPT_DOWNLOAD_COUNTDOWN_SECONDS);
    setDownloadStep('choose');
  };

  const startReceiptDownload = (format: ReceiptDownloadFormat) => {
    setDownloadFormat(format);
    setDownloadCountdown(RECEIPT_DOWNLOAD_COUNTDOWN_SECONDS);
    setDownloadStep('loading');
  };

  useEffect(() => {
    if (downloadStep !== 'loading' || !downloadPayment || !downloadFormat || !studentProfile) return;

    if (downloadCountdown > 0) {
      const timer = window.setTimeout(() => setDownloadCountdown(current => current - 1), 1000);
      return () => window.clearTimeout(timer);
    }

    let cancelled = false;
    const runDownload = async () => {
      setIsGenerating(true);
      await generateReceiptDownload(downloadFormat, {
        payment: downloadPayment,
        student: studentProfile,
        parent: parentProfile,
        term: selectedTerm,
        totalFees,
        paidFees,
        balance,
      });
      if (!cancelled) closeDownloadModal();
    };

    runDownload();
    return () => {
      cancelled = true;
    };
  }, [balance, downloadCountdown, downloadFormat, downloadPayment, downloadStep, paidFees, parentProfile, selectedTerm, studentProfile, totalFees]);

  const handleZbCheckout = async () => {
    if (!validateAmount() || !studentProfile) return;
    setIsProcessing(true);
    try {
      const response = await fetch(`${PAYMENT_API_BASE_URL}/api/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          term: selectedTerm,
          studentId: studentProfile.id,
          studentName: studentProfile.fullName,
          studentFirebaseUid: studentProfile.firebaseUid,
          parentUserId: user?.id,
        }),
      });

      const data = await response.json();
      if (!response.ok || !data.success || !data.paymentUrl) {
        throw new Error(data.message || 'ZB has not approved yet.');
      }

      window.location.href = data.paymentUrl;
    } catch {
      setZbPopup(true);
      window.setTimeout(() => setZbPopup(false), 3600);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAutoSystemPayment = async () => {
    if (!validateAmount() || !studentProfile?.firebaseUid) return;
    setIsProcessing(true);
    const reference = `DDS-${Date.now().toString().slice(-7)}`;
    const timestamp = new Date().toISOString();
    try {
      await addPayment({
        studentId: studentProfile.id,
        studentName: studentProfile.fullName,
        amount,
        method: `Auto System - ${selectedTerm}`,
        isMock: true,
        reference,
        timestamp,
      });
      await updateStudent(studentProfile.firebaseUid, { totalPaid: paidFees + amount });
      setReceipt({ amount, reference, timestamp, term: selectedTerm });
      setPaymentAmount('');
    } finally {
      setIsProcessing(false);
    }
  };

  if (!studentProfile) {
    return <div className="h-[70svh] grid place-items-center text-xs font-black uppercase tracking-widest text-[#7c3aed]">Syncing fees</div>;
  }

  return (
    <div className="space-y-5">
      <header className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-black text-[#8b5cf6]">Fees</p>
          <h1 className="text-2xl font-black tracking-tight">Tuition wallet</h1>
          <p className="text-[11px] font-bold text-slate-500">{studentProfile.fullName}</p>
        </div>
        <button
          onClick={() => studentPayments[0] && openDownloadModal(studentPayments[0])}
          disabled={studentPayments.length === 0}
          className="h-11 w-11 rounded-full bg-white shadow-[0_10px_28px_rgba(124,58,237,0.12)] grid place-items-center text-[#7c3aed] disabled:opacity-40"
        >
          <Download size={17} />
        </button>
      </header>

      <section className="rounded-[24px] bg-gradient-to-br from-[#7c3aed] via-[#8b5cf6] to-[#22c55e] p-5 text-white shadow-[0_14px_34px_rgba(124,58,237,0.22)] overflow-hidden relative">
        <div className="absolute -right-12 -bottom-16 h-40 w-40 rounded-full border border-white/30" />
        <div className="relative z-10">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-black">Paid out of total</p>
            <Wallet size={17} />
          </div>
          <h2 className="mt-4 text-4xl font-black">{currency(paidFees)}</h2>
          <p className="text-xs font-bold opacity-90">of {currency(totalFees)} for {selectedTerm}</p>
          <div className="mt-4 h-2 rounded-full bg-white/25 overflow-hidden">
            <div className="h-full rounded-full bg-white" style={{ width: `${Math.min(100, Math.round(paidRatio * 100))}%` }} />
          </div>
          <div className="mt-3 flex items-center justify-between text-[10px] font-black">
            <span>{Math.round(paidRatio * 100)}% complete</span>
            <span>Balance {currency(balance)}</span>
          </div>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)] space-y-4">
        <div className="grid grid-cols-3 gap-2">
          {['Term 1', 'Term 2', 'Term 3'].map(term => (
            <button
              key={term}
              onClick={() => setSelectedTerm(term)}
              className={`h-10 rounded-2xl text-[10px] font-black transition-all ${
                selectedTerm === term ? 'bg-[#7c3aed] text-white shadow-[0_8px_18px_rgba(124,58,237,0.22)]' : 'bg-[#fbf8ff] text-slate-500'
              }`}
            >
              {term}
            </button>
          ))}
        </div>

        <div>
          <label className="text-[10px] font-black text-slate-500">Amount to pay</label>
          <div className="mt-2 flex items-center gap-2 rounded-[22px] bg-slate-50 px-4 py-3 border border-slate-200">
            <span className="text-lg font-black text-[#7c3aed]">$</span>
            <input
              type="number"
              value={paymentAmount}
              onChange={e => setPaymentAmount(e.target.value)}
              placeholder="0"
              className="min-w-0 flex-1 bg-transparent outline-none text-2xl font-black text-slate-950 placeholder:text-slate-300"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 gap-2">
          <button
            onClick={handleZbCheckout}
            disabled={isProcessing || !validateAmount()}
            className="h-12 rounded-[24px] bg-[#7c3aed] text-white text-[11px] font-black flex items-center justify-center gap-2 shadow-[0_10px_24px_rgba(124,58,237,0.26)] disabled:opacity-45 transition-all active:scale-[0.98]"
          >
            {isProcessing ? <Loader2 size={16} className="animate-spin" /> : <CreditCard size={15} />}
            Pay with ZB
          </button>
          <button
            onClick={handleAutoSystemPayment}
            disabled={isProcessing || !validateAmount()}
            className="h-12 rounded-[24px] bg-[#ecfdf5] text-[#16a34a] text-[11px] font-black flex items-center justify-center gap-2 disabled:opacity-45 transition-all active:scale-[0.98]"
          >
            <ShieldCheck size={15} />
            Auto system receipt
          </button>
        </div>
      </section>

      <section className="rounded-[24px] border border-slate-200 bg-white p-4 shadow-[0_10px_28px_rgba(15,23,42,0.06)]">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Receipt size={15} className="text-[#7c3aed]" />
            <h2 className="text-sm font-black">Recent payments</h2>
          </div>
          <span className="text-[10px] font-black text-slate-400">{studentPayments.length} total</span>
        </div>
        <div className="space-y-2">
          {studentPayments.length === 0 ? (
            <div className="rounded-2xl bg-slate-50 p-4 text-[10px] font-bold text-slate-400">No payment records yet.</div>
          ) : studentPayments.slice(0, 5).map(payment => (
            <div key={payment.id} className="rounded-2xl bg-slate-50 px-3 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-white grid place-items-center text-[#7c3aed] shadow-sm">
                <Receipt size={14} />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[11px] font-black truncate">{payment.method}</p>
                <p className="text-[9px] font-bold text-slate-400">{new Date(payment.timestamp).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black">{currency(payment.amount)}</span>
                <button
                  onClick={() => openDownloadModal(payment)}
                  className="h-8 w-8 rounded-full bg-white text-[#7c3aed] grid place-items-center shadow-sm active:scale-95 transition-transform"
                  title="Download receipt"
                >
                  <Download size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {zbPopup && (
        <div className="fixed left-5 right-5 top-5 z-[1200] max-w-sm mx-auto rounded-[26px] bg-white/85 backdrop-blur-2xl border border-white shadow-[0_24px_60px_rgba(15,23,42,0.18)] p-4 animate-parent-tab">
          <div className="flex items-start gap-3">
            <div className="h-9 w-9 rounded-full bg-rose-100 grid place-items-center text-rose-600 shrink-0">
              <AlertCircle size={17} />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-black">ZB has not approved yet</p>
              <p className="text-[11px] font-bold text-slate-500 mt-0.5">Please try again later or use the auto system receipt for office processing.</p>
            </div>
            <button onClick={() => setZbPopup(false)} className="text-slate-400"><X size={16} /></button>
          </div>
        </div>
      )}

      {receipt && (
        <div className="fixed inset-0 z-[1100] bg-[#2e1065]/55 backdrop-blur-xl grid place-items-center p-5">
          <div className="w-full max-w-sm rounded-[34px] bg-white p-6 text-center shadow-[0_30px_90px_rgba(46,16,101,0.36)] animate-parent-tab">
            <div className="mx-auto h-20 w-20 rounded-full bg-emerald-100 grid place-items-center text-emerald-600 animate-receipt-tick">
              <CheckCircle2 size={42} strokeWidth={2.8} />
            </div>
            <h3 className="mt-4 text-2xl font-black tracking-tight">Fees paid</h3>
            <p className="mt-1 text-xs font-bold text-slate-500">Auto system receipt created</p>
            <div className="mt-5 rounded-[24px] bg-[#fbf8ff] p-4 text-left space-y-3">
              <div className="flex justify-between gap-4 text-xs"><span className="font-bold text-slate-500">Student</span><span className="font-black text-right">{studentProfile.fullName}</span></div>
              <div className="flex justify-between gap-4 text-xs"><span className="font-bold text-slate-500">Parent</span><span className="font-black text-right">{parentProfile?.name || user?.name}</span></div>
              <div className="flex justify-between gap-4 text-xs"><span className="font-bold text-slate-500">Term</span><span className="font-black">{receipt.term}</span></div>
              <div className="flex justify-between gap-4 text-xs"><span className="font-bold text-slate-500">Amount</span><span className="font-black">{currency(receipt.amount)}</span></div>
              <div className="flex justify-between gap-4 text-xs"><span className="font-bold text-slate-500">Receipt</span><span className="font-black">{receipt.reference}</span></div>
            </div>
            <button onClick={() => setReceipt(null)} className="mt-5 h-12 w-full rounded-[24px] bg-[#7c3aed] text-white text-[11px] font-black shadow-[0_14px_30px_rgba(124,58,237,0.28)]">Done</button>
          </div>
        </div>
      )}

      {downloadPayment && (
        <div className="fixed inset-0 z-[1150] bg-[#2e1065]/45 backdrop-blur-xl grid place-items-center p-5">
          <div className="w-full max-w-xs rounded-[30px] bg-white p-5 shadow-[0_30px_90px_rgba(46,16,101,0.36)] animate-parent-tab">
            {downloadStep === 'choose' ? (
              <>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black text-[#8b5cf6] uppercase tracking-widest">Download receipt</p>
                    <h3 className="mt-1 text-xl font-black tracking-tight">{currency(downloadPayment.amount)}</h3>
                    <p className="text-[11px] font-bold text-slate-500">{new Date(downloadPayment.timestamp).toLocaleDateString()}</p>
                  </div>
                  <button onClick={closeDownloadModal} className="h-8 w-8 rounded-full bg-[#fbf8ff] text-slate-400 grid place-items-center">
                    <X size={15} />
                  </button>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => startReceiptDownload('pdf')}
                    className="h-20 rounded-[24px] bg-[#7c3aed] text-white flex flex-col items-center justify-center gap-2 text-[11px] font-black shadow-[0_14px_30px_rgba(124,58,237,0.28)] active:scale-[0.98] transition-transform"
                  >
                    <Receipt size={18} />
                    PDF
                  </button>
                  <button
                    onClick={() => startReceiptDownload('image')}
                    className="h-20 rounded-[24px] bg-[#f2e8ff] text-[#7c3aed] flex flex-col items-center justify-center gap-2 text-[11px] font-black active:scale-[0.98] transition-transform"
                  >
                    <Download size={18} />
                    Image
                  </button>
                </div>
              </>
            ) : (
              <div className="py-4 text-center">
                <div className="relative mx-auto h-24 w-24 rounded-full grid place-items-center">
                  <div className="absolute inset-0 rounded-full border-[7px] border-[#efe3ff]" />
                  <div className="absolute inset-0 rounded-full border-[7px] border-[#7c3aed] border-t-transparent animate-spin" />
                  <span className="relative text-3xl font-black text-[#7c3aed]">{downloadCountdown}</span>
                </div>
                <h3 className="mt-5 text-lg font-black tracking-tight">{RECEIPT_DOWNLOAD_LOADING_TEXT}</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">{downloadCountdown} second{downloadCountdown === 1 ? '' : 's'}</p>
                <p className="mt-4 text-[10px] font-black uppercase tracking-widest text-slate-400">
                  Preparing {downloadFormat === 'pdf' ? 'PDF' : 'image'} receipt
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
