import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  increment,
  onSnapshot,
  query,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './firebase';
import { Category, DraftCategory } from '../types';
import { getCategoryMetaParagraph } from './prompt-engine';

const CATEGORIES_COLLECTION = 'categories';
const USAGE_COLLECTION = 'category_usage';
const DRAFTS_COLLECTION = 'drafts';

// Hardcoded examples removed so user deletions are 100% permanent
export const INITIAL_COMMUNITY_CATEGORIES: Omit<Category, 'id'>[] = [];

/**
 * Real-time listener for categories collection.
 */
export function subscribeCategories(
  onUpdate: (categories: Category[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = CATEGORIES_COLLECTION;
  const colRef = collection(db, path);
  const q = query(colRef);

  return onSnapshot(
    q,
    snapshot => {
      const cats: Category[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        const metaParagraph = getCategoryMetaParagraph(data);

        cats.push({
          id: docSnap.id,
          name: data.name || 'Untitled Category',
          description: data.description || '',
          icon: data.icon || 'Folder',
          metaParagraph,
          masterPrompt: data.masterPrompt || metaParagraph,
          variables: data.variables || [],
          usageCount: typeof data.usageCount === 'number' ? data.usageCount : 0,
          createdAt: data.createdAt || new Date().toISOString(),
          updatedAt: data.updatedAt || new Date().toISOString(),
          lastUsedAt: data.lastUsedAt || null,
          status: data.status || 'published',
          authorName: data.authorName || 'Community Member',
        });
      });

      // Provide realtime category updates directly from Firestore
      onUpdate(cats);
    },
    error => {
      console.error('Subscription error on categories:', error);
      if (onError) onError(error as Error);
      try {
        handleFirestoreError(error, OperationType.GET, path);
      } catch (e) {
        // logged via handleFirestoreError
      }
    }
  );
}

/**
 * Permanently disabled to ensure deleted categories remain deleted across all devices and reloads
 */
export async function seedInitialCategories(): Promise<void> {
  return;
}

/**
 * Fetch a single category by ID.
 */
export async function fetchCategory(id: string): Promise<Category | null> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    const docSnap = await getDoc(doc(db, CATEGORIES_COLLECTION, id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    const metaParagraph = getCategoryMetaParagraph(data);

    return {
      id: docSnap.id,
      name: data.name || '',
      description: data.description || '',
      icon: data.icon || 'Folder',
      metaParagraph,
      masterPrompt: data.masterPrompt || metaParagraph,
      variables: data.variables || [],
      usageCount: typeof data.usageCount === 'number' ? data.usageCount : 0,
      createdAt: data.createdAt || new Date().toISOString(),
      updatedAt: data.updatedAt || new Date().toISOString(),
      lastUsedAt: data.lastUsedAt || null,
      status: data.status || 'published',
      authorName: data.authorName || 'Community Member',
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

/**
 * Create a new category in Firestore.
 */
export async function createCategory(
  categoryData: Omit<Category, 'id' | 'createdAt' | 'updatedAt' | 'usageCount' | 'lastUsedAt'>
): Promise<string> {
  const path = CATEGORIES_COLLECTION;
  try {
    const id = 'cat_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const now = new Date().toISOString();
    const docRef = doc(db, path, id);

    const newCategory = {
      ...categoryData,
      id,
      metaParagraph: categoryData.metaParagraph,
      masterPrompt: categoryData.metaParagraph,
      usageCount: 0,
      createdAt: now,
      updatedAt: now,
      lastUsedAt: null,
      status: 'published',
    };

    await setDoc(docRef, newCategory);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

/**
 * Update an existing category.
 */
export async function updateCategory(id: string, updates: Partial<Category>): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    const docRef = doc(db, CATEGORIES_COLLECTION, id);
    const payload: Record<string, any> = {
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    if (updates.metaParagraph) {
      payload.masterPrompt = updates.metaParagraph;
    }
    await updateDoc(docRef, payload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
  }
}

/**
 * Delete a category.
 */
export async function deleteCategory(id: string): Promise<void> {
  const path = `${CATEGORIES_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, CATEGORIES_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Record successful prompt generation.
 */
export async function recordUsageAndIncrement(categoryId: string): Promise<void> {
  const now = new Date().toISOString();
  try {
    const catRef = doc(db, CATEGORIES_COLLECTION, categoryId);
    await updateDoc(catRef, {
      usageCount: increment(1),
      lastUsedAt: now,
    });

    const usageId = 'use_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 7);
    const usageRef = doc(db, USAGE_COLLECTION, usageId);
    await setDoc(usageRef, {
      id: usageId,
      categoryId,
      usedAt: now,
    });
  } catch (error) {
    console.error('Failed to log usage increment:', error);
  }
}

/**
 * Draft management
 */
export async function saveDraft(draft: Omit<DraftCategory, 'updatedAt'>): Promise<string> {
  const path = DRAFTS_COLLECTION;
  try {
    const id = draft.id || 'draft_' + Date.now().toString(36);
    const docRef = doc(db, DRAFTS_COLLECTION, id);
    const draftData: DraftCategory = {
      ...draft,
      id,
      updatedAt: new Date().toISOString(),
    };
    await setDoc(docRef, draftData);
    return id;
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

export async function fetchDrafts(): Promise<DraftCategory[]> {
  const path = DRAFTS_COLLECTION;
  try {
    const snap = await getDocs(collection(db, DRAFTS_COLLECTION));
    const drafts: DraftCategory[] = [];
    snap.forEach(docSnap => {
      drafts.push(docSnap.data() as DraftCategory);
    });
    return drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export function subscribeDrafts(
  onUpdate: (drafts: DraftCategory[]) => void,
  onError?: (err: Error) => void
): () => void {
  const path = DRAFTS_COLLECTION;
  const colRef = collection(db, path);
  return onSnapshot(
    colRef,
    snapshot => {
      const drafts: DraftCategory[] = [];
      snapshot.forEach(docSnap => {
        const data = docSnap.data();
        drafts.push({
          id: docSnap.id,
          name: data.name || 'Untitled Draft',
          description: data.description || '',
          icon: data.icon || 'Folder',
          metaParagraph: data.metaParagraph || data.masterPrompt || '',
          updatedAt: data.updatedAt || new Date().toISOString(),
        });
      });
      drafts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      onUpdate(drafts);
    },
    error => {
      console.error('Subscription error on drafts:', error);
      if (onError) onError(error as Error);
    }
  );
}

export async function fetchDraft(id: string): Promise<DraftCategory | null> {
  const path = `${DRAFTS_COLLECTION}/${id}`;
  try {
    const docSnap = await getDoc(doc(db, DRAFTS_COLLECTION, id));
    if (!docSnap.exists()) return null;
    const data = docSnap.data();
    return {
      id: docSnap.id,
      name: data.name || 'Untitled Draft',
      description: data.description || '',
      icon: data.icon || 'Folder',
      metaParagraph: data.metaParagraph || data.masterPrompt || '',
      updatedAt: data.updatedAt || new Date().toISOString(),
    };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
  }
}

export async function deleteDraft(id: string): Promise<void> {
  const path = `${DRAFTS_COLLECTION}/${id}`;
  try {
    await deleteDoc(doc(db, DRAFTS_COLLECTION, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}
