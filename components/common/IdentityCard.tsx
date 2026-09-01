import React from 'react';
import { ShieldCheck, User } from 'lucide-react';
import { Student } from '../../types';

export const LogoImg = 'https://i.ibb.co/spSVqW8s/definedlogo.png';
export const CARD_WIDTH = 856;
export const CARD_HEIGHT = 540;

export const formatCardDate = (value: Date) =>
  value.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }).toUpperCase();

export const getCardDates = (student: Student) => {
  const parsed = student.idCardIssuedAt ? new Date(student.idCardIssuedAt) : new Date('2026-09-01T00:00:00.000Z');
  const issueDate = Number.isNaN(parsed.getTime()) ? new Date('2026-09-01T00:00:00.000Z') : parsed;
  const storedExpiry = student.idCardExpiresAt ? new Date(student.idCardExpiresAt) : null;
  const expiryDate = storedExpiry && !Number.isNaN(storedExpiry.getTime()) ? storedExpiry : new Date(issueDate);
  if (!storedExpiry || Number.isNaN(storedExpiry.getTime())) expiryDate.setFullYear(expiryDate.getFullYear() + 2);
  return { issueDate: formatCardDate(issueDate), expiryDate: formatCardDate(expiryDate) };
};

export const StudentPhoto: React.FC<{ student: Student }> = ({ student }) => (
  student.idCardImageUrl || student.imageUrl ? (
    <img src={student.idCardImageUrl || student.imageUrl} alt={student.fullName} className="h-full w-full object-cover" crossOrigin="anonymous" />
  ) : (
    <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-slate-100 text-slate-300">
      <User size={54} />
      <span className="text-xs font-black uppercase tracking-widest">Student photo</span>
    </div>
  )
);

