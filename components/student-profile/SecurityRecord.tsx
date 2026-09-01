import React, { useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Student } from '../../types';

interface Props {
  student: Student;
  parentPassword?: string;
  parentEmail?: string;
  isEditing: boolean;
  editForm: Partial<Student>;
  setEditForm: (form: Partial<Student>) => void;
}

export const SecurityRecord: React.FC<Props> = ({ student, parentPassword, parentEmail, isEditing, editForm, setEditForm }) => {
  const [visiblePassword, setVisiblePassword] = useState<'student' | 'parent' | null>(null);
  const studentPassword = editForm.password ?? student.password ?? '';
  const currentParentPassword = editForm.parentPassword ?? parentPassword ?? student.parentPassword ?? '';

  useEffect(() => {
    setVisiblePassword(null);
  }, [student.id]);

  return (
    <div className="w-full animate-in fade-in duration-300">
      <section className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <header className="flex flex-col gap-3 border-b border-slate-200 bg-slate-50/80 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 dark:border-slate-800 dark:bg-slate-800/50">
          <div>
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">Account security</p>
            <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">Student and parent login credentials</h3>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <ShieldCheck size={16} />
            Admin access only
          </div>
        </header>

        <div className="divide-y divide-slate-100 dark:divide-slate-800">
          <div className="grid gap-2 px-4 py-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-50 text-blue-600 dark:bg-blue-950/40 dark:text-blue-400">
                <LockKeyhole size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Student login email</p>
                <p className="text-xs text-slate-500">Student account</p>
              </div>
            </div>
            <p className="break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
              {student.email || `${student.id.toLowerCase()}@defineddomain.com`}
            </p>
          </div>

          <div className="grid gap-3 px-4 py-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-violet-50 text-violet-600 dark:bg-violet-950/40 dark:text-violet-400">
                <KeyRound size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Current password</p>
                <p className="text-xs text-slate-500">Used to sign in</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="relative">
                <input
                  type={visiblePassword === 'student' ? 'text' : 'password'}
                  value={studentPassword}
                  readOnly={!isEditing}
                  minLength={6}
                  onChange={event => setEditForm({ ...editForm, password: event.target.value })}
                  placeholder={isEditing ? 'Enter a new password' : 'No password recorded'}
                  autoComplete="new-password"
                  className={`w-full rounded-md border py-2.5 pl-3 pr-11 text-sm font-semibold outline-none transition-colors dark:text-white ${
                    isEditing
                      ? 'border-slate-300 bg-white focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950'
                      : 'cursor-default border-transparent bg-slate-50 text-slate-900 dark:bg-slate-800/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVisiblePassword(value => value === 'student' ? null : 'student')}
                  disabled={!studentPassword}
                  aria-label={visiblePassword === 'student' ? 'Hide student password' : 'Show student password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  {visiblePassword === 'student' ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {isEditing
                  ? 'Enter at least 6 characters, then select Save Changes above.'
                  : 'Password is hidden. Select Edit Profile to change it.'}
              </p>
            </div>
          </div>

          <div className="grid gap-2 px-4 py-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40 dark:text-emerald-400">
                <LockKeyhole size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Parent login email</p>
                <p className="text-xs text-slate-500">Parent account</p>
              </div>
            </div>
            <p className="break-all text-sm font-semibold text-slate-900 dark:text-slate-100">
              {parentEmail || student.parentEmail || 'No parent email recorded'}
            </p>
          </div>

          <div className="grid gap-3 px-4 py-5 sm:grid-cols-[220px_minmax(0,1fr)] sm:items-center sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400">
                <KeyRound size={17} />
              </div>
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400">Parent current password</p>
                <p className="text-xs text-slate-500">Used by the parent to sign in</p>
              </div>
            </div>

            <div className="max-w-xl">
              <div className="relative">
                <input
                  type={visiblePassword === 'parent' ? 'text' : 'password'}
                  value={currentParentPassword}
                  readOnly={!isEditing}
                  minLength={6}
                  onChange={event => setEditForm({ ...editForm, parentPassword: event.target.value })}
                  placeholder={isEditing ? 'Enter a new parent password' : 'No parent password recorded'}
                  autoComplete="new-password"
                  className={`w-full rounded-md border py-2.5 pl-3 pr-11 text-sm font-semibold outline-none transition-colors dark:text-white ${
                    isEditing
                      ? 'border-slate-300 bg-white focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950'
                      : 'cursor-default border-transparent bg-slate-50 text-slate-900 dark:bg-slate-800/60'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setVisiblePassword(value => value === 'parent' ? null : 'parent')}
                  disabled={!currentParentPassword}
                  aria-label={visiblePassword === 'parent' ? 'Hide parent password' : 'Show parent password'}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-md p-2 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-40 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                >
                  {visiblePassword === 'parent' ? <EyeOff size={17} /> : <Eye size={17} />}
                </button>
              </div>
              <p className="mt-2 text-xs text-slate-500">
                {isEditing
                  ? 'Enter at least 6 characters, then select Save Changes above.'
                  : 'Password is hidden. Select Edit Profile to change it.'}
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
