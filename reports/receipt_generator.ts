import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import QRCode from 'qrcode';
import { Parent, PaymentRecord, Student } from '../types';

export type ReceiptDownloadFormat = 'pdf' | 'image';

export const RECEIPT_DOWNLOAD_COUNTDOWN_SECONDS = 3;
export const RECEIPT_DOWNLOAD_LOADING_TEXT = 'Your download should start within';

const SCHOOL_LOGO_URL = 'https://i.ibb.co/spSVqW8s/definedlogo.png';
const SCHOOL_DETAILS = {
  name: 'Defined Domain Day Services',
  address: '27 Colnebrook Lane, Harare',
  email: 'admin@defineddomain.com',
  phone: '+263 775 926 454',
};

const BRAND = {
  headerBg:   [15, 52, 96]   as [number, number, number],
  sectionBg:  [0, 112, 163]  as [number, number, number],
  sectionText:[255,255,255]  as [number, number, number],
  labelText:  [80, 80, 80]   as [number, number, number],
  valueText:  [15, 15, 15]   as [number, number, number],
  borderLight:[220,230,240]  as [number, number, number],
  white:      [255,255,255]  as [number, number, number],
  footerText: [120,120,120]  as [number, number, number],
  amountGreen:[0, 128, 80]   as [number, number, number],
  stampGreen: [0, 140, 70]   as [number, number, number],
};

export interface ReceiptGeneratorData {
  payment: PaymentRecord;
  student: Student;
  parent?: Parent | null;
  term?: string;
  totalFees: number;
  paidFees: number;
  balance: number;
}

