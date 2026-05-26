
import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../../store/useStore';
import { 
  DollarSign, 
  CreditCard, 
  ShieldCheck, 
  ArrowRight, 
  CheckCircle2, 
  Download, 
  History,
  Lock,
  Info,
  Loader2,
  Smartphone,
  X,
  Printer,
  FileText,
  BadgeCheck,
  Bell,
  Wallet,
  ArrowLeft,
  ChevronRight
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { PaymentRecord } from '../../types';

const GatewayBg = "https://i.ibb.co/JR5Bhxpy/profileher.jpg";
const LogoImg = "https://i.ibb.co/spSVqW8s/definedlogo.png";
const PAYMENT_API_BASE_URL = ((import.meta as any).env?.VITE_PAYMENT_API_BASE_URL || 'https://defined-domain-payments.vercel.app').replace(/\/$/, '');

export const SchoolFees: React.FC = () => {
  const { user, students, parents, settings, updateStudent, notify, payments, addPayment, notices } = useStore();
  const [paymentAmount, setPaymentAmount] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isGeneratingAll, setIsGeneratingAll] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [cardNumber, setCardNumber] = useState('');

  const studentProfile = useMemo(() => {
    if (user?.role === 'STUDENT') return students.find(s => s.firebaseUid === user.id);
    if (user?.role === 'PARENT') {
      const parent = parents.find(p => p.firebaseUid === user.id);
      return parent ? students.find(s => s.id === parent.studentId) : null;
    }
    return null;
  }, [user, students, parents]);

  const studentPayments = useMemo(() => 
    payments.filter(p => p.studentId === studentProfile?.id)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()),
    [payments, studentProfile]
  );

  const totalFees = settings.feesAmount;
  const paidFees = studentProfile?.totalPaid || 0;
  const balance = Math.max(0, totalFees - paidFees);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const orderReference = params.get('orderReference');
    if (params.get('payment') === 'return' && orderReference) {
      notify('info', `Payment returned from Smile&Pay. Confirmation is being processed for ${orderReference}.`);
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [notify]);

  const handlePayment = async () => {
    if (!paymentAmount || !studentProfile || !studentProfile.firebaseUid) return;
    const amount = parseFloat(paymentAmount);
    if (isNaN(amount) || amount <= 0) {
      notify('error', 'Invalid amount.');
      return;
    }

    if (amount > balance && balance > 0) {
      notify('error', 'Amount cannot be more than the current balance.');
      return;
    }

    setIsProcessing(true);
    try {
      const response = await fetch(`${PAYMENT_API_BASE_URL}/api/initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount,
          studentId: studentProfile.id,
          studentName: studentProfile.fullName,
          studentFirebaseUid: studentProfile.firebaseUid,
          parentUserId: user?.id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success || !data.paymentUrl) {
        throw new Error(data.message || 'Payment initiation failed.');
      }

      window.location.href = data.paymentUrl;
    } catch (error: any) {
      notify('error', error.message || 'Could not open Smile&Pay checkout.');
      setIsProcessing(false);
    }
  };

  const handleManualMockPayment = async () => {
    if (!paymentAmount || !studentProfile || !studentProfile.firebaseUid) return;
    const amount = parseFloat(paymentAmount);
    setIsProcessing(true);
    try {
      await addPayment({
        studentId: studentProfile.id,
        studentName: studentProfile.fullName,
        amount,
        method: 'Manual',
        isMock: true,
        timestamp: new Date().toISOString()
      });
      await updateStudent(studentProfile.firebaseUid, { totalPaid: paidFees + amount });
      setShowSuccess(true);
      setPaymentAmount('');
    } finally {
      setIsProcessing(false);
    }
  };

  const generateStatementPDF = async () => {
    if (!studentProfile) return;
    setIsGeneratingAll(true);
    const doc = new jsPDF();
    doc.setFontSize(20);
    doc.text('FEES STATEMENT', 15, 20);
    autoTable(doc, {
      startY: 30,
      head: [['Date', 'Method', 'Amount (USD)']],
      body: studentPayments.map(p => [new Date(p.timestamp).toLocaleDateString(), p.method, `$${p.amount}`]),
    });
    doc.save(`Statement_${studentProfile.id}.pdf`);
    setIsGeneratingAll(false);
  };

  if (!studentProfile) return <div className="p-20 text-center font-black animate-pulse uppercase tracking-widest text-slate-400">Syncing Ledger...</div>;

  return (
    <div className="space-y-1 animate-in fade-in duration-500 pb-10 selection:bg-blue-100">
      {/* 1. Compact Hero Header */}
      <header className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-none flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-blue-600 text-white rounded-none">
            <DollarSign size={20} />
          </div>
          <div>
            <h1 className="text-lg font-black uppercase text-slate-900 dark:text-white leading-none tracking-tight">Tuition Registry</h1>
            <p className="text-[9px] font-bold text-slate-400 mt-1 uppercase tracking-widest italic">{studentProfile.fullName} // ID: {studentProfile.id}</p>
          </div>
        </div>
        <div className="flex gap-1">
           <button onClick={generateStatementPDF} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-[9px] font-black uppercase tracking-widest text-slate-600 hover:bg-slate-200 transition-all border border-slate-200 dark:border-slate-700">
              {isGeneratingAll ? <Loader2 size={14} className="animate-spin" /> : 'Statement'}
           </button>
        </div>
      </header>

      {/* 2. Colored Summary Cards - Rectangular & Compact */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-1">
        <div className="bg-white dark:bg-slate-900 p-5 border border-slate-200 dark:border-slate-800 rounded-none">
          <p className="text-[8px] font-black uppercase text-slate-400 tracking-widest mb-1">Total Term Fees</p>
          <h3 className="text-2xl font-black font-mono text-slate-900 dark:text-white">${totalFees.toLocaleString()}</h3>
        </div>
        <div className="bg-emerald-50 dark:bg-emerald-950/20 p-5 border border-emerald-100 dark:border-emerald-800 rounded-none">
          <p className="text-[8px] font-black uppercase text-emerald-600 tracking-widest mb-1">Total Paid</p>
          <h3 className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-400">${paidFees.toLocaleString()}</h3>
        </div>
        <div className="bg-rose-50 dark:bg-rose-950/20 p-5 border border-rose-100 dark:border-rose-800 rounded-none">
          <p className="text-[8px] font-black uppercase text-rose-600 tracking-widest mb-1">Current Balance</p>
          <h3 className="text-2xl font-black font-mono text-rose-700 dark:text-rose-400">${balance.toLocaleString()}</h3>
        </div>
      </div>

      {/* 3. Payment Methods & History Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-1">
        {/* Payment Action Area */}
        <div className="lg:col-span-8 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-6 space-y-6">
           <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <CreditCard size={14} className="text-blue-600" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-white">Make a Payment</h3>
           </div>
           
           <div className="pt-4 animate-in slide-in-from-top-2 duration-300">
              <div className="bg-slate-50 dark:bg-slate-950 p-6 border border-slate-100 dark:border-slate-800 space-y-5">
                 <div className="space-y-2">
                    <label className="text-[8px] font-black uppercase text-slate-400">Amount to pay (USD)</label>
                    <input 
                      type="number" 
                      value={paymentAmount} 
                      onChange={e => setPaymentAmount(e.target.value)}
                      placeholder="0.00" 
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 font-black font-mono text-xl outline-none focus:border-blue-600" 
                    />
                 </div>
                 <button 
                  onClick={handlePayment} 
                  disabled={isProcessing || !paymentAmount}
                  className="w-full py-4 bg-slate-900 dark:bg-blue-600 text-white font-black uppercase text-[10px] tracking-[0.2em] shadow-lg disabled:opacity-50 active:scale-95 transition-all"
                 >
                   {isProcessing ? <Loader2 className="animate-spin mx-auto" /> : 'Open ZB Smile&Pay Checkout'}
                 </button>
                 <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest text-center">
                  ZB Smile&Pay will ask for the payment method, phone number, card details, and confirmation on its hosted page.
                 </p>
              </div>
           </div>
        </div>

        {/* Audit Registry (History) */}
        <div className="lg:col-span-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none p-6 space-y-4">
           <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <History size={14} className="text-slate-400" />
              <h3 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Audit History</h3>
           </div>
           <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {studentPayments.length === 0 ? (
                <p className="text-[9px] font-bold text-slate-300 text-center py-10 uppercase italic">No logs found</p>
              ) : studentPayments.map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 border border-slate-50 dark:border-slate-800 hover:bg-slate-50 transition-all group">
                   <div>
                      <p className="text-[10px] font-black text-slate-900 dark:text-white uppercase leading-none">{p.method}</p>
                      <p className="text-[8px] font-mono text-slate-400 mt-1">{new Date(p.timestamp).toLocaleDateString()}</p>
                   </div>
                   <span className="text-xs font-black font-mono text-emerald-600">${p.amount}</span>
                </div>
              ))}
           </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccess && (
        <div className="fixed inset-0 z-[1000] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 p-12 text-center space-y-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 rounded-none animate-in zoom-in-95">
            <CheckCircle2 size={48} className="text-emerald-500 mx-auto" />
            <h3 className="text-xl font-black uppercase tracking-tight dark:text-white">Transaction Logged</h3>
            <button onClick={() => setShowSuccess(false)} className="w-full py-4 bg-black dark:bg-blue-600 text-white font-black uppercase text-[10px] tracking-widest rounded-none">Close Registry</button>
          </div>
        </div>
      )}
    </div>
  );
};
