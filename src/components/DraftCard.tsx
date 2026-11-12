import React from 'react';
import { Edit3, Trash2, Clock, HelpCircle, FileEdit, ArrowRight } from 'lucide-react';
import { DraftCategory } from '../types';
import { CategoryIcon } from './IconHelper';
import { parseMetaParagraph } from '../lib/prompt-engine';

interface DraftCardProps {
  draft: DraftCategory;
  onResume: (draft: DraftCategory) => void;
  onDelete: (draft: DraftCategory) => void;
}

export const DraftCard: React.FC<DraftCardProps> = ({ draft, onResume, onDelete }) => {
  const formatTime = (isoString?: string) => {
    if (!isoString) return 'Recently';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const parsedQuestions = parseMetaParagraph(draft.metaParagraph || '');
  const questionCount = parsedQuestions.length;

  return (
    <div
      onClick={() => onResume(draft)}
      className="group relative bg-white rounded-xl border border-amber-200/90 hover:border-amber-400 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(245,158,11,0.08)] transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Draft badge & Delete button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-amber-50 border border-amber-200 flex items-center justify-center text-amber-800">
              <CategoryIcon name={draft.icon} className="w-4 h-4" />
            </div>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-100/70 border border-amber-300 text-amber-800">
              Draft In Progress
            </span>
          </div>

          <button
            type="button"
            onClick={e => {
              e.stopPropagation();
              onDelete(draft);
            }}
            className="p-1.5 rounded-lg hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors cursor-pointer"
            title="Delete Draft (PIN required)"
            aria-label="Delete Draft (PIN required)"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-stone-900 group-hover:text-amber-950 transition-colors mb-1.5 leading-snug">
          {draft.name || 'Untitled Draft'}
        </h3>

        {/* Description */}
        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
          {draft.description || 'Draft prompt template in progress. Click to continue editing.'}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 text-stone-600">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </span>
          </div>
          <div className="flex items-center gap-1 text-[11px] text-stone-400">
            <Clock className="w-3 h-3" />
            <span>Saved {formatTime(draft.updatedAt)}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-xs font-semibold text-amber-800 group-hover:text-amber-900">
          <span>Resume</span>
          <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
        </div>
      </div>
    </div>
  );
};
