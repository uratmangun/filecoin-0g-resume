'use client';

export type ProjectEntry = {
  title: string;
  link: string;
  description: string;
};

export type AchievementEntry = {
  title: string;
  link: string;
  description: string;
};

export type WorkEntry = {
  company: string;
  dateRange: string;
  description: string;
};

export type ResumeBasics = {
  name: string;
  email: string;
  github: string;
};

export type ResumeData = {
  basics: ResumeBasics;
  workHistory: WorkEntry[];
  projects: ProjectEntry[];
  achievements: AchievementEntry[];
  savedAt?: string;
};

const RESUME_DB_NAME = 'resume-builder';
const RESUME_STORE_NAME = 'resumes';
const RESUME_RECORD_KEY = 'current-resume';
const RESUME_LIST_STORE_NAME = 'resume-items';
const RESUME_DB_VERSION = 2;

export const createEmptyBasics = (): ResumeBasics => ({
  name: '',
  email: '',
  github: ''
});

export const createEmptyWorkEntry = (): WorkEntry => ({
  company: '',
  dateRange: '',
  description: ''
});

export const createEmptyProjectEntry = (): ProjectEntry => ({
  title: '',
  link: '',
  description: ''
});

export const createEmptyAchievementEntry = (): AchievementEntry => ({
  title: '',
  link: '',
  description: ''
});

export const hydrateList = <T extends Record<string, unknown>>(
  entries: T[] | undefined,
  createEntry: () => T
) => {
  if (!entries || entries.length === 0) {
    return [createEntry()];
  }

  return entries.map((entry) => ({
    ...createEntry(),
    ...entry
  }));
};

export const isIndexedDbAvailable = () =>
  typeof window !== 'undefined' && typeof window.indexedDB !== 'undefined';

const openResumeDatabase = (): Promise<IDBDatabase> => {
  if (!isIndexedDbAvailable()) {
    return Promise.reject(new Error('IndexedDB is not available in this environment.'));
  }

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(RESUME_DB_NAME, RESUME_DB_VERSION);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open the resume database.'));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RESUME_STORE_NAME)) {
        db.createObjectStore(RESUME_STORE_NAME);
      }
      // New store for multiple saved resumes (v2+)
      if (!db.objectStoreNames.contains(RESUME_LIST_STORE_NAME)) {
        db.createObjectStore(RESUME_LIST_STORE_NAME, { keyPath: 'id' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };
  });
};

// ---------- Multiple resumes (list) APIs ----------

export type SavedResumeEntry = {
  id: string;
  title: string;
  data: ResumeData;
  createdAt: string; // ISO
  updatedAt: string; // ISO
};

const generateId = () => {
  try {
    if (typeof crypto !== 'undefined' && typeof (crypto as any).randomUUID === 'function') {
      return (crypto as any).randomUUID();
    }
  } catch {}
  return 'r_' + Math.random().toString(36).slice(2) + '_' + Date.now().toString(36);
};

export const createSavedResume = async (
  data: ResumeData,
  title?: string
): Promise<SavedResumeEntry> => {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  const db = await openResumeDatabase();
  const now = new Date().toISOString();
  const entry: SavedResumeEntry = {
    id: generateId(),
    title: title || data.basics?.name || 'Untitled resume',
    data,
    createdAt: now,
    updatedAt: now
  };

  return new Promise<SavedResumeEntry>((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(RESUME_LIST_STORE_NAME, 'readwrite');
    const store = tx.objectStore(RESUME_LIST_STORE_NAME);
    const req = store.add(entry);

    req.onsuccess = () => {
      if (settled) return;
      settled = true;
      resolve(entry);
    };

    req.onerror = () => {
      if (settled) return;
      settled = true;
      reject(req.error ?? new Error('Failed to create saved resume.'));
    };

    tx.oncomplete = () => {
      db.close();
    };

    tx.onabort = () => {
      db.close();
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Creating saved resume was aborted.'));
    };

    tx.onerror = () => {
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Failed to create saved resume.'));
    };
  });
};

export const listSavedResumes = async (): Promise<SavedResumeEntry[]> => {
  if (!isIndexedDbAvailable()) {
    return [];
  }

  const db = await openResumeDatabase();

  return new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(RESUME_LIST_STORE_NAME, 'readonly');
    const store = tx.objectStore(RESUME_LIST_STORE_NAME);
    const getAll: any = (store as any).getAll ? (store as any).getAll() : null;

    if (getAll) {
      (getAll as IDBRequest<SavedResumeEntry[]>).onsuccess = () => {
        if (settled) return;
        settled = true;
        const list = (getAll as IDBRequest).result as SavedResumeEntry[];
        resolve([...list].sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
      };
      (getAll as IDBRequest).onerror = () => {
        if (settled) return;
        settled = true;
        reject((getAll as IDBRequest).error ?? new Error('Failed to list saved resumes.'));
      };
    } else {
      const req = store.openCursor();
      const items: SavedResumeEntry[] = [];
      (req as IDBRequest<IDBCursorWithValue | null>).onsuccess = (ev) => {
        const cursor = (ev.target as IDBRequest<IDBCursorWithValue | null>).result;
        if (cursor) {
          items.push(cursor.value as SavedResumeEntry);
          cursor.continue();
        } else {
          if (settled) return;
          settled = true;
          resolve(items.sort((a, b) => (b.updatedAt || '').localeCompare(a.updatedAt || '')));
        }
      };
      (req as IDBRequest).onerror = () => {
        if (settled) return;
        settled = true;
        reject((req as IDBRequest).error ?? new Error('Failed to list saved resumes.'));
      };
    }

    tx.oncomplete = () => {
      db.close();
    };

    tx.onabort = () => {
      db.close();
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Listing saved resumes was aborted.'));
    };

    tx.onerror = () => {
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Failed to list saved resumes.'));
    };
  });
};

