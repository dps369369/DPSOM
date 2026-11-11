import React from 'react';
import { Plus, Compass, Lock, FileEdit } from 'lucide-react';
import { ActiveView } from '../types';

interface NavbarProps {
  currentView: ActiveView;
  onNavigate: (view: ActiveView) => void;
  onCreateClick: () => void;
  onDraftsClick?: () => void;
  draftsCount?: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  onCreateClick,
  onDraftsClick,
  draftsCount = 0,
}) => {
  const isCategoriesActive = currentView.type === 'categories';
  const isDraftsTab = isCategoriesActive && (currentView as any).tab === 'drafts';

  return (
    <header className="sticky top-0 z-40 bg-[#FAF9F5]/90 backdrop-blur-md border-b border-stone-200/80">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => onNavigate({ type: 'home' })}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="w-8 h-8 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center font-bold text-sm tracking-wider shadow-sm group-hover:bg-stone-800 transition-colors">
            DP
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <span className="font-semibold text-stone-900 text-lg tracking-tight font-mono">
                DPSOM
              </span>
              <span className="hidden sm:inline-block text-[11px] font-medium px-2 py-0.5 rounded-full bg-stone-100 border border-stone-200 text-stone-600">
                Prompt Engine
              </span>
            </div>
            <span className="text-[11px] text-stone-400 hidden sm:block -mt-1 font-normal">
              Dynamic Construction Platform
            </span>
          </div>
        </div>

        {/* Navigation items */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={() => onNavigate({ type: 'categories', tab: 'published' })}
            className={`flex items-center gap-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              isCategoriesActive && !isDraftsTab
                ? 'bg-stone-200/70 text-stone-900'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <Compass className="w-4 h-4 text-stone-500" />
            <span>Explore</span>
          </button>

          {/* Drafts direct link */}
          <button
            onClick={() => {
              if (onDraftsClick) {
                onDraftsClick();
              } else {
                onNavigate({ type: 'categories', tab: 'drafts' });
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              isDraftsTab
                ? 'bg-amber-100 text-amber-900 font-semibold'
                : 'text-stone-600 hover:text-stone-900 hover:bg-stone-100'
            }`}
          >
            <FileEdit className="w-4 h-4 text-amber-700" />
            <span>Drafts</span>
            {draftsCount > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-amber-200/80 text-amber-900">
                {draftsCount}
              </span>
            )}
          </button>

          <button
            onClick={onCreateClick}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition-colors ${
              currentView.type === 'create_category'
                ? 'bg-stone-900 text-stone-50 shadow-sm'
                : 'bg-stone-900 hover:bg-stone-800 text-stone-50 shadow-sm'
            }`}
          >
            <Plus className="w-4 h-4" />
            <span>Create Category</span>
            <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
