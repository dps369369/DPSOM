import React, { useState } from 'react';
import {
  Copy,
  Check,
  RotateCcw,
  ArrowLeft,
  Edit2,
  FileText,
  Sparkles,
  ExternalLink,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { Category, GenerationAnswers } from '../types';
import { CategoryIcon } from './IconHelper';

interface GeneratedPromptPageProps {
  category: Category;
  initialPrompt: string;
  answers: GenerationAnswers;
  onGenerateAgain: () => void;
  onBackToCategory: () => void;
  onExploreMore: () => void;
}

export const GeneratedPromptPage: React.FC<GeneratedPromptPageProps> = ({
  category,
  initialPrompt,
  answers,
  onGenerateAgain,
  onBackToCategory,
  onExploreMore,
}) => {
  const [editedPrompt, setEditedPrompt] = useState(initialPrompt);
  const [copied, setCopied] = useState(false);
  const [isEditingNotice, setIsEditingNotice] = useState(false);

  // Copy full completed prompt
  const handleCopyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(editedPrompt);
      setCopied(true);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#292524', '#78716c', '#d6d3d1', '#fbbf24'],
      });
      setTimeout(() => setCopied(false), 2500);
    } catch (err) {
      console.error('Failed to copy prompt to clipboard:', err);
    }
  };

  const wordCount = editedPrompt.trim().split(/\s+/).filter(Boolean).length;
  const charCount = editedPrompt.length;
  const answeredVariablesCount = Object.keys(answers).length;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Top Bar with Navigation & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToCategory}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Back to questions"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1 rounded bg-stone-100 text-stone-700">
                <CategoryIcon name={category.icon} className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                Prompt Ready: {category.name}
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5">
              Original master template preserved with all dynamic variables replaced.
            </p>
          </div>
        </div>

        {/* Primary Actions: Copy & Regenerate */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            type="button"
            onClick={onGenerateAgain}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-lg transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5 text-stone-500" />
            <span>Generate Again</span>
          </button>

          <button
            type="button"
            onClick={handleCopyPrompt}
            className={`inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-lg shadow-sm transition-all duration-150 ${
              copied
                ? 'bg-emerald-700 text-white'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-50 active:scale-[0.98]'
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Prompt</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Stats Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-2.5 bg-stone-100/70 border border-stone-200 rounded-xl mb-4 text-xs text-stone-600 font-mono">
        <div className="flex items-center gap-4">
          <span>{wordCount} words</span>
          <span>•</span>
          <span>{charCount} characters</span>
          <span>•</span>
          <span className="text-stone-800 font-medium">
            {answeredVariablesCount} variables inserted
          </span>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-stone-500">
          <Edit2 className="w-3 h-3 text-stone-400" />
          <span>Editable below (won't affect template)</span>
        </div>
      </div>

      {/* Large readable text area for prompt */}
      <div className="relative bg-white rounded-2xl border border-stone-200/90 shadow-sm overflow-hidden mb-6">
        <textarea
          rows={18}
          value={editedPrompt}
          onChange={e => {
            setEditedPrompt(e.target.value);
            setIsEditingNotice(true);
          }}
          className="w-full p-5 sm:p-6 text-sm text-stone-900 font-mono leading-relaxed bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y select-text"
          placeholder="Constructed prompt..."
        />
      </div>

      {/* Bottom Auxiliary Actions */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
        <button
          onClick={onExploreMore}
          className="text-xs font-semibold text-stone-600 hover:text-stone-900 transition-colors"
        >
          ← Explore Other Categories
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={handleCopyPrompt}
            className="text-xs font-semibold text-stone-900 hover:underline flex items-center gap-1"
          >
            <Copy className="w-3 h-3" />
            <span>Copy full prompt</span>
          </button>
        </div>
      </div>
    </div>
  );
};
