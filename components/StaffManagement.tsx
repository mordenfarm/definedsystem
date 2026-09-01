
import React, { useState, useMemo } from 'react';
import { useStore } from '../store/useStore';
import { 
  ChevronRight, 
  Search, 
  X, 
  Plus, 
  Loader2, 
  LayoutGrid, 
  List, 
  Save, 
  Trash2, 
  Edit2,
  Globe,
  CreditCard,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  User,
  ShieldCheck,
  ArrowLeft,
  Image as ImageIcon
} from 'lucide-react';
import { Staff } from '../types';

const ProfileRow = ({ 
  label, 
  value, 
  field, 
  isEditing, 
  editForm, 
  setEditForm,
  options,
  multiple,
  availableClasses
}: { 
  label: string, 
  value: any, 
  field?: keyof Staff, 
  isEditing: boolean, 
  editForm: Partial<Staff>, 
  setEditForm: (val: Partial<Staff>) => void,
  options?: any[],
  multiple?: boolean,
  availableClasses?: string[]
}) => {
  const filteredValue = useMemo(() => {
    if (multiple && Array.isArray(value) && availableClasses) {
      return value.filter(v => availableClasses.includes(v));
    }
    return value;
  }, [value, multiple, availableClasses]);

  return (
    <tr className="border-b border-slate-100 dark:border-slate-800/50 group/row">
      <td className="py-4 px-2 w-1/3 text-[10px] font-black uppercase tracking-widest text-slate-950 dark:text-slate-400 group-hover/row:text-blue-600 transition-colors">{label}</td>
      <td className="py-4 px-2">
        {isEditing && field ? (
          multiple && availableClasses ? (
            <div className="flex flex-wrap gap-2 py-2">
              {availableClasses.map(cls => (
                <label key={cls} className="flex items-center gap-2 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 px-4 py-1.5 rounded-none cursor-pointer hover:border-blue-500 transition-all select-none">
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded-none border-slate-300 text-blue-600 focus:ring-blue-500"
                    checked={(editForm.assignedClasses || []).includes(cls)}
                    onChange={e => {
                      const current = editForm.assignedClasses || [];
                      const next = e.target.checked 
                        ? [...current, cls]
                        : current.filter(c => c !== cls);
                      setEditForm({ ...editForm, assignedClasses: next });
                    }}
                  />
                  <span className="text-[10px] font-black uppercase tracking-tight">{cls}</span>
                </label>
              ))}
            </div>
          ) : options ? (
            <select 
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-none text-sm font-bold outline-none focus:border-blue-600"
              value={(editForm as any)[field] || ''}
              onChange={e => setEditForm({...editForm, [field]: e.target.value})}
            >
              <option value="">Choose...</option>
              {options.map(opt => {
                const name = typeof opt === 'string' ? opt : opt.name;
                return <option key={name} value={name}>{name}</option>;
              })}
            </select>
          ) : (
            <input 
              type="text"
              className="w-full px-4 py-2.5 bg-white dark:bg-slate-900 border-2 border-slate-200 dark:border-slate-800 rounded-none text-sm font-bold outline-none focus:border-blue-600"
              value={(editForm as any)[field] || ''}
              onChange={e => setEditForm({...editForm, [field]: e.target.value})}
              placeholder={`Enter ${label.toLowerCase()}...`}
            />
          )
        ) : (
          <span className={`text-sm font-bold text-slate-700 dark:text-slate-200`}>
            {Array.isArray(filteredValue) ? filteredValue.join(', ') : (filteredValue || 'None')}
          </span>
        )}
      </td>
    </tr>
  );
};