const currency = (amount: number) =>
  `$${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const receiptReference = (payment: PaymentRecord) =>
  payment.reference || payment.verificationHash || payment.id;

const termFromPayment = (payment: PaymentRecord, fallback?: string) => {
  const match = payment.method.match(/Term\s+[123]/i);
  return match?.[0] || fallback || 'Current Term';
};

const loadImage = (src: string) =>
  new Promise<HTMLImageElement>((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload  = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const loadImageDataUrl = async (src: string) => {
  const img = await loadImage(src);
  const c = document.createElement('canvas');
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext('2d');
  if (!ctx) return null;
  ctx.drawImage(img, 0, 0);
  return c.toDataURL('image/png');
};

const generateQrDataUrl = (data: ReceiptGeneratorData): Promise<string> => {
  const reference = receiptReference(data.payment);
  const qrText = [
    'DEFINED DOMAIN RECEIPT',
    `Ref: ${reference}`,
    `Student: ${data.student.fullName} (${data.student.id})`,
    `Amount: ${currency(data.payment.amount)}`,
    `Term: ${termFromPayment(data.payment, data.term)}`,
    `Date: ${new Date(data.payment.timestamp).toLocaleString()}`,
    `Balance: ${currency(data.balance)}`,
  ].join(' | ');

  return QRCode.toDataURL(qrText, {
    errorCorrectionLevel: 'M',
    width: 256,
    margin: 1,
    color: { dark: '#0a0a0a', light: '#ffffff' },
  });
};

export const getReceiptFileName = (data: ReceiptGeneratorData, extension: 'pdf' | 'png') => {
  const ref = receiptReference(data.payment).replace(/[^a-z0-9-]/gi, '_');
  return `Defined_Domain_Receipt_${data.student.id}_${ref}.${extension}`;
};

// ─── PDF ──────────────────────────────────────────────────────────────────────

export const generateReceiptPdf = async (data: ReceiptGeneratorData) => {
  const doc  = new jsPDF({ unit: 'mm', format: 'a4' });
  const ref  = receiptReference(data.payment);
  const term = termFromPayment(data.payment, data.term);
  const pageW  = 210;
  const pageH  = 297;
  const margin = 14;
  const contentW = pageW - margin * 2;
  const ROW_H  = 10; // taller rows

  // ── Header ────────────────────────────────────────────────────────────────
  doc.setFillColor(...BRAND.headerBg);
  doc.rect(0, 0, pageW, 40, 'F');

  try {
    const logoUrl = await loadImageDataUrl(SCHOOL_LOGO_URL);
    if (logoUrl) {
      doc.setFillColor(...BRAND.white);
      doc.circle(margin + 11, 20, 11, 'F');
      doc.addImage(logoUrl, 'PNG', margin + 3, 12, 16, 16);
    }
  } catch { /* skip */ }

  doc.setTextColor(...BRAND.white);
  doc.setFont('helvetica', 'bold');   doc.setFontSize(16);
  doc.text('DEFINED DOMAIN', margin + 26, 16);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8.5);
  doc.text(SCHOOL_DETAILS.name,    margin + 26, 23);
  doc.text(SCHOOL_DETAILS.address, margin + 26, 29);
  doc.text(`${SCHOOL_DETAILS.email}   ${SCHOOL_DETAILS.phone}`, margin + 26, 35);

  doc.setFont('helvetica', 'bold');   doc.setFontSize(10);
  doc.text('Official School Fees Receipt', pageW - margin, 15, { align: 'right' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(`Receipt No: ${ref}`, pageW - margin, 23, { align: 'right' });
  doc.text(new Date(data.payment.timestamp).toLocaleString(), pageW - margin, 30, { align: 'right' });

  // ── Title ─────────────────────────────────────────────────────────────────
  doc.setTextColor(...BRAND.valueText);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text('Transaction Notification', margin, 53);
  doc.setDrawColor(...BRAND.borderLight); doc.setLineWidth(0.4);
  doc.line(margin, 57, pageW - margin, 57);

  // ── Dear paragraph ────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
  doc.setTextColor(...BRAND.labelText);
  doc.text('Dear Sir/Madam', margin, 65);
  doc.text(
    `Please note that the following transaction has been processed on the account of ${data.student.fullName.toUpperCase()}.`,
    margin, 71
  );

  // ── QR code generated early, placed at bottom later ──────────────────────
  let qrDataUrl: string | null = null;
  try { qrDataUrl = await generateQrDataUrl(data); } catch { /* skip */ }

  // ── Section / row helpers ─────────────────────────────────────────────────
  let y = 82;

  const sectionHeader = (label: string) => {
    doc.setFillColor(...BRAND.sectionBg);
    doc.rect(margin, y, contentW, 9, 'F');
    doc.setTextColor(...BRAND.sectionText);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
    doc.text(label, margin + 3, y + 6);
    y += 9;
  };

  const detailRow = (label: string, value: string, shade: boolean, highlight = false) => {
    if (shade) {
      doc.setFillColor(245, 249, 253);
      doc.rect(margin, y, contentW, ROW_H, 'F');
    }
    doc.setDrawColor(...BRAND.borderLight); doc.setLineWidth(0.2);
    doc.line(margin, y + ROW_H, margin + contentW, y + ROW_H);

    doc.setTextColor(...BRAND.labelText);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(label, margin + 3, y + ROW_H - 3);

    doc.setTextColor(...(highlight ? BRAND.amountGreen : BRAND.valueText));
    doc.setFont('helvetica', 'bold');
    doc.text(value, margin + contentW - 3, y + ROW_H - 3, { align: 'right' });

    y += ROW_H;
  };

  // ── Payer Details ─────────────────────────────────────────────────────────
  sectionHeader('Payer Details');
  [
    ['Account / Student ID', data.student.id],
    ['Student Name',         data.student.fullName],
    ['Parent / Guardian',    data.parent?.name || data.student.parentName || '-'],
  ].forEach(([l, v], i) => detailRow(l, v, i % 2 === 1));

  y += 4;

  // ── Payment Details ───────────────────────────────────────────────────────
  sectionHeader('Payment Details');
  [
    ['Payment Date',         new Date(data.payment.timestamp).toLocaleString()],
    ['Term',                 term],
    ['Payment Method',       data.payment.method],
    ['Reference',            ref],
    ['Amount Paid',          currency(data.payment.amount)],
    ['Total Fees',           currency(data.totalFees)],
    ['Paid To Date',         currency(data.paidFees)],
    ['Balance After Payment',currency(data.balance)],
  ].forEach(([l, v], i) => detailRow(l, v, i % 2 === 1, l === 'Amount Paid'));

  y += 8;

  // ── PAID stamp box ────────────────────────────────────────────────────────
  const stampX = margin;
  const stampW = contentW;
  const stampH = 18;
  doc.setFillColor(240, 250, 244);
  doc.roundedRect(stampX, y, stampW, stampH, 3, 3, 'F');
  doc.setDrawColor(...BRAND.stampGreen); doc.setLineWidth(0.6);
  doc.roundedRect(stampX, y, stampW, stampH, 3, 3, 'S');
  doc.setTextColor(...BRAND.stampGreen);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('✓  PAYMENT RECEIVED', stampX + stampW / 2, y + 7.5, { align: 'center' });
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  doc.text(
    `${currency(data.payment.amount)} confirmed on ${new Date(data.payment.timestamp).toLocaleDateString()}`,
    stampX + stampW / 2, y + 14, { align: 'center' }
  );

  // ── QR code — centred above footer ───────────────────────────────────────
  const footerTop = pageH - 18;
  const qrSize = 30;
  const qrY = footerTop - qrSize - 12;
  if (qrDataUrl) {
    const qrX = pageW / 2 - qrSize / 2;
    doc.addImage(qrDataUrl, 'PNG', qrX, qrY, qrSize, qrSize);
    doc.setFontSize(6.5); doc.setTextColor(...BRAND.sectionBg);
    doc.text('Scan to verify receipt', pageW / 2, qrY + qrSize + 3.5, { align: 'center' });
  }

  // ── Footer — always pinned to bottom ─────────────────────────────────────
  doc.setDrawColor(...BRAND.borderLight); doc.setLineWidth(0.4);
  doc.line(margin, footerTop, pageW - margin, footerTop);
  doc.setFontSize(7); doc.setTextColor(...BRAND.footerText);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `24hr Client Care   E: ${SCHOOL_DETAILS.email}   W: defineddomain.com`,
    pageW / 2, footerTop + 4, { align: 'center' }
  );
  doc.text(
    `${SCHOOL_DETAILS.name} is an authorised private institution. Receipt generated automatically.`,
    pageW / 2, footerTop + 8.5, { align: 'center' }
  );
  doc.text(
    `Unique Document No: ${ref} | V1.0 - ${new Date().toLocaleDateString()}   Page 1 of 1`,
    pageW / 2, footerTop + 13, { align: 'center' }
  );

  doc.save(getReceiptFileName(data, 'pdf'));
};

// ─── IMAGE ────────────────────────────────────────────────────────────────────

export const generateReceiptImage = async (data: ReceiptGeneratorData) => {
  const scale = 2;
  const W = 794;
  const H = 1123;
  const canvas = document.createElement('canvas');
  canvas.width  = W * scale;
  canvas.height = H * scale;
  const ctx = canvas.getContext('2d')!;
  if (!ctx) return;
  ctx.scale(scale, scale);

  const M  = 36;
  const CW = W - M * 2; // content width
  const ROW_H = 34;

  // background
  ctx.fillStyle = '#e8edf3';
  ctx.fillRect(0, 0, W, H);

  // white card with shadow
  ctx.shadowColor = 'rgba(0,0,0,0.13)';
  ctx.shadowBlur  = 28;
  fillRoundRect(ctx, M - 4, M - 4, CW + 8, H - M * 2 + 8, 6, '#ffffff');
  ctx.shadowBlur = 0;

  // ── Header ──────────────────────────────────────────────────────────────
  fillRoundRect(ctx, M - 4, M - 4, CW + 8, 82, 6, '#0f3460');
  ctx.fillStyle = '#0f3460';
  ctx.fillRect(M - 4, M + 56, CW + 8, 26); // square out bottom corners

  const logo = await loadImage(SCHOOL_LOGO_URL).catch(() => null);
  ctx.beginPath();
  ctx.arc(M + 30, M + 40, 28, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff'; ctx.fill();
  if (logo) ctx.drawImage(logo, M + 14, M + 24, 32, 32);

  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 24px Arial, sans-serif';
  ctx.fillText('DEFINED DOMAIN', M + 70, M + 30);
  ctx.font = '500 12.5px Arial, sans-serif';
  ctx.fillText(SCHOOL_DETAILS.name,    M + 70, M + 48);
  ctx.fillText(SCHOOL_DETAILS.address, M + 70, M + 64);
  ctx.fillText(`${SCHOOL_DETAILS.email}   ${SCHOOL_DETAILS.phone}`, M + 70, M + 78);

  ctx.textAlign = 'right';
  ctx.font = 'bold 14px Arial, sans-serif';
  ctx.fillText('Official School Fees Receipt', W - M, M + 28);
  ctx.font = '500 10.5px Arial, sans-serif';
  ctx.fillText(`Receipt No: ${receiptReference(data.payment)}`, W - M, M + 46);
  ctx.fillText(new Date(data.payment.timestamp).toLocaleString(), W - M, M + 62);
  ctx.textAlign = 'left';

  // ── Title ────────────────────────────────────────────────────────────────
  let y = M + 108;
  ctx.fillStyle = '#0a1628';
  ctx.font = 'bold 22px Arial, sans-serif';
  ctx.fillText('Transaction Notification', M + 4, y);
  y += 10;
  ctx.strokeStyle = '#d0dce8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M - 4, y); ctx.lineTo(W - M + 4, y); ctx.stroke();
  y += 18;

  // ── Dear paragraph ───────────────────────────────────────────────────────
  ctx.fillStyle = '#555';
  ctx.font = '400 12.5px Arial, sans-serif';
  ctx.fillText('Dear Sir/Madam', M + 4, y);
  y += 18;
  ctx.font = '400 12px Arial, sans-serif';
  const intro = `Please note that the following transaction has been processed on the account of ${data.student.fullName.toUpperCase()}.`;
  ctx.fillText(intro, M + 4, y);
  y += 10;

  // ── QR generated early, drawn at bottom ─────────────────────────────────
  let qrDataUrl: string | null = null;
  try { qrDataUrl = await generateQrDataUrl(data); } catch { /* skip */ }

  y += 14;

  // ── Section helper ───────────────────────────────────────────────────────
  const drawSection = (title: string, rows: [string, string, boolean?][]) => {
    // header bar
    ctx.fillStyle = '#0070a3';
    ctx.fillRect(M - 4, y, CW + 8, 30);
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 13.5px Arial, sans-serif';
    ctx.fillText(title, M + 6, y + 20);
    y += 30;

    rows.forEach(([label, value, highlight], i) => {
      ctx.fillStyle = i % 2 === 0 ? '#f5f9fd' : '#ffffff';
      ctx.fillRect(M - 4, y, CW + 8, ROW_H);

      ctx.strokeStyle = '#dce8f0'; ctx.lineWidth = 0.6;
      ctx.beginPath();
      ctx.moveTo(M - 4, y + ROW_H); ctx.lineTo(W - M + 4, y + ROW_H);
      ctx.stroke();

      ctx.fillStyle = '#5a6a7a';
      ctx.font = '400 12px Arial, sans-serif';
      ctx.fillText(label, M + 8, y + ROW_H - 10);

      ctx.fillStyle = highlight ? '#007040' : '#0a1628';
      ctx.font = `bold ${highlight ? '14' : '12.5'}px Arial, sans-serif`;
      ctx.textAlign = 'right';
      const display = value.length > 52 ? value.slice(0, 49) + '…' : value;
      ctx.fillText(display, W - M - 8, y + ROW_H - 10);
      ctx.textAlign = 'left';

      y += ROW_H;
    });
    y += 10; // gap between sections
  };

  const term = termFromPayment(data.payment, data.term);
  const ref  = receiptReference(data.payment);

  drawSection('Payer Details', [
    ['Account / Student ID', data.student.id],
    ['Student Name',         data.student.fullName],
    ['Parent / Guardian',    data.parent?.name || data.student.parentName || '-'],
  ]);

  drawSection('Payment Details', [
    ['Payment Date',          new Date(data.payment.timestamp).toLocaleString()],
    ['Term',                  term],
    ['Payment Method',        data.payment.method],
    ['Reference',             ref],
    ['Amount Paid',           currency(data.payment.amount), true],
    ['Total Fees',            currency(data.totalFees)],
    ['Paid To Date',          currency(data.paidFees)],
    ['Balance After Payment', currency(data.balance)],
  ]);

  // ── PAID stamp box ────────────────────────────────────────────────────────
  const stampH = 52;
  fillRoundRect(ctx, M - 4, y, CW + 8, stampH, 8, '#edfaf3');
  ctx.strokeStyle = '#00a855'; ctx.lineWidth = 1.5;
  strokeRoundRect(ctx, M - 4, y, CW + 8, stampH, 8);
  ctx.fillStyle = '#007040';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('✓  PAYMENT RECEIVED', W / 2, y + 22);
  ctx.font = '400 11.5px Arial, sans-serif';
  ctx.fillStyle = '#2a6a44';
  ctx.fillText(
    `${currency(data.payment.amount)} confirmed on ${new Date(data.payment.timestamp).toLocaleDateString()}`,
    W / 2, y + 40
  );
  ctx.textAlign = 'left';

  // ── QR code — centred above footer ───────────────────────────────────────
  const footerTop = H - M - 8;
  const qrSize = 90;
  const qrTopY = footerTop - 52 - qrSize;
  if (qrDataUrl) {
    const qrImg = await loadImage(qrDataUrl).catch(() => null);
    if (qrImg) {
      const qrX = W / 2 - qrSize / 2;
      ctx.strokeStyle = '#0070a3'; ctx.lineWidth = 1.5;
      ctx.strokeRect(qrX - 2, qrTopY - 2, qrSize + 4, qrSize + 4);
      ctx.drawImage(qrImg, qrX, qrTopY, qrSize, qrSize);
      ctx.fillStyle = '#0070a3';
      ctx.font = 'bold 10px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Scan to verify receipt', W / 2, qrTopY + qrSize + 16);
      ctx.textAlign = 'left';
    }
  }

  // ── Footer — always pinned to page bottom ─────────────────────────────────
  ctx.strokeStyle = '#d0dce8'; ctx.lineWidth = 1;
  ctx.beginPath(); ctx.moveTo(M - 4, footerTop - 42); ctx.lineTo(W - M + 4, footerTop - 42); ctx.stroke();

  ctx.fillStyle = '#999';
  ctx.font = '400 10px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(`24hr Client Care   E: ${SCHOOL_DETAILS.email}   W: defineddomain.com`, W / 2, footerTop - 28);
  ctx.fillText(`${SCHOOL_DETAILS.name} is an authorised private institution. Receipt generated automatically.`, W / 2, footerTop - 14);
  ctx.fillText(`Unique Document No: ${ref} | V1.0 - ${new Date().toLocaleDateString()}   Page 1 of 1`, W / 2, footerTop);
  ctx.textAlign = 'left';

  const link = document.createElement('a');
  link.download = getReceiptFileName(data, 'png');
  link.href = canvas.toDataURL('image/png');
  link.click();
};

// ─── Canvas helpers ───────────────────────────────────────────────────────────

function fillRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number,
  r: number, fill: string
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
}

function strokeRoundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number
) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y,     x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x,     y + h, r);
  ctx.arcTo(x,     y + h, x,     y,     r);
  ctx.arcTo(x,     y,     x + w, y,     r);
  ctx.closePath();
  ctx.stroke();
}

// ─── Entry point ──────────────────────────────────────────────────────────────

export const generateReceiptDownload = async (
  format: ReceiptDownloadFormat,
  data: ReceiptGeneratorData
) => {
  if (format === 'pdf') {
    await generateReceiptPdf(data);
    return;
  }
  await generateReceiptImage(data);
};