export const IdentityCard = React.forwardRef<HTMLDivElement, {
  student: Student;
  showingBack: boolean;
  qrDataUrl: string;
}>(({ student, showingBack, qrDataUrl }, ref) => {
  const { issueDate, expiryDate } = getCardDates(student);

  return (
    <div ref={ref} className="relative h-[540px] w-[856px] overflow-hidden rounded-[22px] border-2 border-slate-200 bg-white font-sans shadow-2xl">
      {!showingBack ? (
        <>
          <div className="absolute -right-10 top-32 h-[360px] w-[360px] opacity-[0.04]">
            <img src={LogoImg} alt="" className="h-full w-full object-contain grayscale" crossOrigin="anonymous" />
          </div>

          <header className="relative z-10 flex h-[106px] items-center justify-between overflow-hidden bg-gradient-to-r from-[#16052f] via-[#3b0a72] to-[#6d28d9] px-8">
            <div className="absolute inset-y-0 left-[46%] w-44 -skew-x-[28deg] bg-gradient-to-br from-violet-300/30 via-fuchsia-400/20 to-transparent" />
            <div className="absolute -right-8 -top-16 h-48 w-72 rotate-[-12deg] bg-gradient-to-br from-violet-400/70 via-purple-600/35 to-transparent [clip-path:polygon(24%_0,100%_0,76%_100%,0_72%)]" />
            <div className="absolute -bottom-20 right-32 h-40 w-56 rotate-[16deg] bg-gradient-to-tr from-fuchsia-500/30 to-violet-200/25 [clip-path:polygon(0_28%,100%_0,80%_100%,12%_82%)]" />
            <div className="absolute left-1/2 top-2 h-3 w-16 -translate-x-1/2 rounded-full border border-white/30 bg-white/20" />
            <div className="absolute bottom-0 left-0 h-4 w-full bg-gradient-to-r from-violet-600 via-emerald-500 to-emerald-500 [clip-path:polygon(0_15%,100%_70%,100%_100%,0_100%)]" />
            <div className="z-10 flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-emerald-500 bg-white p-1.5 shadow-md">
                <img src={LogoImg} alt="Defined Domains" className="h-full w-full object-contain" crossOrigin="anonymous" />
              </div>
              <div>
                <h2 className="text-[25px] font-black uppercase leading-none tracking-wider text-white">Defined Domains</h2>
                <p className="mt-1.5 text-[11px] font-extrabold uppercase tracking-[0.18em] text-[#4ade80]">Inclusive School</p>
              </div>
            </div>
            <div className="z-10 flex items-center gap-3 rounded-xl border border-white/25 bg-gradient-to-r from-purple-950/80 to-violet-700/70 px-3.5 py-2 shadow-lg backdrop-blur-sm">
              <ShieldCheck className="text-violet-200" size={25} />
              <div className="whitespace-nowrap text-left text-[11px] font-black uppercase tracking-[0.16em] text-white">Student <span className="text-violet-200">ID</span></div>
            </div>
          </header>

          <div className="relative z-10 flex h-[398px] gap-6 px-8 py-5">
            <div className="flex w-[210px] shrink-0 flex-col items-center justify-start">
              <div className="w-[205px] overflow-hidden rounded-[16px] border-2 border-[#0b1b36] bg-slate-100 shadow-md">
                <div className="h-[210px] w-full"><StudentPhoto student={student} /></div>
                <div className="border-t-2 border-emerald-500 bg-[#0b1b36] px-2 py-2.5 text-center">
                  <p className="text-[9.5px] font-black uppercase tracking-widest text-[#4ade80]">Student ID</p>
                  <p className="mt-0.5 font-mono text-[16px] font-black leading-tight tracking-wider text-white">{student.id.toUpperCase()}</p>
                </div>
              </div>
            </div>

            <div className="flex min-w-0 flex-1 flex-col justify-between">
              <div>
                <p className="text-[9px] font-black uppercase tracking-[0.18em] text-violet-600">Full name</p>
                <h3 className="mt-1 truncate text-[28px] font-black uppercase leading-tight tracking-tight text-[#0b1b36]">{student.fullName}</h3>
              </div>

              <div className="flex items-stretch gap-3">
                <div className="flex-1 rounded-xl border border-slate-200 bg-slate-50/80 p-3 shadow-sm">
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2.5 text-left">
                    <div className="col-span-2 border-b border-slate-200 pb-2">
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">School</p>
                      <p className="mt-0.5 text-[13px] font-black uppercase tracking-wide text-[#0b1b36]">Defined Domains Inclusive School</p>
                    </div>
                    <div>
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Student ID</p>
                      <p className="mt-0.5 font-mono text-[12.5px] font-black text-[#0b1b36]">{student.id.toUpperCase()}</p>
                    </div>
                    <div>
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Grade / Class</p>
                      <p className="mt-0.5 text-[12.5px] font-black uppercase text-[#16a34a]">{student.assignedClass || 'General'}</p>
                    </div>
                    <div>
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Academic year</p>
                      <p className="mt-0.5 text-[12.5px] font-black text-[#0b1b36]">{student.idCardAcademicYear || new Date().getFullYear()}</p>
                    </div>
                    <div>
                      <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Issued</p>
                      <p className="mt-0.5 text-[12.5px] font-black text-[#0b1b36]">{issueDate}</p>
                    </div>
                    <div className="col-span-2 border-t border-slate-200 pt-2 flex items-center justify-between">
                      <div>
                        <p className="text-[8.5px] font-black uppercase tracking-widest text-slate-400">Expiration date</p>
                        <p className="mt-0.5 text-[12.5px] font-black text-rose-600">{expiryDate}</p>
                      </div>
                      <span className="rounded bg-emerald-100 border border-emerald-300 px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-emerald-800">Official ID</span>
                    </div>
                  </div>
                </div>

                <div className="flex w-[116px] shrink-0 flex-col items-center justify-between rounded-xl border border-slate-200 bg-white p-2.5 text-center shadow-sm">
                  <div className="rounded-lg border-2 border-[#0b1b36] bg-white p-1">
                    {qrDataUrl ? <img src={qrDataUrl} alt="Verification QR code" className="h-[80px] w-[80px]" /> : <div className="h-[80px] w-[80px] animate-pulse bg-slate-100" />}
                  </div>
                  <div className="w-full">
                    <span className="block rounded bg-emerald-600 py-1 text-[8px] font-black uppercase tracking-wider text-white">Scan to verify</span>
                    <p className="mt-1 text-[8px] font-bold uppercase tracking-wider text-slate-400">Secure Live ID</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between border-t border-slate-100 pt-2 text-[8.5px] font-bold uppercase tracking-wider text-slate-400">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span>Defined Domains Inclusive School • Verified Credential</span>
                </div>
                <span className="font-mono text-slate-500">{student.id.toUpperCase()}</span>
              </div>
            </div>
          </div>

          <footer className="relative z-10 flex h-[36px] items-center justify-center overflow-hidden border-t border-violet-300/50 bg-gradient-to-r from-[#16052f] via-[#3b0a72] to-[#6d28d9] text-[10px] font-extrabold uppercase tracking-[0.25em] text-violet-100">
            <div className="absolute inset-y-0 left-[15%] w-36 -skew-x-[32deg] bg-violet-300/20" />
            <div className="absolute inset-y-0 right-[8%] w-52 skew-x-[34deg] bg-gradient-to-r from-fuchsia-500/25 to-violet-300/25" />
            <span className="relative z-10">Integrity <span className="mx-4 text-emerald-300">•</span> Inclusion <span className="mx-4 text-emerald-300">•</span> Empowerment <span className="mx-4 text-emerald-300">•</span> Security <span className="mx-4 text-emerald-300">•</span> Trust</span>
          </footer>
        </>
      ) : (
        <>
          <header className="relative flex h-[104px] items-center justify-between overflow-hidden bg-gradient-to-r from-[#16052f] via-[#3b0a72] to-[#6d28d9] px-8">
            <div className="absolute inset-y-0 left-[44%] w-48 -skew-x-[28deg] bg-gradient-to-br from-violet-300/30 via-fuchsia-400/20 to-transparent" />
            <div className="absolute -right-8 -top-16 h-48 w-72 rotate-[-12deg] bg-gradient-to-br from-violet-400/70 via-purple-600/35 to-transparent [clip-path:polygon(24%_0,100%_0,76%_100%,0_72%)]" />
            <div className="absolute -bottom-20 right-32 h-40 w-56 rotate-[16deg] bg-gradient-to-tr from-fuchsia-500/30 to-violet-200/25 [clip-path:polygon(0_28%,100%_0,80%_100%,12%_82%)]" />
            <div className="absolute left-1/2 top-2 h-3 w-16 -translate-x-1/2 rounded-full border border-white/30 bg-white/20" />
            <div className="flex items-center gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-full border-2 border-emerald-500 bg-white p-1.5"><img src={LogoImg} alt="Defined Domains" crossOrigin="anonymous" /></div>
              <div><h3 className="text-[22px] font-black uppercase leading-none tracking-wider text-white">Defined Domains</h3><p className="mt-1 text-[10px] font-bold uppercase tracking-[0.2em] text-[#4ade80]">Terms of use & student record</p></div>
            </div>
            <span className="relative z-10 rounded-xl border border-white/25 bg-gradient-to-r from-purple-950/80 to-violet-700/70 px-3.5 py-2 text-[10px] font-black uppercase tracking-wider text-violet-100 shadow-lg backdrop-blur-sm">Campus security</span>
          </header>

          <div className="relative flex h-[400px] items-center justify-between gap-7 overflow-hidden bg-gradient-to-br from-[#25064a] via-[#4c1588] to-[#6d28d9] px-8 py-6">
            <div className="absolute inset-0 opacity-25 [background-image:radial-gradient(circle_at_center,rgba(255,255,255,0.45)_1px,transparent_1px)] [background-size:18px_18px]" />
            <div className="absolute -left-14 bottom-[-78px] h-80 w-80 rounded-full border-[38px] border-violet-300/10" />
            <div className="absolute left-8 top-24 h-52 w-52 opacity-[0.07]"><img src={LogoImg} alt="" className="h-full w-full object-contain grayscale brightness-0 invert" crossOrigin="anonymous" /></div>
            <div className="absolute bottom-[-96px] right-28 h-44 w-80 rotate-[-12deg] bg-fuchsia-500/30 [clip-path:polygon(0_40%,100%_0,88%_100%,12%_78%)]" />
            <div className="absolute bottom-[-90px] right-[-40px] h-48 w-72 rotate-[8deg] bg-gradient-to-r from-orange-400/80 to-rose-500/80 [clip-path:polygon(0_25%,100%_0,100%_100%,14%_80%)]" />

            <div className="relative z-10 flex h-full flex-1 flex-col justify-between pr-3 text-white">
              <div className="max-w-[470px] text-center">
                <h4 className="text-[17px] font-black uppercase tracking-[0.12em]">Defined Domains Student ID Card</h4>
                <p className="mx-auto mt-3 max-w-[420px] text-[11px] font-medium leading-relaxed text-violet-100">
                  This card is the property of Defined Domains Inclusive School and remains valid only for the student identified on the front.
                </p>
                <div className="mx-auto mt-3 max-w-[430px] space-y-1.5 text-[10px] font-semibold leading-relaxed text-white/85">
                  <p>Report loss or damage immediately to the school administration.</p>
                  <p>Tampering with or misuse of this card is strictly prohibited.</p>
                </div>
              </div>

              <div className="grid max-w-[500px] grid-cols-2 gap-3">
                <section className="rounded-xl border border-white/20 bg-purple-950/35 p-3 backdrop-blur-sm">
                  <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-rose-200">Emergency contact</p>
                  <p className="mt-1.5 truncate text-[12px] font-black">{student.parentName || 'Parent / Guardian'}</p>
                  <p className="mt-0.5 font-mono text-[11px] font-bold text-white">{student.parentPhone || 'Not recorded'}</p>
                </section>
                <section className="rounded-xl border border-white/20 bg-purple-950/35 p-3 backdrop-blur-sm">
                  <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-violet-200">Return address</p>
                  <p className="mt-1.5 text-[10.5px] font-bold leading-relaxed">24 Eliot Street, Rhodene,<br/>Masvingo, Zimbabwe</p>
                </section>
                <section className="col-span-2 rounded-xl border border-white/20 bg-purple-950/35 px-3 py-2.5 backdrop-blur-sm">
                  <p className="text-[8.5px] font-black uppercase tracking-[0.18em] text-emerald-200">School details</p>
                  <div className="mt-1.5 flex items-center gap-5 text-[10px] font-bold"><span>+263 775 926 454</span><span>admin@defineddomain.com</span><span>defineddomain.com</span></div>
                </section>
              </div>
            </div>

            <div className="relative z-10 flex w-[230px] shrink-0 flex-col items-center rounded-[20px] border border-white/70 bg-white p-4 text-center shadow-[0_18px_45px_rgba(22,5,47,0.35)]">
              <p className="mb-2 text-[9px] font-black uppercase tracking-[0.18em] text-violet-800">Scan to verify</p>
              <div className="rounded-xl border-2 border-violet-950 bg-white p-2">
                {qrDataUrl ? <img src={qrDataUrl} alt="Verification QR code" className="h-[150px] w-[150px]" /> : <div className="h-[150px] w-[150px] animate-pulse bg-slate-100" />}
              </div>
              <div className="mt-3 w-full border-t border-slate-200 pt-3">
                <p className="font-mono text-[10px] font-black text-violet-950">{student.id.toUpperCase()}</p>
                <p className="mt-1 text-[8.5px] font-bold uppercase tracking-wider text-emerald-600">Live identity record</p>
              </div>
            </div>
          </div>

          <footer className="relative flex h-[36px] items-center justify-between overflow-hidden border-t border-violet-300/50 bg-gradient-to-r from-[#16052f] via-[#3b0a72] to-[#6d28d9] px-8">
            <div className="absolute inset-y-0 left-[18%] w-36 -skew-x-[32deg] bg-violet-300/20" />
            <div className="absolute inset-y-0 right-[8%] w-52 skew-x-[34deg] bg-gradient-to-r from-fuchsia-500/25 to-violet-300/25" />
            <span className="relative z-10 font-mono text-[10px] font-bold uppercase tracking-widest text-violet-100">ID: {student.id.toUpperCase()}</span>
            <span className="relative z-10 text-[9.5px] font-bold uppercase tracking-wider text-emerald-300">Property of Defined Domains Inclusive School</span>
          </footer>
        </>
      )}
    </div>
  );
});

IdentityCard.displayName = 'IdentityCard';
