import React, { useState, useMemo } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  Sparkles,
  AlertCircle,
  List,
  Layers,
  HelpCircle,
  CheckCircle,
} from 'lucide-react';
import { Category, GenerationAnswers, ParsedVariable } from '../types';
import {
  parseMetaParagraph,
  constructPrompt,
  getCategoryMetaParagraph,
} from '../lib/prompt-engine';
import { CategoryIcon } from './IconHelper';

interface PromptGeneratorProps {
  category: Category;
  initialAnswers?: GenerationAnswers;
  onGenerate: (completedPrompt: string, answers: GenerationAnswers) => Promise<void>;
  onBack: () => void;
}

export const PromptGenerator: React.FC<PromptGeneratorProps> = ({
  category,
  initialAnswers = {},
  onGenerate,
  onBack,
}) => {
  const metaParagraph = useMemo(() => {
    return getCategoryMetaParagraph(category);
  }, [category]);

  const variables: ParsedVariable[] = useMemo(() => {
    return parseMetaParagraph(metaParagraph);
  }, [metaParagraph]);

  const [answers, setAnswers] = useState<GenerationAnswers>(() => ({
    ...initialAnswers,
  }));

  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [viewMode, setViewMode] = useState<'step_by_step' | 'all_questions'>('step_by_step');
  const [validationError, setValidationError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const totalQuestions = variables.length;
  const currentVariable = variables[currentStepIndex];

  const handleAnswerChange = (varName: string, value: string) => {
    setAnswers(prev => ({
      ...prev,
      [varName]: value,
    }));
    setValidationError(null);
  };

  const handleNext = () => {
    if (!currentVariable) return;
    const currentAns = answers[currentVariable.name];
    if (!currentAns || !currentAns.trim()) {
      setValidationError(`Please answer this question before continuing.`);
      return;
    }
    setValidationError(null);
    if (currentStepIndex < totalQuestions - 1) {
      setCurrentStepIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    setValidationError(null);
    if (currentStepIndex > 0) {
      setCurrentStepIndex(prev => prev - 1);
    }
  };

  const handleExecuteGenerate = async () => {
    const result = constructPrompt(metaParagraph, answers);
    if (result.missingRequired.length > 0) {
      const missingList = result.missingRequired.map(v => `(${v})`).join(', ');
      setValidationError(`Please answer all questions before generating: ${missingList}`);
      return;
    }

    setIsGenerating(true);
    setValidationError(null);
    try {
      await onGenerate(result.completedPrompt, answers);
    } catch (err) {
      setValidationError(err instanceof Error ? err.message : 'Failed to generate prompt.');
      setIsGenerating(false);
    }
  };

  const answeredCount = variables.filter(
    v => answers[v.name] && answers[v.name].trim().length > 0
  ).length;
  const progressPercent = totalQuestions > 0 ? Math.round((answeredCount / totalQuestions) * 100) : 0;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8">
      {/* Category Header */}
      <div className="mb-6 pb-4 border-b border-stone-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg text-stone-500 hover:text-stone-900 hover:bg-stone-100 transition-colors"
            title="Back to categories"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-stone-100 border border-stone-200 text-stone-700">
                <CategoryIcon name={category.icon} className="w-4 h-4" />
              </span>
              <h1 className="text-xl font-bold text-stone-900 tracking-tight">
                {category.name}
              </h1>
            </div>
            <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">
              {category.description}
            </p>
          </div>
        </div>

        {/* View mode switcher */}
        <div className="flex items-center bg-stone-200/70 p-1 rounded-lg text-xs font-medium self-end sm:self-auto">
          <button
            onClick={() => setViewMode('step_by_step')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'step_by_step'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Step-by-Step</span>
          </button>
          <button
            onClick={() => setViewMode('all_questions')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md transition-colors ${
              viewMode === 'all_questions'
                ? 'bg-white text-stone-900 shadow-xs'
                : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>All Questions</span>
          </button>
        </div>
      </div>

      {/* Progress Bar & Counter */}
      <div className="mb-8">
        <div className="flex items-center justify-between text-xs font-medium text-stone-600 mb-2">
          <span>
            {answeredCount} of {totalQuestions} answered ({progressPercent}%)
          </span>
          {viewMode === 'step_by_step' && (
            <span className="text-stone-500 font-mono">
              Question {currentStepIndex + 1} of {totalQuestions}
            </span>
          )}
        </div>
        <div className="w-full h-1.5 bg-stone-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-stone-900 transition-all duration-300 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Validation Error banner */}
      {validationError && (
        <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 text-xs sm:text-sm text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{validationError}</span>
        </div>
      )}

      {/* Question Form */}
      {variables.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-2xl border border-stone-200 p-8 text-stone-500">
          <HelpCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
          <p className="text-sm font-semibold text-stone-800">No questions found</p>
          <p className="text-xs text-stone-500 mt-1">
            This category does not have any [Question] markers in its meta paragraph.
          </p>
        </div>
      ) : viewMode === 'step_by_step' ? (
        /* Step-by-Step Mode */
        <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 shadow-xs">
          {currentVariable && (
            <div className="space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700">
                    Question {currentStepIndex + 1} of {totalQuestions}
                  </span>
                </div>

                <h2 className="text-lg sm:text-xl font-bold text-stone-900 leading-snug">
                  {currentVariable.question}
                </h2>
                <p className="text-xs text-stone-400 mt-1">
                  Answers can be as detailed as needed. Line breaks and paragraphs are preserved.
                </p>
              </div>

              {/* Multiline textarea for full text input */}
              <div className="pt-2">
                <textarea
                  rows={6}
                  value={answers[currentVariable.name] || ''}
                  onChange={e => handleAnswerChange(currentVariable.name, e.target.value)}
                  placeholder="Type your answer here... (multiple paragraphs supported)"
                  className="w-full px-4 py-3 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all shadow-xs resize-y"
                  autoFocus
                />
              </div>

              {/* Action Buttons */}
              <div className="pt-6 border-t border-stone-100 flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={handlePrevious}
                  disabled={currentStepIndex === 0}
                  className="inline-flex items-center gap-1.5 px-4 py-2.5 text-xs sm:text-sm font-medium text-stone-700 bg-stone-100 hover:bg-stone-200 rounded-xl transition-colors disabled:opacity-40"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Previous</span>
                </button>

                <div className="flex items-center gap-2">
                  {currentStepIndex < totalQuestions - 1 ? (
                    <button
                      type="button"
                      onClick={handleNext}
                      className="inline-flex items-center gap-2 px-5 py-2.5 text-xs sm:text-sm font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 rounded-xl shadow-xs transition-colors"
                    >
                      <span>Next</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={handleExecuteGenerate}
                      disabled={isGenerating}
                      className="inline-flex items-center gap-2 px-6 py-2.5 text-xs sm:text-sm font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>{isGenerating ? 'Constructing...' : 'Generate Prompt'}</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      ) : (
        /* All Questions Mode */
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-stone-200/90 p-6 sm:p-8 space-y-6 shadow-xs">
            {variables.map((v, idx) => (
              <div
                key={v.name}
                className="pb-6 border-b border-stone-100 last:border-0 last:pb-0"
              >
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-700">
                    Question {idx + 1}
                  </span>
                  {answers[v.name]?.trim() && (
                    <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                      <CheckCircle className="w-3.5 h-3.5" />
                      <span>Answered</span>
                    </span>
                  )}
                </div>

                <label className="block text-sm sm:text-base font-semibold text-stone-900 mb-2 leading-snug">
                  {v.question}
                </label>

                <textarea
                  rows={4}
                  value={answers[v.name] || ''}
                  onChange={e => handleAnswerChange(v.name, e.target.value)}
                  placeholder="Type your answer here... (multiple paragraphs supported)"
                  className="w-full px-4 py-2.5 bg-white border border-stone-300 rounded-xl text-stone-900 text-sm leading-relaxed focus:outline-none focus:ring-2 focus:ring-stone-400 resize-y"
                />
              </div>
            ))}
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleExecuteGenerate}
              disabled={isGenerating}
              className="inline-flex items-center justify-center gap-2.5 px-8 py-3.5 text-sm font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 rounded-xl shadow-md transition-all active:scale-[0.99] disabled:opacity-50"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{isGenerating ? 'Constructing Prompt...' : 'Generate Prompt'}</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
