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
    const request = window.indexedDB.open(RESUME_DB_NAME, 1);

    request.onerror = () => {
      reject(request.error ?? new Error('Failed to open the resume database.'));
    };

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(RESUME_STORE_NAME)) {
        db.createObjectStore(RESUME_STORE_NAME);
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
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