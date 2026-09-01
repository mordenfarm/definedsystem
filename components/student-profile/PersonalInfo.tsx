
import React from 'react';
import { Student, Staff } from '../../types';

interface Props {
  student: Student;
  isEditing: boolean;
  editForm: Partial<Student>;
  setEditForm: (form: Partial<Student>) => void;
  staff: Staff[];
  settings: any;
  isAdmin: boolean;
}

const InfoField = ({
  label,
  value,
  field,
  isEditing,
  editForm,
  setEditForm,
  options
}: {
  label: string;
  value?: string | number;
  field?: keyof Student;
  isEditing: boolean;
  editForm: Partial<Student>;
  setEditForm: (form: Partial<Student>) => void;
  options?: any[];
}) => {
  return (
    <div className="min-w-0 px-4 py-4 sm:px-5">
      <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 dark:text-slate-500">
        {label}
      </p>
      {isEditing && field ? (
        options ? (
          <select
            value={(editForm as any)[field] || ''}
            onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          >
            <option value="">Select...</option>
            {options.map((opt: any) => (
              <option key={opt.value || opt} value={opt.value || opt}>
                {opt.label || opt}
              </option>
            ))}
          </select>
        ) : (
          <input
            type="text"
            value={(editForm as any)[field] !== undefined ? (editForm as any)[field] : (value || '')}
            onChange={e => setEditForm({ ...editForm, [field]: e.target.value })}
            placeholder={`Enter ${label.toLowerCase()}...`}
            className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-900 outline-none focus:border-blue-600 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
          />
        )
      ) : (
        <p className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100" title={String(value || 'Not recorded')}>
          {value || 'Not recorded'}
        </p>
      )}
    </div>
  );
};

export const PersonalInfo: React.FC<Props> = ({
  student,
  isEditing,
  editForm,
  setEditForm,
  staff,
  settings,
  isAdmin
}) => {
  // Calculate approximate age from DOB
  const calculateAge = (dobString?: string) => {
    if (!dobString) return '---';
    const birthDate = new Date(dobString);
    if (isNaN(birthDate.getTime())) return dobString;
    const now = new Date();
    let years = now.getFullYear() - birthDate.getFullYear();
    let months = now.getMonth() - birthDate.getMonth();
    if (months < 0) {
      years--;
      months += 12;
    }
    return `${years}Y ${months}M`;
  };

  const assignedStaffMember = staff.find(s => s.id === student.assignedStaffId);

  const RecordSection = ({ eyebrow, title, children }: { eyebrow: string; title: string; children: React.ReactNode }) => (
    <section className="overflow-hidden border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
      <header className="border-b border-slate-200 bg-slate-50/80 px-4 py-3 sm:px-5 dark:border-slate-800 dark:bg-slate-800/50">
        <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-blue-600 dark:text-blue-400">{eyebrow}</p>
        <h3 className="mt-0.5 text-sm font-bold text-slate-900 dark:text-white">{title}</h3>
      </header>
      {children}
    </section>
  );

  return (
    <div className="grid w-full grid-cols-1 items-start gap-5 animate-in fade-in duration-300 xl:grid-cols-2">
      <RecordSection eyebrow="Student record" title="Identity information">
        <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:[&>*:nth-child(even)]:border-l sm:[&>*:nth-child(even)]:border-slate-100 sm:dark:[&>*:nth-child(even)]:border-slate-800">
          <InfoField
            label="First Name"
            value={student.firstName || student.fullName.split(' ')[0]}
            field="firstName"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Last Name"
            value={student.lastName || student.fullName.split(' ').slice(1).join(' ')}
            field="lastName"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Date of Birth"
            value={student.dob || '---'}
            field="dob"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Age"
            value={calculateAge(student.dob)}
            isEditing={false}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Gender"
            value={student.gender || 'Not specified'}
            field="gender"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
            options={['Male', 'Female']}
          />
          <InfoField
            label="Enrollment Date"
            value={student.enrollmentDate}
            field="enrollmentDate"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
        </div>
      </RecordSection>

      <RecordSection eyebrow="Family record" title="Guardian contact">
        <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 sm:[&>*:nth-child(even)]:border-l sm:[&>*:nth-child(even)]:border-slate-100 sm:dark:[&>*:nth-child(even)]:border-slate-800">
          <InfoField
            label="Guardian Name"
            value={student.parentName || 'Parent'}
            field="parentName"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Phone Number"
            value={student.parentPhone}
            field="parentPhone"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Email Address"
            value={student.parentEmail}
            field="parentEmail"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
          <InfoField
            label="Home Address"
            value={student.homeAddress}
            field="homeAddress"
            isEditing={isEditing}
            editForm={editForm}
            setEditForm={setEditForm}
          />
        </div>
      </RecordSection>

      <div className="xl:col-span-2">
        <RecordSection eyebrow="School record" title="Placement and support">
          <div className="grid grid-cols-1 divide-y divide-slate-100 dark:divide-slate-800 sm:grid-cols-2 lg:grid-cols-4 lg:divide-y-0 lg:[&>*+*]:border-l lg:[&>*+*]:border-slate-100 lg:dark:[&>*+*]:border-slate-800">
            <InfoField label="Classroom" value={student.assignedClass || 'General'} field="assignedClass" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} options={settings?.classes || []} />
            <InfoField label="Assigned Specialist" value={assignedStaffMember?.fullName || 'Not assigned'} field="assignedStaffId" isEditing={isEditing && isAdmin} editForm={editForm} setEditForm={setEditForm} options={staff.map(s => ({ value: s.id, label: s.fullName }))} />
            <InfoField label="Student ID" value={`#${student.id}`} isEditing={false} editForm={editForm} setEditForm={setEditForm} />
            <InfoField label="Status" value="Active" isEditing={false} editForm={editForm} setEditForm={setEditForm} />
          </div>
        </RecordSection>
      </div>
    </div>
  );
};