export const readSavedResume = async (id: string): Promise<SavedResumeEntry | null> => {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  const db = await openResumeDatabase();

  return new Promise((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(RESUME_LIST_STORE_NAME, 'readonly');
    const store = tx.objectStore(RESUME_LIST_STORE_NAME);
    const req = store.get(id);

    req.onsuccess = () => {
      if (settled) return;
      settled = true;
      resolve((req.result as SavedResumeEntry | undefined) ?? null);
    };

    req.onerror = () => {
      if (settled) return;
      settled = true;
      reject(req.error ?? new Error('Failed to read saved resume.'));
    };

    tx.oncomplete = () => {
      db.close();
    };

    tx.onabort = () => {
      db.close();
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Reading saved resume was aborted.'));
    };

    tx.onerror = () => {
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Failed to read saved resume.'));
    };
  });
};

export const updateSavedResume = async (
  id: string,
  data: ResumeData,
  title?: string
): Promise<void> => {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  const db = await openResumeDatabase();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(RESUME_LIST_STORE_NAME, 'readwrite');
    const store = tx.objectStore(RESUME_LIST_STORE_NAME);
    const getReq = store.get(id);

    getReq.onsuccess = () => {
      const existing = getReq.result as SavedResumeEntry | undefined;
      const now = new Date().toISOString();
      const entry: SavedResumeEntry = {
        id,
        title: title ?? existing?.title ?? data.basics?.name ?? 'Untitled resume',
        data,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now
      };
      const putReq = store.put(entry);
      putReq.onsuccess = () => {
        if (settled) return;
        settled = true;
        resolve();
      };
      putReq.onerror = () => {
        if (settled) return;
        settled = true;
        reject(putReq.error ?? new Error('Failed to update saved resume.'));
      };
    };

    getReq.onerror = () => {
      if (settled) return;
      settled = true;
      reject(getReq.error ?? new Error('Failed to read existing resume for update.'));
    };

    tx.oncomplete = () => {
      db.close();
    };

    tx.onabort = () => {
      db.close();
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Updating saved resume was aborted.'));
    };

    tx.onerror = () => {
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Failed to update saved resume.'));
    };
  });
};

export const deleteSavedResume = async (id: string): Promise<void> => {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  const db = await openResumeDatabase();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const tx = db.transaction(RESUME_LIST_STORE_NAME, 'readwrite');
    const store = tx.objectStore(RESUME_LIST_STORE_NAME);
    const req = store.delete(id);

    req.onsuccess = () => {
      if (settled) return;
      settled = true;
      resolve();
    };

    req.onerror = () => {
      if (settled) return;
      settled = true;
      reject(req.error ?? new Error('Failed to delete saved resume.'));
    };

    tx.oncomplete = () => {
      db.close();
    };

    tx.onabort = () => {
      db.close();
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Deleting saved resume was aborted.'));
    };

    tx.onerror = () => {
      if (settled) return;
      settled = true;
      reject(tx.error ?? new Error('Failed to delete saved resume.'));
    };
  });
};

export const readStoredResume = async (): Promise<ResumeData | null> => {
  if (!isIndexedDbAvailable()) {
    return null;
  }

  const db = await openResumeDatabase();

  return new Promise((resolve, reject) => {
    let settled = false;
    const transaction = db.transaction(RESUME_STORE_NAME, 'readonly');
    const store = transaction.objectStore(RESUME_STORE_NAME);
    const request = store.get(RESUME_RECORD_KEY);

    request.onsuccess = () => {
      if (settled) {
        return;
      }
      settled = true;
      resolve((request.result as ResumeData | undefined) ?? null);
    };

    request.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      reject(request.error ?? new Error('Failed to read resume data.'));
    };

    transaction.oncomplete = () => {
      db.close();
    };

    transaction.onabort = () => {
      db.close();
      if (settled) {
        return;
      }
      settled = true;
      reject(transaction.error ?? new Error('Reading resume data was aborted.'));
    };

    transaction.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      reject(transaction.error ?? new Error('Failed to read resume data.'));
    };
  });
};

export const writeStoredResume = async (data: ResumeData) => {
  if (!isIndexedDbAvailable()) {
    throw new Error('IndexedDB is not available in this environment.');
  }

  const db = await openResumeDatabase();

  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const transaction = db.transaction(RESUME_STORE_NAME, 'readwrite');
    const store = transaction.objectStore(RESUME_STORE_NAME);
    const request = store.put(data, RESUME_RECORD_KEY);

    request.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      reject(request.error ?? new Error('Failed to save resume data.'));
    };

    transaction.oncomplete = () => {
      db.close();
      if (!settled) {
        settled = true;
        resolve();
      }
    };

    transaction.onabort = () => {
      db.close();
      if (settled) {
        return;
      }
      settled = true;
      reject(transaction.error ?? new Error('Saving resume data was aborted.'));
    };

    transaction.onerror = () => {
      if (settled) {
        return;
      }
      settled = true;
      reject(transaction.error ?? new Error('Failed to save resume data.'));
    };
  });
};