import React from 'react';
import { ArrowRight, Flame, Clock, Sparkles } from 'lucide-react';
import { Category } from '../types';
import { CategoryCard } from './CategoryCard';

interface HomePageProps {
  categories: Category[];
  onMakePrompt: () => void;
  onSelectCategory: (category: Category) => void;
  onEditCategory: (category: Category) => void;
  onDeleteCategory?: (category: Category) => void;
}

export const HomePage: React.FC<HomePageProps> = ({
  categories,
  onMakePrompt,
  onSelectCategory,
  onEditCategory,
  onDeleteCategory,
}) => {
  // Popular categories: Top 3 by usage count
  const popularCategories = [...categories]
    .sort((a, b) => b.usageCount - a.usageCount)
    .slice(0, 3);

  // Recently used categories: filter those with lastUsedAt, sort by lastUsedAt desc
  const recentlyUsedCategories = [...categories]
    .filter(c => c.lastUsedAt)
    .sort((a, b) => new Date(b.lastUsedAt!).getTime() - new Date(a.lastUsedAt!).getTime())
    .slice(0, 3);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Brand & Purpose: Clean, direct, distraction-free */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-100 border border-stone-200/80 text-stone-600 text-xs font-mono font-medium mb-4">
          <Sparkles className="w-3.5 h-3.5 text-stone-700" />
          <span>Dynamic Prompt Construction Platform</span>
        </div>

        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-stone-900 mb-3">
          Construct structured AI prompts in seconds.
        </h1>
        
        <p className="text-stone-600 text-base leading-relaxed">
          Select a category, answer a few structured questions, and receive a comprehensive,
          professionally engineered prompt with all original master instructions intact.
        </p>

        {/* PRIMARY FOCUS: Prominent "Make a Prompt" button */}
        <div className="mt-8 flex justify-center">
          <button
            onClick={onMakePrompt}
            className="group relative inline-flex items-center justify-center gap-3 px-8 py-4 text-base font-semibold text-stone-50 bg-stone-900 hover:bg-stone-800 active:scale-[0.99] rounded-xl shadow-md hover:shadow-lg transition-all duration-150"
          >
            <span>Make a Prompt</span>
            <ArrowRight className="w-5 h-5 text-stone-300 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>

      <div className="space-y-10 pt-4">
        {/* Popular Categories Section */}
        {popularCategories.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-amber-600" />
                <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-700">
                  Popular Categories
                </h2>
              </div>
              <button
                onClick={onMakePrompt}
                className="text-xs font-medium text-stone-600 hover:text-stone-900 transition-colors"
              >
                View all ({categories.length}) →
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {popularCategories.map((category, index) => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onSelect={onSelectCategory}
                  onEdit={onEditCategory}
                  onDelete={onDeleteCategory}
                  rankBadge={index + 1}
                />
              ))}
            </div>
          </section>
        )}

        {/* Recently Used Categories Section */}
        {recentlyUsedCategories.length > 0 && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Clock className="w-4 h-4 text-stone-500" />
              <h2 className="text-sm font-semibold tracking-wide uppercase text-stone-700">
                Recently Used
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {recentlyUsedCategories.map(category => (
                <CategoryCard
                  key={category.id}
                  category={category}
                  onSelect={onSelectCategory}
                  onEdit={onEditCategory}
                  onDelete={onDeleteCategory}
                />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
