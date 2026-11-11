import React, { useState, useMemo, useRef } from 'react';
import {
  Send,
  ArrowLeft,
  AlertCircle,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  Sparkles,
  Save,
  Check,
} from 'lucide-react';
import { Category, DraftCategory } from '../types';
import {
  validateMetaParagraph,
  getCategoryMetaParagraph,
} from '../lib/prompt-engine';
import { AVAILABLE_ICONS, CategoryIcon } from './IconHelper';

interface CategoryEditorProps {
  initialCategory?: Category | null;
  initialDraft?: DraftCategory | null;
  onPublish: (categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt'>) => Promise<void>;
  onSaveDraft?: (draft: Omit<DraftCategory, 'updatedAt'>) => Promise<void>;
  onCancel: () => void;
}

export const CategoryEditor: React.FC<CategoryEditorProps> = ({
  initialCategory,
  initialDraft,
  onPublish,
  onSaveDraft,
  onCancel,
}) => {
  const draftId = initialDraft?.id;

  // 1. Category Name
  const [name, setName] = useState(
    initialCategory?.name || initialDraft?.name || ''
  );

  // 2. Category Description
  const [description, setDescription] = useState(
    initialCategory?.description || initialDraft?.description || ''
  );

  // Category Icon
  const [icon, setIcon] = useState(
    initialCategory?.icon || initialDraft?.icon || 'Code2'
  );

  // 3. Meta Paragraph (The complete prompt template with [Question] markers)
  const [metaParagraph, setMetaParagraph] = useState(() => {
    if (initialCategory) {
      return getCategoryMetaParagraph(initialCategory);
    }
    if (initialDraft?.metaParagraph) {
      return initialDraft.metaParagraph;
    }
    return `I am [What is your name?].

I am currently working on [What project are you currently working on?].

My primary objective is [What is your primary objective?].

I want you to act as [What role should the AI perform?].

My additional requirements are [Describe all your requirements in detail].`;
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [draftSavedToast, setDraftSavedToast] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Live syntax parsing & validation
  const validation = useMemo(() => {
    return validateMetaParagraph(metaParagraph);
  }, [metaParagraph]);

  // Insert a quick [Question] token at cursor position
  const handleInsertQuestion = (question = 'What is the objective?') => {
    const token = `[${question}]`;
    const textarea = textareaRef.current;
    if (textarea) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const text = metaParagraph;
      const newText = text.substring(0, start) + token + text.substring(end);
      setMetaParagraph(newText);
      setTimeout(() => {
        textarea.focus();
        textarea.setSelectionRange(start + token.length, start + token.length);
      }, 0);
    } else {
      setMetaParagraph(prev => prev + ' ' + token);
    }
  };

  const handlePublish = async () => {
    if (!name.trim()) {
      setErrorMessage('Please enter a category name.');
      return;
    }
    if (!description.trim()) {
      setErrorMessage('Please enter a short category description.');
      return;
    }
    if (!metaParagraph.trim()) {
      setErrorMessage('Meta paragraph prompt cannot be empty.');
      return;
    }
    if (validation.variables.length === 0) {
      setErrorMessage(
        'Please include at least one question in square brackets, e.g. [What is your name?].'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await onPublish({
        name: name.trim(),
        description: description.trim(),
        icon,
        metaParagraph,
        status: 'published',
      });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Failed to publish category.');
      setIsSubmitting(false);
    }
  };

  const handleSaveDraftClick = async () => {
    if (!onSaveDraft) return;
    if (!name.trim() && !metaParagraph.trim()) {
      setErrorMessage('Draft needs at least a name or prompt content.');
      return;
    }

    setIsSubmitting(true);
    try {
      await onSaveDraft({
        id: draftId || initialCategory?.id || '',
        name: name.trim() || 'Untitled Draft',
        description: description.trim(),
        icon,
        metaParagraph,
      });
      setDraftSavedToast(true);
      setTimeout(() => setDraftSavedToast(false), 2500);
    } catch (err) {
      setErrorMessage('Failed to save draft.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-stone-200">
        <div className="flex items-center gap-3">
          <button
            onClick={onCancel}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-stone-900 tracking-tight">
              {initialCategory ? `Edit: ${initialCategory.name}` : 'Create Category'}
            </h1>
            <p className="text-xs text-stone-500 mt-0.5">
              Write your prompt naturally. Any text in <code className="font-mono bg-stone-100 px-1 py-0.5 rounded text-stone-800 font-semibold">[Square Brackets]</code> becomes an interactive question.
            </p>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {onSaveDraft && (
            <button
              type="button"
              onClick={handleSaveDraftClick}
              disabled={isSubmitting}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-stone-700 bg-white border border-stone-300 hover:bg-stone-50 rounded-xl transition-colors disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5 text-stone-500" />
              <span>Save Draft</span>
            </button>
          )}

          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-5 py-2 text-xs font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] rounded-xl shadow-xs transition-colors disabled:opacity-50"
          >
            <Send className="w-3.5 h-3.5" />
            <span>{isSubmitting ? 'Publishing...' : 'Publish Category'}</span>
          </button>
        </div>
      </div>

      {/* Error & Toast Messages */}
      {errorMessage && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{errorMessage}</span>
        </div>
      )}

      {draftSavedToast && (
        <div className="mb-6 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>Draft saved successfully.</span>
        </div>
      )}

      <div className="space-y-6">
        {/* Basic Fields: Name & Description */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            {/* 1. Category Name */}
            <div className="md:col-span-8">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                1. Category Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={name}
                onChange={e => {
                  setName(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="e.g. Website Development, Research Assistant, Executive Brief"
                className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>

            {/* Icon */}
            <div className="md:col-span-4">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                Category Icon
              </label>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-stone-100 border border-stone-200 flex items-center justify-center text-stone-800 shrink-0">
                  <CategoryIcon name={icon} className="w-5 h-5" />
                </div>
                <select
                  value={icon}
                  onChange={e => setIcon(e.target.value)}
                  className="flex-1 px-3 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-xs font-medium text-stone-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer"
                >
                  {AVAILABLE_ICONS.map(i => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* 2. Category Description */}
            <div className="md:col-span-12">
              <label className="block text-xs font-semibold text-stone-700 mb-1.5">
                2. Category Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={e => {
                  setDescription(e.target.value);
                  setErrorMessage(null);
                }}
                placeholder="Briefly describe what this prompt produces..."
                className="w-full px-3.5 py-2.5 bg-stone-50/50 border border-stone-300 rounded-xl text-sm text-stone-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
              />
            </div>
          </div>
        </div>

        {/* 3. Meta Paragraph (One large editor) */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <label className="block text-xs font-semibold text-stone-700 mb-0.5">
                3. Meta Paragraph (Complete Prompt Template) <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-stone-500">
                Put your questions directly inside brackets: <span className="font-mono font-semibold text-stone-800">[What is your name?]</span>. The user's answer will replace the brackets automatically.
              </p>
            </div>

            {/* Quick helper button */}
            <button
              type="button"
              onClick={() => handleInsertQuestion('What role should the AI perform?')}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-mono font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-lg border border-stone-200 transition-colors self-start sm:self-auto"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>+ Insert [Question]</span>
            </button>
          </div>

          <textarea
            ref={textareaRef}
            rows={14}
            value={metaParagraph}
            onChange={e => {
              setMetaParagraph(e.target.value);
              setErrorMessage(null);
            }}
            placeholder="Write your complete prompt here. Example:
I am [What is your name?].
My goal is [What is your primary goal?]."
            className="w-full px-4 py-3.5 bg-stone-50/30 border border-stone-300 rounded-xl text-sm text-stone-900 font-mono leading-relaxed focus:bg-white focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
          />

          {/* Syntax warnings or guidance */}
          {validation.warnings.length > 0 && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-800">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                <span>Notice:</span>
              </div>
              {validation.warnings.map((warn, i) => (
                <p key={i} className="text-xs text-amber-700 pl-5">
                  • {warn}
                </p>
              ))}
            </div>
          )}
        </div>

        {/* Detected Questions Preview */}
        <div className="bg-white rounded-2xl border border-stone-200/90 p-5 sm:p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-stone-900 tracking-tight">
                Detected Questions in Form ({validation.variables.length})
              </h2>
            </div>
            <span className="text-xs text-stone-400 font-mono">
              Auto-extracted from [Square Brackets]
            </span>
          </div>

          {validation.variables.length === 0 ? (
            <div className="text-center py-8 bg-stone-50 rounded-xl border border-dashed border-stone-200 text-stone-500">
              <HelpCircle className="w-6 h-6 text-stone-400 mx-auto mb-2" />
              <p className="text-xs font-medium">No questions detected yet.</p>
              <p className="text-[11px] text-stone-400 mt-1">
                Simply write <code className="font-mono text-stone-700 font-semibold">[Your Question Text Here]</code> anywhere in the Meta Paragraph above.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {validation.variables.map((v, i) => (
                <div
                  key={v.name}
                  className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="space-y-0.5">
                    <span className="text-[11px] font-semibold text-stone-500 uppercase tracking-wide">
                      Question {i + 1}
                    </span>
                    <p className="text-sm font-semibold text-stone-900 leading-snug">
                      {v.question}
                    </p>
                  </div>
                  <div className="flex items-center gap-1.5 self-start sm:self-auto shrink-0">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-stone-200 text-stone-800">
                      [{v.question}]
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Bottom Publish Button */}
        <div className="flex justify-end pt-2">
          <button
            type="button"
            onClick={handlePublish}
            disabled={isSubmitting}
            className="inline-flex items-center gap-2 px-8 py-3.5 text-sm font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] rounded-xl shadow-md transition-all disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            <span>{isSubmitting ? 'Publishing Category...' : 'Publish Category'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