export const StaffManagement: React.FC = () => {
  const { staff, addStaff, updateStaff, deleteStaff, settings, user } = useStore();
  const [searchTerm, setSearchTerm] = useState('');
  const [activeSubTab, setActiveSubTab] = useState<'administration' | 'general'>('administration');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [isAdding, setIsAdding] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Staff>>({});
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedClassesForAdd, setSelectedClassesForAdd] = useState<string[]>([]);
  const [addFormNationality, setAddFormNationality] = useState('Zimbabwean');
  const [isAddFormClosing, setIsAddFormClosing] = useState(false);
  const [staffImageData, setStaffImageData] = useState('');
  const [staffImageName, setStaffImageName] = useState('');

  const isAdmin = user?.role === 'SUPER_ADMIN';
  const availableClasses = settings?.classes || [];
  const googleInput = "w-full px-4 py-3 rounded-[15px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm text-slate-900 dark:text-white shadow-sm";
  const googleInputWithIcon = "w-full pl-12 pr-4 py-3 rounded-[15px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 focus:border-blue-600 focus:ring-4 focus:ring-blue-500/10 outline-none transition-all font-medium text-sm text-slate-900 dark:text-white shadow-sm";
  const googleLabel = "text-[11px] font-semibold tracking-wide text-slate-600 dark:text-slate-300 ml-1";
  const googleStepBadge = "text-[10px] font-bold uppercase tracking-[0.18em] text-blue-700 bg-blue-50 dark:bg-blue-900/20 px-4 py-2 rounded-[15px] border border-blue-100 dark:border-blue-800";

  const filteredStaff = (staff || []).filter(s => {
    const isCorrectType = activeSubTab === 'administration' 
      ? (s.role === 'ADMIN_SUPPORT' || s.role === 'SUPER_ADMIN')
      : (s.role === 'SPECIALIST');
    
    const fullName = s.fullName.toLowerCase();
    return isCorrectType && (fullName.includes(searchTerm.toLowerCase()));
  });

  const openAddStaffForm = () => {
    setSelectedClassesForAdd([]);
    setAddFormNationality('Zimbabwean');
    setStaffImageData('');
    setStaffImageName('');
    setIsAddFormClosing(false);
    setIsAdding(true);
  };

  const closeAddStaffForm = (force = false) => {
    if (isSubmitting && !force) return;
    setIsAddFormClosing(true);
    window.setTimeout(() => {
      setIsAdding(false);
      setIsAddFormClosing(false);
    }, 180);
  };

  const handleStaffImageSelect = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setStaffImageData(String(reader.result || ''));
      setStaffImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  const handleSaveEdit = async () => {
    if (!selectedStaff) return;
    setIsSubmitting(true);
    try {
      await updateStaff(selectedStaff.id, editForm);
      setSelectedStaff({ ...selectedStaff, ...editForm });
      setIsEditing(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;
    await deleteStaff(selectedStaff.id);
    setSelectedStaff(null);
    setShowDeleteConfirm(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 max-w-[1400px] mx-auto">
      <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-100 dark:bg-blue-900/30 rounded-none text-blue-600">
              <User size={16} />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-600">Team Members</span>
          </div>
          <h1 className="text-4xl font-black uppercase text-slate-900 dark:text-white leading-none tracking-tight">Staff List</h1>
          <p className="text-sm text-slate-500 font-medium mt-3 italic">View and update everyone working at the school.</p>
        </div>
        {isAdmin && (
          <button onClick={openAddStaffForm} className="px-8 py-3.5 bg-blue-600 text-white rounded-none text-xs font-black uppercase tracking-widest shadow-xl shadow-blue-500/20 hover:bg-black transition-all active:scale-95 flex items-center gap-3">
            <Plus size={18} /> Add New Staff
          </button>
        )}
      </header>

      <div className="flex items-center gap-1.5 border-b-2 border-slate-100 dark:border-slate-800 mb-2">
        <button onClick={() => setActiveSubTab('administration')} className={`px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeSubTab === 'administration' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Office & Support</button>
        <button onClick={() => setActiveSubTab('general')} className={`px-8 py-5 text-[11px] font-black uppercase tracking-[0.2em] border-b-4 transition-all ${activeSubTab === 'general' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}>Teachers</button>
      </div>

      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1 group">
          <Search size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input 
            type="text" 
            placeholder="Search by name..." 
            value={searchTerm} 
            onChange={(e) => setSearchTerm(e.target.value)} 
            className="w-full pl-14 pr-6 py-4 bg-white dark:bg-slate-900 rounded-none text-sm font-bold border-2 border-slate-100 dark:border-slate-800 outline-none focus:border-blue-500 transition-all shadow-sm" 
          />
        </div>
        <div className="bg-slate-100 dark:bg-slate-800/50 p-1.5 rounded-none flex gap-1 border border-slate-200 dark:border-slate-700 h-fit">
          <button onClick={() => setViewMode('table')} className={`p-2.5 rounded-none transition-all ${viewMode === 'table' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><List size={22} /></button>
          <button onClick={() => setViewMode('cards')} className={`p-2.5 rounded-none transition-all ${viewMode === 'cards' ? 'bg-white dark:bg-slate-700 shadow-md text-blue-600' : 'text-slate-400 hover:text-slate-600'}`}><LayoutGrid size={22} /></button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 border-2 border-slate-100 dark:border-slate-800 rounded-none overflow-hidden shadow-sm">
        {viewMode === 'table' ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-[10px] font-black uppercase text-slate-950 dark:text-slate-400 border-b-2 border-slate-100 dark:border-slate-800">
                <tr>
                  <th className="px-10 py-6 tracking-widest">Photo & Name</th>
                  <th className="px-8 py-6 tracking-widest">Job Role</th>
                  <th className="px-8 py-6 tracking-widest">Classes</th>
                  <th className="px-10 py-6 text-right tracking-widest">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 dark:divide-slate-800">
                {filteredStaff.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-24 text-center font-bold text-slate-300 uppercase text-xs tracking-widest">No matching staff found.</td>
                  </tr>
                ) : filteredStaff.map(s => {
                  const sClasses = (s.assignedClasses || []).filter(c => availableClasses.includes(c));
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/50 dark:hover:bg-blue-900/10 cursor-pointer group transition-colors" onClick={() => { setSelectedStaff(s); setIsEditing(false); setEditForm(s); }}>
                      <td className="px-10 py-6 flex items-center gap-4">
                        <div className="w-10 h-10 bg-slate-100 dark:bg-slate-800 overflow-hidden shadow-sm border border-slate-200 dark:border-slate-700">
                          {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black text-xs text-slate-400">{s.fullName[0]}</div>}
                        </div>
                        <span className="font-black text-sm uppercase tracking-tight text-slate-900 dark:text-white group-hover:text-blue-600 transition-colors">{s.fullName}</span>
                      </td>
                      <td className="px-8 py-6">
                        <span className="px-4 py-1.5 rounded-none bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase border border-blue-100 dark:border-blue-800 shadow-sm">{s.position}</span>
                      </td>
                      <td className="px-8 py-6 text-xs text-slate-500 dark:text-slate-400 font-bold uppercase tracking-widest">{sClasses.join(', ') || 'Not Assigned'}</td>
                      <td className="px-10 py-6 text-right"><ChevronRight size={20} className="ml-auto text-slate-300 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" /></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {filteredStaff.map(s => (
              <div key={s.id} className="bg-white dark:bg-slate-950 border-2 border-slate-100 hover:border-blue-500 dark:border-slate-800 rounded-none p-8 hover:shadow-2xl transition-all cursor-pointer group relative overflow-hidden" onClick={() => { setSelectedStaff(s); setIsEditing(false); setEditForm(s); }}>
                <div className="w-20 h-20 bg-slate-100 dark:bg-slate-800 mb-6 overflow-hidden border-2 border-white dark:border-slate-700 shadow-lg group-hover:scale-110 transition-transform">
                  {s.imageUrl ? <img src={s.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black text-3xl text-slate-400 uppercase">{s.fullName[0]}</div>}
                </div>
                <h3 className="font-black text-lg uppercase group-hover:text-blue-600 transition-colors leading-tight mb-2 text-slate-900 dark:text-white">{s.fullName}</h3>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{s.position}</p>
                <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-700 flex items-center justify-between">
                   <span className="text-[9px] font-mono font-bold text-slate-400">ID: {s.id.substring(0,8).toUpperCase()}</span>
                   <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-600 transition-all" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedStaff && (
        <div className="fixed inset-0 z-[500] bg-white dark:bg-slate-950 flex flex-col animate-in slide-in-from-bottom duration-500 overflow-hidden">
          <header className="p-8 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-white/90 dark:bg-slate-950/90 backdrop-blur-md z-20 shadow-sm">
            <div className="flex items-center gap-6">
              <button 
                onClick={() => setSelectedStaff(null)} 
                className="p-3 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-none text-slate-400 hover:text-black transition-all active:scale-90"
              >
                <ArrowLeft size={28} />
              </button>
              <div className="w-16 h-16 bg-slate-100 dark:bg-slate-800 rounded-none overflow-hidden border-2 border-slate-200 shadow-xl">
                {selectedStaff.imageUrl ? <img src={selectedStaff.imageUrl} className="w-full h-full object-cover" alt="" /> : <div className="w-full h-full flex items-center justify-center font-black text-2xl text-slate-400 uppercase">{selectedStaff.fullName[0]}</div>}
              </div>
              <div>
                 <h2 className="text-xl font-black uppercase dark:text-white leading-none tracking-tight">Staff Profile</h2>
                 <p className="text-[10px] font-mono font-bold text-blue-600 mt-2 uppercase tracking-[0.2em]">{selectedStaff.position}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {isAdmin && (
                <>
                  <button onClick={() => setShowDeleteConfirm(true)} className="px-6 py-4 bg-rose-50 text-rose-500 rounded-none hover:bg-rose-500 hover:text-white transition-all shadow-sm border border-rose-100 dark:border-rose-900/30 text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                    <Trash2 size={18}/> Remove
                  </button>
                  <button onClick={() => isEditing ? handleSaveEdit() : setIsEditing(true)} className={`px-8 py-4 rounded-none transition-all shadow-md text-[10px] font-black uppercase tracking-widest flex items-center gap-2 ${isEditing ? 'bg-emerald-500 text-white shadow-emerald-500/20' : 'bg-blue-600 text-white hover:bg-black'}`}>
                    {isEditing ? <><Save size={18}/> Save Profile</> : <><Edit2 size={18}/> Edit Profile</>}
                  </button>
                </>
              )}
            </div>
          </header>

          <div className="flex-1 overflow-y-auto p-10 space-y-12 max-w-6xl mx-auto w-full sidebar-scrollbar">
             <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">General Information</h3>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <table className="w-full">
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        <ProfileRow label="First Name" value={selectedStaff.firstName} field="firstName" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="Surname" value={selectedStaff.lastName} field="lastName" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="Profile Image Link" value={selectedStaff.imageUrl || 'No image link'} field="imageUrl" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="Nationality" value={selectedStaff.nationality} field="nationality" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        {selectedStaff.nationality !== 'Zimbabwean' && (
                          <ProfileRow label="Passport" value={selectedStaff.passportNumber} field="passportNumber" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        )}
                        <ProfileRow label="ID Number" value={selectedStaff.nationalId || 'None'} field="nationalId" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="Birth Date" value={selectedStaff.dob} field="dob" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="Home Address" value={selectedStaff.address} field="address" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                     </tbody>
                  </table>
                </div>

                <div className="space-y-8">
                  <div className="flex items-center gap-3">
                    <h3 className="text-[11px] font-black uppercase tracking-[0.3em] text-blue-600">Work & Contact</h3>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <table className="w-full">
                     <tbody className="divide-y divide-slate-50 dark:divide-slate-800/50">
                        <ProfileRow label="Job Title" value={selectedStaff.position} field="position" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} options={settings?.positions || []} />
                        <ProfileRow label="Assigned Classes" value={selectedStaff.assignedClasses} field="assignedClasses" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} multiple availableClasses={availableClasses} />
                        <ProfileRow label="Email Address" value={selectedStaff.email} field="email" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="Phone Number" value={selectedStaff.phone} field="phone" isEditing={isEditing} editForm={editForm} setEditForm={setEditForm} />
                        <ProfileRow label="System ID" value={selectedStaff.id} field="id" isEditing={false} editForm={editForm} setEditForm={setEditForm} />
                     </tbody>
                  </table>
               </div>
             </div>
          </div>

          {showDeleteConfirm && (
            <div className="fixed inset-0 z-[600] bg-white/98 dark:bg-slate-950/98 flex flex-col items-center justify-center p-12 text-center animate-in zoom-in-95 backdrop-blur-md">
               <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-none border-4 border-rose-100 flex items-center justify-center mb-8 shadow-2xl"><Trash2 size={48}/></div>
               <h3 className="text-4xl font-black uppercase text-slate-900 dark:text-white tracking-tight">Erase staff record?</h3>
               <p className="text-base text-slate-500 dark:text-slate-400 font-medium mt-4 max-w-md mx-auto leading-relaxed">This will permanently remove <b>{selectedStaff.fullName}</b> from the system. They will no longer be able to log in.</p>
               <div className="flex gap-6 mt-12 w-full max-w-md">
                  <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-5 bg-slate-100 dark:bg-slate-800 rounded-none font-black uppercase text-xs transition-all hover:bg-slate-200 active:scale-95">Cancel</button>
                  <button onClick={handleDelete} className="flex-1 py-5 bg-rose-600 text-white rounded-none font-black uppercase text-xs shadow-xl shadow-rose-600/20 hover:bg-rose-700 active:scale-95 transition-all">Yes, Delete</button>
               </div>
            </div>
          )}
        </div>
      )}

      {isAdding && (
        <div className="fixed inset-0 z-[300] overflow-hidden">
          <div className={`absolute inset-0 bg-slate-100/95 dark:bg-slate-950/90 backdrop-blur-md ${isAddFormClosing ? 'form-backdrop-out' : 'form-backdrop-in'}`} onClick={() => closeAddStaffForm()} />
          <div className={`relative h-full w-full bg-white dark:bg-slate-900 shadow-2xl overflow-x-hidden overflow-y-auto sidebar-scrollbar ${isAddFormClosing ? 'form-screen-out' : 'form-screen-in'}`}>
             <div className="p-5 md:p-7 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md z-10">
                <div className="flex items-center gap-4">
                   <div className="p-3 bg-rose-50 dark:bg-rose-900/20 rounded-[15px] text-rose-500">
                      <Plus size={24} />
                   </div>
                   <div>
                    <h3 className="text-2xl font-semibold text-slate-900 dark:text-white tracking-tight">Register Staff</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">Create a staff account and profile.</p>
                   </div>
                </div>
                <button onClick={() => closeAddStaffForm()} className="p-3 text-slate-400 hover:text-rose-500 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-[15px] transition-colors"><X size={24}/></button>
             </div>
             
             <form onSubmit={async (e) => {
               e.preventDefault();
               if (selectedClassesForAdd.length === 0) {
                 alert("Please select at least one class.");
                 return;
               }
               setIsSubmitting(true);
               try {
                 const formData = new FormData(e.currentTarget);
                 const data = Object.fromEntries(formData.entries()) as any;
                 const role = activeSubTab === 'administration' ? 'ADMIN_SUPPORT' : 'SPECIALIST';
                 await addStaff({ 
                   ...data, 
                   role, 
                   assignedClasses: selectedClassesForAdd, 
                   nationality: addFormNationality 
                 });
                 closeAddStaffForm(true);
               } finally { setIsSubmitting(false); }
             }} className="w-full max-w-[1500px] mx-auto p-4 sm:p-6 lg:p-8 space-y-6 bg-rose-50/25 dark:bg-slate-950/20">
                <input type="hidden" name="imageUrl" value={staffImageData} />
                
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
                <section className="space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[15px] p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-[15px] bg-rose-50 text-rose-500 border border-rose-100 flex items-center justify-center text-[10px] font-bold">01</span>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Identity</h4>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className={googleLabel}>First Name</label>
                      <input required name="firstName" className={googleInput} placeholder="Enter first name" />
                    </div>
                    <div className="space-y-2">
                      <label className={googleLabel}>Surname</label>
                      <input required name="lastName" className={googleInput} placeholder="Enter surname" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={googleLabel}>Profile Image</label>
                    <label className="flex items-center gap-3 px-4 py-3 rounded-[15px] bg-white dark:bg-slate-950 border border-slate-300 dark:border-slate-700 cursor-pointer hover:border-blue-500 hover:ring-4 hover:ring-blue-500/10 transition-all shadow-sm">
                      <input type="file" accept="image/*" className="sr-only" onChange={e => handleStaffImageSelect(e.target.files?.[0])} />
                      <div className="w-9 h-9 rounded-[12px] bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 overflow-hidden flex items-center justify-center text-slate-400">
                        {staffImageData ? <img src={staffImageData} className="w-full h-full object-cover" alt="Staff preview" /> : <ImageIcon size={17} />}
                      </div>
                      <span className="text-xs font-medium text-slate-500 truncate">{staffImageName || 'Choose image from device'}</span>
                    </label>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className={googleLabel}>Nationality</label>
                      <div className="relative">
                        <Globe className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                        <select 
                          required 
                          value={addFormNationality} 
                          onChange={e => setAddFormNationality(e.target.value)}
                          className={`${googleInputWithIcon} appearance-none cursor-pointer`}
                        >
                          <option value="Zimbabwean">Zimbabwean</option>
                          <option value="South African">South African</option>
                          <option value="Zambian">Zambian</option>
                          <option value="Malawian">Malawian</option>
                          <option value="Other">Other</option>
                        </select>
                      </div>
                    </div>
                    {addFormNationality !== 'Zimbabwean' ? (
                      <div className="space-y-2 animate-in slide-in-from-left duration-300">
                        <label className={googleLabel}>Passport ID</label>
                        <div className="relative">
                          <CreditCard className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                          <input required name="passportNumber" placeholder="Enter ID" className={googleInputWithIcon} />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <label className={googleLabel}>National ID</label>
                        <input name="nationalId" placeholder="63-XXXXXX-X-XX" className={googleInput} />
                      </div>
                    )}
                  </div>
                </section>

                <section className="space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[15px] p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-[15px] bg-orange-50 text-orange-500 border border-orange-100 flex items-center justify-center text-[10px] font-bold">02</span>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Contact</h4>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <div className="grid grid-cols-1 gap-5">
                    <div className="space-y-2">
                      <label className={googleLabel}>Email Address</label>
                      <input required type="email" name="email" className={googleInput} placeholder="name@defineddomain.com" />
                      <p className="text-[11px] text-slate-400">Used for login and parent or school updates.</p>
                    </div>
                    <div className="space-y-2">
                      <label className={googleLabel}>Phone Number</label>
                      <input required type="tel" name="phone" placeholder="+263..." className={googleInput} />
                      <p className="text-[11px] text-slate-400">Include the country code.</p>
                    </div>
                  </div>
                </section>

                <section className="space-y-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[15px] p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <span className="w-9 h-9 rounded-[15px] bg-blue-50 text-blue-500 border border-blue-100 flex items-center justify-center text-[10px] font-bold">03</span>
                    <h4 className="text-[11px] font-black uppercase tracking-[0.2em] text-slate-700 dark:text-slate-200">Work</h4>
                    <div className="h-px flex-1 bg-slate-100 dark:bg-slate-800"></div>
                  </div>
                  <div className="space-y-2">
                    <label className={googleLabel}>Job Role</label>
                    <select name="position" className={`${googleInput} appearance-none cursor-pointer`}>
                      <option value="">Select role...</option>
                      {(settings?.positions || []).filter((p: any) => p.active).map((p: any) => {
                        const name = typeof p === 'string' ? p : p.name;
                        return <option key={name} value={name}>{name}</option>;
                      })}
                    </select>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between px-2">
                      <label className={googleLabel}>Assigned Classes</label>
                      <span className="text-[10px] font-bold uppercase text-blue-700 bg-blue-50 dark:bg-blue-900/30 px-3 py-1 rounded-[15px] border border-blue-100 dark:border-blue-800">
                        {selectedClassesForAdd.length} Chosen
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 p-4 bg-slate-50 dark:bg-slate-950/50 border border-slate-200 dark:border-slate-800 rounded-[15px] max-h-36 overflow-y-auto sidebar-scrollbar">
                      {availableClasses.map(cls => {
                        const isSelected = selectedClassesForAdd.includes(cls);
                        return (
                          <button
                            key={cls}
                            type="button"
                            onClick={() => {
                              if (isSelected) setSelectedClassesForAdd(selectedClassesForAdd.filter(c => c !== cls));
                              else setSelectedClassesForAdd([...selectedClassesForAdd, cls]);
                            }}
                            className={`flex items-center justify-center gap-2 px-3 py-2.5 rounded-[15px] text-[10px] font-bold uppercase tracking-tight transition-all border ${
                              isSelected 
                                ? 'bg-blue-600 border-blue-600 text-white shadow-lg' 
                                : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-500 hover:border-blue-300'
                            }`}
                          >
                            {isSelected ? <CheckCircle2 size={14} /> : <div className="w-3 h-3 rounded-full border-2 border-slate-200" />}
                            {cls}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </section>
                </div>
                
                <div className="max-w-5xl mx-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[15px] p-5 shadow-sm text-center">
                  <button 
                    type="submit" 
                    disabled={isSubmitting} 
                    className="w-full sm:w-96 py-4 bg-rose-500 text-white rounded-[15px] font-bold tracking-wide text-sm shadow-xl shadow-rose-500/20 hover:bg-rose-600 active:scale-[0.99] transition-all inline-flex items-center justify-center gap-3 disabled:opacity-50"
                  >
                    {isSubmitting ? <Loader2 size={22} className="animate-spin" /> : <>Save Staff Record <ChevronRight size={18}/></>}
                  </button>
                  <p className="text-[11px] text-slate-400 mt-4">Profile photos are converted to base64 before saving.</p>
                </div>
             </form>
          </div>
        </div>
      )}
    </div>
  );
};
