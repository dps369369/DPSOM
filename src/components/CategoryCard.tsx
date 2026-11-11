import React from 'react';
import { ArrowRight, HelpCircle, Flame, Clock, Edit3, Trash2 } from 'lucide-react';
import { Category } from '../types';
import { CategoryIcon } from './IconHelper';
import { parseMetaParagraph, getCategoryMetaParagraph } from '../lib/prompt-engine';

interface CategoryCardProps {
  category: Category;
  onSelect: (category: Category) => void;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
  rankBadge?: number;
}

export const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  onSelect,
  onEdit,
  onDelete,
  rankBadge,
}) => {
  const formatLastUsed = (isoString?: string | null) => {
    if (!isoString) return 'Never used';
    try {
      const diffMs = Date.now() - new Date(isoString).getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      const diffHours = Math.floor(diffMins / 60);
      if (diffHours < 24) return `${diffHours}h ago`;
      const diffDays = Math.floor(diffHours / 24);
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 30) return `${diffDays}d ago`;
      return new Date(isoString).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
    } catch {
      return 'Recently';
    }
  };

  const metaText = getCategoryMetaParagraph(category);
  const questions = parseMetaParagraph(metaText);
  const questionCount = questions.length || category.variables?.length || 0;

  return (
    <div
      onClick={() => onSelect(category)}
      className="group relative bg-white rounded-xl border border-stone-200/90 p-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_12px_rgba(0,0,0,0.06)] hover:border-stone-300 transition-all duration-200 cursor-pointer flex flex-col justify-between"
    >
      <div>
        {/* Top Header: Icon & Stats & PIN-protected Management Actions */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-stone-100 border border-stone-200/80 flex items-center justify-center text-stone-800 group-hover:bg-stone-900 group-hover:text-white transition-colors duration-200">
              <CategoryIcon name={category.icon} className="w-4 h-4" />
            </div>
            {rankBadge !== undefined && rankBadge <= 3 && (
              <span
                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                  rankBadge === 1
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : rankBadge === 2
                    ? 'bg-stone-100 text-stone-700 border-stone-200'
                    : 'bg-orange-50 text-orange-800 border-orange-200'
                }`}
              >
                #{rankBadge} Most Used
              </span>
            )}
          </div>

          {/* Action buttons (Edit & Delete) */}
          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onEdit(category);
                }}
                className="p-1.5 rounded-md hover:bg-stone-100 text-stone-400 hover:text-stone-800 transition-colors"
                title="Edit Category (PIN required)"
              >
                <Edit3 className="w-3.5 h-3.5" />
              </button>
            )}
            {onDelete && (
              <button
                type="button"
                onClick={e => {
                  e.stopPropagation();
                  onDelete(category);
                }}
                className="p-1.5 rounded-md hover:bg-red-50 text-stone-400 hover:text-red-600 transition-colors"
                title="Delete Category (PIN required)"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-semibold text-stone-900 group-hover:text-stone-950 transition-colors mb-1.5 leading-snug">
          {category.name}
        </h3>

        {/* Description */}
        <p className="text-xs text-stone-600 line-clamp-2 leading-relaxed mb-4">
          {category.description || 'Structured prompt template ready for construction.'}
        </p>
      </div>

      {/* Meta Footer */}
      <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs text-stone-500 font-medium">
        <div className="flex items-center gap-3">
          {/* Question count */}
          <div className="flex items-center gap-1 text-stone-600">
            <HelpCircle className="w-3.5 h-3.5 text-stone-400" />
            <span>
              {questionCount} {questionCount === 1 ? 'question' : 'questions'}
            </span>
          </div>

          {/* Usage count */}
          <div className="flex items-center gap-1 text-stone-600">
            <Flame className="w-3.5 h-3.5 text-amber-600" />
            <span>
              {category.usageCount} {category.usageCount === 1 ? 'use' : 'uses'}
            </span>
          </div>
        </div>

        {/* Last used or CTA arrow */}
        <div className="flex items-center gap-1.5 text-[11px] text-stone-400 group-hover:text-stone-900 transition-colors">
          <Clock className="w-3 h-3" />
          <span>{formatLastUsed(category.lastUsedAt)}</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-200 text-stone-900" />
        </div>
      </div>
    </div>
  );
};
