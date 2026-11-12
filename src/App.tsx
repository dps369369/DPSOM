import React, { useState, useEffect } from 'react';
import { ActiveView, Category, DraftCategory, GenerationAnswers } from './types';
import {
  subscribeCategories,
  subscribeDrafts,
  createCategory,
  updateCategory,
  deleteCategory,
  recordUsageAndIncrement,
  saveDraft,
  deleteDraft,
} from './lib/categories';
import { testConnection } from './lib/firebase';
import { Navbar } from './components/Navbar';
import { HomePage } from './components/HomePage';
import { CategorySelectionPage } from './components/CategorySelectionPage';
import { CategoryEditor } from './components/CategoryEditor';
import { PromptGenerator } from './components/PromptGenerator';
import { GeneratedPromptPage } from './components/GeneratedPromptPage';
import { PinModal } from './components/PinModal';
import { DeleteConfirmModal } from './components/DeleteConfirmModal';
import { Loader2 } from 'lucide-react';

export default function App() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [drafts, setDrafts] = useState<DraftCategory[]>([]);
  const [activeView, setActiveView] = useState<ActiveView>({ type: 'home' });
  const [isLoading, setIsLoading] = useState(true);

  // PIN modal state
  const [isPinModalOpen, setIsPinModalOpen] = useState(false);
  const [pinActionTitle, setPinActionTitle] = useState('Category Management');
  const [pendingAction, setPendingAction] = useState<(() => void) | null>(null);

  // Deletion state for categories and drafts
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null);
  const [draftToDelete, setDraftToDelete] = useState<DraftCategory | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Session-level verified state so user doesn't have to re-enter PIN repeatedly in one sitting
  const [isSessionVerified, setIsSessionVerified] = useState(false);

  // Initialize and subscribe to Firestore categories and drafts in real time
  useEffect(() => {
    let unsubCats: (() => void) | null = null;
    let unsubDrafts: (() => void) | null = null;

    async function init() {
      try {
        await testConnection();

        unsubCats = subscribeCategories(cats => {
          setCategories(cats);
          setIsLoading(false);
        });

        unsubDrafts = subscribeDrafts(savedDrafts => {
          setDrafts(savedDrafts);
        });
      } catch (err) {
        console.error('Initialization error:', err);
        setIsLoading(false);
      }
    }

    init();

    return () => {
      if (unsubCats) unsubCats();
      if (unsubDrafts) unsubDrafts();
    };
  }, []);

  // Handle URL hash changes
  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#', '');
      if (!hash || hash === 'home') {
        setActiveView({ type: 'home' });
      } else if (hash === 'categories') {
        setActiveView({ type: 'categories', tab: 'published' });
      } else if (hash === 'drafts') {
        setActiveView({ type: 'categories', tab: 'drafts' });
      } else if (hash === 'create') {
        setActiveView({ type: 'create_category' });
      } else if (hash.startsWith('generate/')) {
        const catId = hash.replace('generate/', '');
        setActiveView({ type: 'generate_prompt', categoryId: catId });
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    if (window.location.hash) {
      handleHashChange();
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const navigate = (view: ActiveView) => {
    setActiveView(view);
    switch (view.type) {
      case 'home':
        window.location.hash = 'home';
        break;
      case 'categories':
        window.location.hash = view.tab === 'drafts' ? 'drafts' : 'categories';
        break;
      case 'create_category':
        window.location.hash = 'create';
        break;
      case 'generate_prompt':
        window.location.hash = `generate/${view.categoryId}`;
        break;
      case 'generated_result':
        break;
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  /**
   * Helper to gate privileged operations behind server-verified PIN
   */
  const executeWithPinProtection = (actionTitle: string, action: () => void) => {
    if (isSessionVerified) {
      action();
      return;
    }
    setPinActionTitle(actionTitle);
    setPendingAction(() => action);
    setIsPinModalOpen(true);
  };

  const handlePinSuccess = () => {
    setIsPinModalOpen(false);
    setIsSessionVerified(true);
    if (pendingAction) {
      pendingAction();
      setPendingAction(null);
    }
  };

  // 1. PIN-protected: Create Category
  const handleRequestCreateCategory = () => {
    executeWithPinProtection('Create Category', () => {
      navigate({ type: 'create_category' });
    });
  };

  // 2. PIN-protected: Edit Category
  const handleRequestEditCategory = (category: Category) => {
    executeWithPinProtection(`Edit ${category.name}`, () => {
      navigate({ type: 'create_category', editCategoryId: category.id });
    });
  };

  // 3. PIN-protected: Delete Category (PIN + Additional Confirmation)
  const handleRequestDeleteCategory = (category: Category) => {
    executeWithPinProtection(`Delete ${category.name}`, () => {
      setDraftToDelete(null);
      setCategoryToDelete(category);
      setIsDeleteModalOpen(true);
    });
  };

  const handleConfirmDelete = async () => {
    setIsDeleting(true);
    try {
      if (categoryToDelete) {
        await deleteCategory(categoryToDelete.id);
        setCategoryToDelete(null);
        if (
          (activeView.type === 'generate_prompt' || activeView.type === 'create_category') &&
          (activeView as any).categoryId === categoryToDelete.id
        ) {
          navigate({ type: 'categories', tab: 'published' });
        }
      } else if (draftToDelete) {
        await deleteDraft(draftToDelete.id);
        setDraftToDelete(null);
      }
      setIsDeleteModalOpen(false);
    } catch (err) {
      console.error('Failed to delete item:', err);
    } finally {
      setIsDeleting(false);
    }
  };

  // Draft operations
  const handleResumeDraft = (draft: DraftCategory) => {
    // Resuming a draft opens CategoryEditor with the draft loaded
    executeWithPinProtection(`Resume Draft "${draft.name || 'Untitled'}"`, () => {
      navigate({ type: 'create_category', draftId: draft.id });
    });
  };

  // PIN-protected: Delete Draft (PIN + Additional Confirmation)
  const handleDeleteDraft = (draft: DraftCategory) => {
    executeWithPinProtection(`Delete Draft "${draft.name || 'Untitled Draft'}"`, () => {
      setCategoryToDelete(null);
      setDraftToDelete(draft);
      setIsDeleteModalOpen(true);
    });
  };

  // Public: Select Category for prompt generation
  const handleSelectCategory = (category: Category) => {
    navigate({ type: 'generate_prompt', categoryId: category.id });
  };

  // Category saving & publishing
  const handlePublishCategory = async (
    categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt'>
  ) => {
    if (activeView.type === 'create_category' && activeView.editCategoryId) {
      await updateCategory(activeView.editCategoryId, categoryData);
    } else {
      await createCategory(categoryData);
      // If we published from an existing draft, delete the draft
      if (activeView.type === 'create_category' && activeView.draftId) {
        try {
          await deleteDraft(activeView.draftId);
        } catch {
          // ignore
        }
      }
    }
    navigate({ type: 'categories', tab: 'published' });
  };

  const handleSaveDraft = async (draft: Omit<DraftCategory, 'updatedAt'>) => {
    await saveDraft(draft);
  };

  // Public prompt generation
  const handleGeneratePrompt = async (
    categoryId: string,
    completedPrompt: string,
    answers: GenerationAnswers
  ) => {
    await recordUsageAndIncrement(categoryId);
    navigate({
      type: 'generated_result',
      categoryId,
      generatedPrompt: completedPrompt,
      answers,
    });
  };

  const selectedCategory =
    activeView.type === 'generate_prompt' || activeView.type === 'generated_result'
      ? categories.find(c => c.id === activeView.categoryId) || null
      : null;

  const editingCategory =
    activeView.type === 'create_category' && activeView.editCategoryId
      ? categories.find(c => c.id === activeView.editCategoryId) || null
      : null;

  const editingDraft =
    activeView.type === 'create_category' && activeView.draftId
      ? drafts.find(d => d.id === activeView.draftId) || null
      : null;

  return (
    <div className="min-h-screen bg-[#FAF9F5] text-stone-900 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        currentView={activeView}
        onNavigate={navigate}
        onCreateClick={handleRequestCreateCategory}
        onDraftsClick={() => navigate({ type: 'categories', tab: 'drafts' })}
        draftsCount={drafts.length}
      />

      {/* Main Content */}
      <main className="flex-1">
        {isLoading && categories.length === 0 ? (
          <div className="flex flex-col items-center justify-center min-h-[50vh] gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-stone-500" />
            <p className="text-xs font-mono text-stone-500">Connecting to DPSOM engine...</p>
          </div>
        ) : (
          <>
            {activeView.type === 'home' && (
              <HomePage
                categories={categories}
                onMakePrompt={() => navigate({ type: 'categories', tab: 'published' })}
                onSelectCategory={handleSelectCategory}
                onEditCategory={handleRequestEditCategory}
                onDeleteCategory={handleRequestDeleteCategory}
              />
            )}

            {activeView.type === 'categories' && (
              <CategorySelectionPage
                categories={categories}
                drafts={drafts}
                activeTab={activeView.tab || 'published'}
                onTabChange={tab => navigate({ type: 'categories', tab })}
                onSelectCategory={handleSelectCategory}
                onCreateCategory={handleRequestCreateCategory}
                onEditCategory={handleRequestEditCategory}
                onDeleteCategory={handleRequestDeleteCategory}
                onResumeDraft={handleResumeDraft}
                onDeleteDraft={handleDeleteDraft}
              />
            )}

            {activeView.type === 'create_category' && (
              <CategoryEditor
                initialCategory={editingCategory}
                initialDraft={editingDraft}
                onPublish={handlePublishCategory}
                onSaveDraft={handleSaveDraft}
                onCancel={() => navigate({ type: 'categories', tab: 'published' })}
              />
            )}

            {activeView.type === 'generate_prompt' && (
              selectedCategory ? (
                <PromptGenerator
                  category={selectedCategory}
                  onGenerate={async (prompt, answers) => {
                    await handleGeneratePrompt(selectedCategory.id, prompt, answers);
                  }}
                  onBack={() => navigate({ type: 'categories', tab: 'published' })}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-stone-600 mb-4">Category not found or loading...</p>
                  <button
                    onClick={() => navigate({ type: 'categories', tab: 'published' })}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm"
                  >
                    Back to Categories
                  </button>
                </div>
              )
            )}

            {activeView.type === 'generated_result' && (
              selectedCategory ? (
                <GeneratedPromptPage
                  category={selectedCategory}
                  initialPrompt={activeView.generatedPrompt}
                  answers={activeView.answers}
                  onGenerateAgain={() =>
                    navigate({ type: 'generate_prompt', categoryId: selectedCategory.id })
                  }
                  onBackToCategory={() =>
                    navigate({ type: 'generate_prompt', categoryId: selectedCategory.id })
                  }
                  onExploreMore={() => navigate({ type: 'categories', tab: 'published' })}
                />
              ) : (
                <div className="text-center py-20">
                  <p className="text-stone-600 mb-4">Prompt construction complete.</p>
                  <button
                    onClick={() => navigate({ type: 'categories', tab: 'published' })}
                    className="px-4 py-2 bg-stone-900 text-white rounded-lg text-sm"
                  >
                    Explore Categories
                  </button>
                </div>
              )
            )}
          </>
        )}
      </main>

      {/* PIN Verification Modal */}
      <PinModal
        isOpen={isPinModalOpen}
        actionTitle={pinActionTitle}
        onSuccess={handlePinSuccess}
        onCancel={() => {
          setIsPinModalOpen(false);
          setPendingAction(null);
        }}
      />

      {/* Delete Confirmation Modal for Categories and Drafts */}
      <DeleteConfirmModal
        isOpen={isDeleteModalOpen}
        title={categoryToDelete ? 'Delete Category?' : 'Delete Draft?'}
        name={categoryToDelete?.name || draftToDelete?.name || 'Untitled'}
        description={categoryToDelete?.description || draftToDelete?.description}
        message={
          categoryToDelete
            ? 'Are you sure you want to permanently delete this category from the public community repository?'
            : 'Are you sure you want to delete this in-progress draft? It will be removed permanently.'
        }
        confirmLabel={categoryToDelete ? 'Delete Category' : 'Delete Draft'}
        isDeleting={isDeleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => {
          setIsDeleteModalOpen(false);
          setCategoryToDelete(null);
          setDraftToDelete(null);
        }}
      />

      {/* Footer */}
      <footer className="border-t border-stone-200/80 bg-white/60 py-6 mt-12 text-center text-xs text-stone-500">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-stone-800 font-mono">DPSOM</span>
            <span>•</span>
            <span>Dynamic Prompt Construction Platform</span>
          </div>
          <div className="text-stone-400">
            Natural-language prompt templates with automatic question extraction.
          </div>
        </div>
      </footer>
    </div>
  );
}
