
import React from 'react';
import { PaymentRecord } from '../../types';

interface Props {
  totalPaid: number;
  balance: number;
  payments: PaymentRecord[];
  borderClass?: string;
}

export const PaymentLedger: React.FC<Props> = ({ totalPaid, balance, payments }) => (
  <div className="space-y-8 animate-in fade-in duration-300">
    <div className="space-y-4">
      <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
        Financial Status & Tuition Billing
      </h3>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-xl">
        <div className="p-5 bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-[9px]">
          <p className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">Total Tuition Paid</p>
          <p className="text-2xl font-bold text-emerald-700 dark:text-emerald-400 mt-1 font-mono">${totalPaid}</p>
        </div>

        <div className="p-5 bg-rose-50/70 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/50 rounded-[9px]">
          <p className="text-[11px] font-semibold text-rose-700 dark:text-rose-400">Outstanding Balance</p>
          <p className="text-2xl font-bold text-rose-700 dark:text-rose-400 mt-1 font-mono">${balance}</p>
        </div>
      </div>
    </div>

    <div className="space-y-4">
      <h3 className="text-sm md:text-base font-bold text-slate-900 dark:text-white">
        Payment Transactions History
      </h3>

      <div className="border border-slate-200 dark:border-slate-800 rounded-[9px] overflow-hidden bg-white dark:bg-slate-900 shadow-sm">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-slate-800/60 text-[11px] font-semibold text-slate-500 border-b border-slate-100 dark:border-slate-800">
            <tr>
              <th className="px-5 py-3">Date</th>
              <th className="px-5 py-3">Payment Method</th>
              <th className="px-5 py-3 text-right">Amount Paid</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
            {payments.length === 0 ? (
              <tr>
                <td colSpan={3} className="py-8 text-center text-slate-400 font-medium">
                  No payment transactions recorded for this term.
                </td>
              </tr>
            ) : (
              payments.map(p => (
                <tr key={p.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                  <td className="px-5 py-3.5 font-medium text-slate-800 dark:text-slate-200">
                    {new Date(p.timestamp).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-3.5 text-slate-500 font-mono text-[11px]">
                    {p.method}
                  </td>
                  <td className="px-5 py-3.5 text-right font-bold text-emerald-600 dark:text-emerald-400 font-mono">
                    +${p.amount}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  </div>
);
