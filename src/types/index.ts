export interface ParsedVariable {
  name: string;
  question: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  icon?: string;
  metaParagraph: string; // The complete prompt template (source of truth)
  masterPrompt?: string; // Backwards compatibility with older templates
  variables?: any[]; // Backwards compatibility
  usageCount: number;
  createdAt: string; // ISO string
  updatedAt: string; // ISO string
  lastUsedAt?: string | null;
  status?: 'published' | 'archived';
  authorName?: string;
}

export interface DraftCategory {
  id: string;
  name: string;
  description: string;
  icon?: string;
  metaParagraph: string;
  masterPrompt?: string;
  updatedAt: string;
}

export interface GenerationAnswers {
  [variableName: string]: string;
}

export type SortOption = 'most_used' | 'recently_used' | 'recently_created' | 'alphabetical';

export type ActiveView =
  | { type: 'home' }
  | { type: 'categories'; tab?: 'published' | 'drafts' }
  | { type: 'create_category'; editCategoryId?: string; draftId?: string }
  | { type: 'generate_prompt'; categoryId: string }
  | { type: 'generated_result'; categoryId: string; generatedPrompt: string; answers: GenerationAnswers };
