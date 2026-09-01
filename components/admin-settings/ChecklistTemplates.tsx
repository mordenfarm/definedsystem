
import React from 'react';
import { useStore, MilestoneTemplate } from '../../store/useStore';
import { Plus, ChevronRight, Trash2 } from 'lucide-react';

interface Props {
  onEdit: (template: MilestoneTemplate) => void;
  onAdd: () => void;
}

export const ChecklistTemplates: React.FC<Props> = ({ onEdit, onAdd }) => {
  const { milestoneTemplates, deleteMilestoneTemplate } = useStore();
  const stageColors = ['bg-blue-600', 'bg-fuchsia-600', 'bg-pink-600', 'bg-cyan-500', 'bg-orange-500', 'bg-emerald-500', 'bg-violet-600'];

  const formatAgeRange = (minAge: number, maxAge: number, fallback: string) => {
    if (maxAge <= 11) return `${minAge || 1} to ${maxAge} Months`;
    if (minAge >= 12) {
      const minYears = Math.floor(minAge / 12);
      const maxYears = Math.ceil(maxAge / 12);
      return minYears === maxYears ? `${minYears} Year${minYears === 1 ? '' : 's'}` : `${minYears} to ${maxYears} Years`;
    }
    return fallback;
  };

  return (
    <div className="animate-in fade-in duration-500">
      <div className="flex flex-col justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:flex-row sm:items-center md:px-6 dark:border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">Checklist Templates</h3>
          <p className="mt-0.5 text-[10px] font-medium text-slate-400">Manage standard growth goals for students</p>
        </div>
        <button onClick={onAdd} className="flex items-center gap-2 rounded-[9px] bg-blue-600 px-4 py-2.5 text-xs font-bold text-white shadow-sm transition-colors hover:bg-blue-700">
          <Plus size={16} /> New Template
        </button>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[780px] border-collapse text-left">
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-semibold text-slate-400 dark:border-slate-800 dark:bg-slate-800/50">
              <th className="px-5 py-3 font-semibold">Stage</th>
              <th className="px-5 py-3 font-semibold">Developmental age</th>
              <th className="px-5 py-3 font-semibold">Categories</th>
              <th className="px-5 py-3 font-semibold">Check items</th>
              <th className="px-5 py-3 font-semibold">Warning signs</th>
              <th className="px-5 py-3 text-right font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-xs dark:divide-slate-800">
            {milestoneTemplates.length === 0 ? (
              <tr><td colSpan={6} className="px-5 py-16 text-center font-medium text-slate-400">No checklist templates have been created.</td></tr>
            ) : milestoneTemplates.map((template, index) => {
              const itemCount = template.sections.reduce((total, section) => total + section.items.length, 0);
              return (
                <tr key={template.id} onClick={() => onEdit(template)} className="group cursor-pointer transition-colors hover:bg-slate-50/80 dark:hover:bg-slate-800/50">
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-mono text-lg font-black text-white ${stageColors[index % stageColors.length]}`}>
                        {(index + 1).toString().padStart(2, '0')}
                      </div>
                      <span className="font-bold text-slate-900 dark:text-white">Stage {(index + 1).toString().padStart(2, '0')}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-200">{formatAgeRange(template.minAge, template.maxAge, template.label)}</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{template.sections.length} categories</td>
                  <td className="px-5 py-4 font-mono text-[11px] text-slate-500 dark:text-slate-400">{itemCount} items</td>
                  <td className="px-5 py-4 text-slate-500 dark:text-slate-400">{template.redFlags?.length || 0} signs</td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={(event) => { event.stopPropagation(); if (confirm('Permanently delete this template?')) deleteMilestoneTemplate(template.id); }} className="rounded-[7px] p-2 text-slate-400 transition-colors hover:bg-rose-50 hover:text-rose-600 dark:hover:bg-rose-950/30" title="Delete template"><Trash2 size={15} /></button>
                      <button onClick={(event) => { event.stopPropagation(); onEdit(template); }} className="rounded-[7px] p-2 text-slate-400 transition-colors hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/30" title="Edit template"><ChevronRight size={16} /></button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
