
import React from 'react';
import { Student } from '../../types';
import { FileText } from 'lucide-react';

interface Props {
  student: Student;
  isEditing: boolean;
  editForm: Partial<Student>;
  setEditForm: (form: Partial<Student>) => void;
  onViewPdf: (url: string) => void;
  onUploadPdf: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const HealthRecord: React.FC<Props> = ({
  student,
  isEditing,
  editForm,
  setEditForm,
  onViewPdf,
  onUploadPdf
}) => {
  const recordInput = "w-full rounded-md border border-slate-300 bg-white p-3 text-sm font-medium text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white";
  const RecordBlock = ({ category, title, children }: { category: string; title: string; children: React.ReactNode }) => (
    <section className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="flex items-start justify-between gap-4 border-b border-slate-200 bg-slate-50/80 px-5 py-3 dark:border-slate-800 dark:bg-slate-800/50">
        <div>
          <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{category}</p>
          <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
        </div>
      </header>
      <div className="p-5">{children}</div>
    </section>
  );

  return (
  <div className="grid w-full grid-cols-1 items-start gap-5 animate-in fade-in duration-300 xl:grid-cols-2">
        <RecordBlock category="Clinical record" title="Professional diagnosis">
          <div className="flex items-center justify-end">
            {student.diagnosisPdf && (
              <button
                onClick={() => onViewPdf(student.diagnosisPdf!)}
                className="mb-3 flex items-center gap-1.5 text-xs font-bold text-blue-600 hover:text-blue-700"
              >
                <FileText size={14} /> View Document
              </button>
            )}
          </div>

          {isEditing ? (
            <div className="space-y-3">
              <textarea
                value={editForm.diagnosis || ''}
                onChange={e => setEditForm({ ...editForm, diagnosis: e.target.value })}
                placeholder="Enter diagnosis notes..."
                className={recordInput}
                rows={4}
              />
              <div className="space-y-1">
                <label className="text-[11px] font-medium text-slate-400">
                  Update Diagnostic PDF
                </label>
                <input
                  type="file"
                  accept="application/pdf"
                  onChange={onUploadPdf}
                  className="block w-full text-xs text-slate-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-[9px] file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                />
              </div>
            </div>
          ) : (
            <p className="min-h-20 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
              {student.diagnosis || 'No formal diagnosis report attached.'}
            </p>
          )}
        </RecordBlock>

        <RecordBlock category="Support record" title="Behaviour plan and observations">
          {isEditing ? (
            <textarea
              value={editForm.targetBehaviors || ''}
              onChange={e => setEditForm({ ...editForm, targetBehaviors: e.target.value })}
              placeholder="Enter observed behavior patterns and sensory requirements..."
              className={recordInput}
              rows={5}
            />
          ) : (
            <p className="min-h-20 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">
              {student.targetBehaviors || 'No custom behavioural protocols specified.'}
            </p>
          )}
        </RecordBlock>

        <RecordBlock category="Medical record" title="Medical notes">
          {isEditing ? (
            <textarea value={editForm.medicalRecords || ''} onChange={e => setEditForm({ ...editForm, medicalRecords: e.target.value })} placeholder="Enter allergies, medication and medical notes..." className={recordInput} rows={5} />
          ) : (
            <p className="min-h-20 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{student.medicalRecords || 'No medical notes have been recorded.'}</p>
          )}
        </RecordBlock>

        <RecordBlock category="Background record" title="Social and developmental history">
          {isEditing ? (
            <textarea value={editForm.socialHistory || ''} onChange={e => setEditForm({ ...editForm, socialHistory: e.target.value })} placeholder="Enter relevant social and developmental history..." className={recordInput} rows={5} />
          ) : (
            <p className="min-h-20 text-sm font-medium leading-6 text-slate-700 dark:text-slate-300">{student.socialHistory || 'No social or developmental history has been recorded.'}</p>
          )}
        </RecordBlock>
  </div>
  );
};
