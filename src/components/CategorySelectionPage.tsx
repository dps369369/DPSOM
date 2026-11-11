import React, { useState, useMemo } from 'react';
import { Search, ArrowUpDown, FolderPlus, Lock, FileEdit, Compass, Layers } from 'lucide-react';
import { Category, DraftCategory, SortOption } from '../types';
import { CategoryCard } from './CategoryCard';
import { DraftCard } from './DraftCard';
import { getCategoryMetaParagraph } from '../lib/prompt-engine';

interface CategorySelectionPageProps {
  categories: Category[];
  drafts: DraftCategory[];
  activeTab?: 'published' | 'drafts';
  onTabChange?: (tab: 'published' | 'drafts') => void;
  onSelectCategory: (category: Category) => void;
  onCreateCategory: () => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory: (category: Category) => void;
  onResumeDraft: (draft: DraftCategory) => void;
  onDeleteDraft: (draft: DraftCategory) => void;
}

export const CategorySelectionPage: React.FC<CategorySelectionPageProps> = ({
  categories,
  drafts,
  activeTab = 'published',
  onTabChange,
  onSelectCategory,
  onCreateCategory,
  onEditCategory,
  onDeleteCategory,
  onResumeDraft,
  onDeleteDraft,
}) => {
  const [internalTab, setInternalTab] = useState<'published' | 'drafts'>(activeTab);
  const currentTab = onTabChange ? activeTab : internalTab;

  const handleTabSelect = (tab: 'published' | 'drafts') => {
    if (onTabChange) {
      onTabChange(tab);
    } else {
      setInternalTab(tab);
    }
  };

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('most_used');

  const filteredAndSortedCategories = useMemo(() => {
    let result = [...categories];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(cat => {
        const matchName = cat.name.toLowerCase().includes(q);
        const matchDesc = cat.description.toLowerCase().includes(q);
        const meta = getCategoryMetaParagraph(cat).toLowerCase();
        const matchMeta = meta.includes(q);
        return matchName || matchDesc || matchMeta;
      });
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case 'most_used':
          return b.usageCount - a.usageCount;
        case 'recently_used': {
          const timeA = a.lastUsedAt ? new Date(a.lastUsedAt).getTime() : 0;
          const timeB = b.lastUsedAt ? new Date(b.lastUsedAt).getTime() : 0;
          return timeB - timeA;
        }
        case 'recently_created':
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        case 'alphabetical':
          return a.name.localeCompare(b.name);
        default:
          return 0;
      }
    });

    return result;
  }, [categories, searchQuery, sortBy]);

  const filteredDrafts = useMemo(() => {
    if (!searchQuery.trim()) return drafts;
    const q = searchQuery.toLowerCase().trim();
    return drafts.filter(
      d =>
        d.name.toLowerCase().includes(q) ||
        d.description.toLowerCase().includes(q) ||
        (d.metaParagraph && d.metaParagraph.toLowerCase().includes(q))
    );
  }, [drafts, searchQuery]);

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      {/* Top Header & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-stone-900 tracking-tight">
            {currentTab === 'published' ? 'Category Library' : 'Saved Draft Categories'}
          </h1>
          <p className="text-stone-600 text-sm mt-1">
            {currentTab === 'published'
              ? 'Select a prompt category or create a new template for the community.'
              : 'Continue working on your unpublished category templates.'}
          </p>
        </div>

        {/* Primary Action: Create Category (PIN-protected) */}
        <button
          onClick={onCreateCategory}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-stone-900 bg-white border border-stone-300 hover:border-stone-400 hover:bg-stone-50 rounded-xl shadow-xs transition-colors self-start sm:self-auto"
        >
          <FolderPlus className="w-4 h-4 text-stone-600" />
          <span>Create New Category</span>
          <Lock className="w-3 h-3 text-stone-400 ml-0.5" />
        </button>
      </div>

      {/* Primary Navigation Tabs: Published vs Drafts */}
      <div className="flex items-center gap-2 mb-6 border-b border-stone-200/80">
        <button
          type="button"
          onClick={() => handleTabSelect('published')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors -mb-px ${
            currentTab === 'published'
              ? 'border-stone-900 text-stone-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <Compass className="w-4 h-4" />
          <span>Published Categories</span>
          <span className="text-xs px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 font-mono">
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          onClick={() => handleTabSelect('drafts')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs sm:text-sm font-semibold border-b-2 transition-colors -mb-px ${
            currentTab === 'drafts'
              ? 'border-amber-600 text-amber-900'
              : 'border-transparent text-stone-500 hover:text-stone-800'
          }`}
        >
          <FileEdit className="w-4 h-4 text-amber-600" />
          <span>Drafts</span>
          {drafts.length > 0 && (
            <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-mono font-bold">
              {drafts.length}
            </span>
          )}
        </button>
      </div>

      {/* Search and Sorting Controls */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-stone-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder={
              currentTab === 'published'
                ? 'Search categories or prompt terms...'
                : 'Search saved drafts...'
            }
            className="w-full pl-10 pr-4 py-2 bg-white border border-stone-200 rounded-lg text-sm text-stone-900 placeholder:text-stone-400 focus:outline-none focus:ring-2 focus:ring-stone-400 focus:border-stone-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-400 hover:text-stone-600"
            >
              Clear
            </button>
          )}
        </div>

        {currentTab === 'published' && (
          <div className="flex items-center gap-2 self-end sm:self-auto">
            <label
              htmlFor="sort-select"
              className="text-xs text-stone-500 font-medium flex items-center gap-1"
            >
              <ArrowUpDown className="w-3.5 h-3.5" />
              <span>Sort:</span>
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={e => setSortBy(e.target.value as SortOption)}
              className="bg-white border border-stone-200 text-stone-800 text-xs sm:text-sm font-medium rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-stone-400 cursor-pointer"
            >
              <option value="most_used">Most Used</option>
              <option value="recently_used">Recently Used</option>
              <option value="recently_created">Recently Created</option>
              <option value="alphabetical">Alphabetical</option>
            </select>
          </div>
        )}
      </div>

      {/* Main Tab Content */}
      {currentTab === 'published' ? (
        filteredAndSortedCategories.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredAndSortedCategories.map((category, index) => (
              <CategoryCard
                key={category.id}
                category={category}
                onSelect={onSelectCategory}
                onEdit={onEditCategory}
                onDelete={onDeleteCategory}
                rankBadge={sortBy === 'most_used' ? index + 1 : undefined}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-dashed border-stone-300">
            <p className="text-base font-semibold text-stone-800 mb-1">
              {categories.length === 0
                ? 'No categories yet in the community repository'
                : 'No matching categories found'}
            </p>
            <p className="text-xs text-stone-500 mb-4">
              {categories.length === 0
                ? 'Be the first to create a dynamic category!'
                : 'Try adjusting your search terms or create a new category.'}
            </p>
            <button
              onClick={onCreateCategory}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-50 bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <span>Create Category</span>
              <Lock className="w-3 h-3 text-stone-400" />
            </button>
          </div>
        )
      ) : (
        /* Drafts Tab */
        filteredDrafts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrafts.map(draft => (
              <DraftCard
                key={draft.id}
                draft={draft}
                onResume={onResumeDraft}
                onDelete={onDeleteDraft}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-16 px-4 bg-white rounded-xl border border-dashed border-amber-200">
            <FileEdit className="w-8 h-8 text-amber-500 mx-auto mb-2 opacity-80" />
            <p className="text-base font-semibold text-stone-800 mb-1">
              {drafts.length === 0 ? 'No drafts saved yet' : 'No matching drafts found'}
            </p>
            <p className="text-xs text-stone-500 mb-4">
              When creating a category, click "Save Draft" at any time to preserve your in-progress work here.
            </p>
            <button
              onClick={onCreateCategory}
              className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-stone-50 bg-stone-900 rounded-lg hover:bg-stone-800 transition-colors"
            >
              <span>Start New Category</span>
              <Lock className="w-3 h-3 text-stone-400" />
            </button>
          </div>
        )
      )}
    </div>
  );
};
