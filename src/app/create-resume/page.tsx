'use client';

import { useEffect, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { sdk } from '@farcaster/miniapp-sdk';

import { createEmptyAchievementEntry, createEmptyBasics, createEmptyProjectEntry, createEmptyWorkEntry, hydrateList, isIndexedDbAvailable, readStoredResume, writeStoredResume, createSavedResume, listSavedResumes, readSavedResume, updateSavedResume, deleteSavedResume, SAMPLE_RESUME_ID, isSampleResumeId, type SavedResumeEntry, type AchievementEntry, type ProjectEntry, type ResumeBasics, type WorkEntry } from '@/lib/resume-storage';

const formatSavedAt = (isoTimestamp: string) => {
  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
};

export default function CreateResumePage() {
  const router = useRouter();
  useEffect(() => {
    const initializeSdk = async () => {
      await sdk.actions.ready();
    };
    initializeSdk();
  }, []);

  useEffect(() => {
    let isCancelled = false;
    const loadList = async () => {
      setIsListLoading(true);
      try {
        const list = await listSavedResumes();
        if (!isCancelled) {
          setSavedResumes(list);
          setListErrorMessage(null);
        }
      } catch (error) {
        if (!isCancelled) {
          console.error('Failed to load saved resumes list', error);
          setListErrorMessage('We could not load your saved resumes.');
        }
      } finally {
        if (!isCancelled) {
          setIsListLoading(false);
        }
      }
    };
    loadList();
    return () => {
      isCancelled = true;
    };
  }, []);

  const [resumeBasics, setResumeBasics] = useState<ResumeBasics>(createEmptyBasics());
  const [workHistoryEntries, setWorkHistoryEntries] = useState<WorkEntry[]>([createEmptyWorkEntry()]);
  const [projectEntries, setProjectEntries] = useState<ProjectEntry[]>([createEmptyProjectEntry()]);
  const [achievementEntries, setAchievementEntries] = useState<AchievementEntry[]>([createEmptyAchievementEntry()]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [saveErrorMessage, setSaveErrorMessage] = useState('');
  const [lastSavedTimestamp, setLastSavedTimestamp] = useState<string | null>(null);
  const [loadErrorMessage, setLoadErrorMessage] = useState<string | null>(null);
  const [savedResumes, setSavedResumes] = useState<SavedResumeEntry[]>([]);
  const [isListLoading, setIsListLoading] = useState(false);
  const [listErrorMessage, setListErrorMessage] = useState<string | null>(null);
  const [selectedResumeId, setSelectedResumeId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    let isCancelled = false;

    const loadResumeFromStorage = async () => {
      try {
        const stored = await readStoredResume();
        if (isCancelled) {
          return;
        }
        if (!stored) {
          // No saved snapshot yet - start from a blank form state
          setResumeBasics(createEmptyBasics());
          setWorkHistoryEntries([createEmptyWorkEntry()]);
          setProjectEntries([createEmptyProjectEntry()]);
          setAchievementEntries([createEmptyAchievementEntry()]);
          setLastSavedTimestamp(null);
          setLoadErrorMessage(null);
        } else {
          setResumeBasics({
            ...createEmptyBasics(),
            ...(stored.basics ?? {})
          });
          setWorkHistoryEntries(
            hydrateList(stored.workHistory, createEmptyWorkEntry)
          );
          setProjectEntries(
            hydrateList(stored.projects, createEmptyProjectEntry)
          );
          setAchievementEntries(
            hydrateList(stored.achievements, createEmptyAchievementEntry)
          );
          setLastSavedTimestamp(stored.savedAt ?? null);
          setLoadErrorMessage(null);
        }
      } catch (error) {
        if (isCancelled) {
          return;
        }
        console.error('Failed to load resume from IndexedDB', error);
        setLoadErrorMessage('We could not restore your saved resume in this browser.');
      }
    };

    loadResumeFromStorage();

    return () => {
      isCancelled = true;
    };
  }, []);

  const handleBasicChange = (field: keyof typeof resumeBasics, value: string) => {
    setResumeBasics((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  const handleWorkEntryChange = (index: number, field: keyof WorkEntry, value: string) => {
    setWorkHistoryEntries((entries) => {
      const next = [...entries];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  const addWorkEntry = () => {
    setWorkHistoryEntries((entries) => [
      ...entries,
      { company: '', dateRange: '', description: '' }
    ]);
  };

  const removeWorkEntry = (index: number) => {
    setWorkHistoryEntries((entries) => {
      if (entries.length === 1) {
        return entries;
      }

      return entries.filter((_, idx) => idx !== index);
    });
  };

  const handleProjectEntryChange = (index: number, field: keyof ProjectEntry, value: string) => {
    setProjectEntries((entries) => {
      const next = [...entries];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  const addProjectEntry = () => {
    setProjectEntries((entries) => [
      ...entries,
      { title: '', link: '', description: '' }
    ]);
  };

  const removeProjectEntry = (index: number) => {
    setProjectEntries((entries) => {
      if (entries.length === 1) {
        return entries;
      }

      return entries.filter((_, idx) => idx !== index);
    });
  };

  const handleAchievementEntryChange = (index: number, field: keyof AchievementEntry, value: string) => {
    setAchievementEntries((entries) => {
      const next = [...entries];
      next[index] = {
        ...next[index],
        [field]: value
      };
      return next;
    });
  };

  const addAchievementEntry = () => {
    setAchievementEntries((entries) => [
      ...entries,
      { title: '', link: '', description: '' }
    ]);
  };

  const removeAchievementEntry = (index: number) => {
    setAchievementEntries((entries) => {
      if (entries.length === 1) {
        return entries;
      }

      return entries.filter((_, idx) => idx !== index);
    });
  };

  const handleSaveResume = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!isIndexedDbAvailable()) {
      setSaveStatus('error');
      setSaveErrorMessage('Saving is not supported in this browser.');
      return;
    }

    setIsSaving(true);
    setSaveStatus('saving');
    setSaveErrorMessage('');

    const timestamp = new Date().toISOString();

    try {
      const data = {
        basics: { ...resumeBasics },
        workHistory: workHistoryEntries.map((entry) => ({ ...entry })),
        projects: projectEntries.map((entry) => ({ ...entry })),
        achievements: achievementEntries.map((entry) => ({ ...entry })),
        savedAt: timestamp
      };

      // Keep legacy single-snapshot for printable view
      await writeStoredResume(data);
      // Create a new saved resume entry
      const created = await createSavedResume(data, resumeBasics.name);
      setSelectedResumeId(created.id);
      setSaveStatus('success');
      setLastSavedTimestamp(timestamp);
      // Refresh list
      const list = await listSavedResumes();
      setSavedResumes(list);
    } catch (error) {
      console.error('Failed to save resume to IndexedDB', error);
      setSaveStatus('error');
      setSaveErrorMessage('We could not save your resume locally. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateSelectedResume = async () => {
    if (!selectedResumeId) return;
    if (!isIndexedDbAvailable()) {
      setSaveStatus('error');
      setSaveErrorMessage('Saving is not supported in this browser.');
      return;
    }
    setIsUpdating(true);
    setSaveStatus('saving');
    setSaveErrorMessage('');
    const timestamp = new Date().toISOString();
    try {
      const data = {
        basics: { ...resumeBasics },
        workHistory: workHistoryEntries.map((entry) => ({ ...entry })),
        projects: projectEntries.map((entry) => ({ ...entry })),
        achievements: achievementEntries.map((entry) => ({ ...entry })),
        savedAt: timestamp
      };
      await writeStoredResume(data);
      await updateSavedResume(selectedResumeId, data, resumeBasics.name);
      setSaveStatus('success');
      setLastSavedTimestamp(timestamp);
      const list = await listSavedResumes();
      setSavedResumes(list);
    } catch (error) {
      console.error('Failed to update resume', error);
      setSaveStatus('error');
      setSaveErrorMessage('We could not update your saved resume. Please try again.');
    } finally {
      setIsUpdating(false);
    }
  };

  const handleLoadFromList = async (id: string) => {
    try {
      const entry = await readSavedResume(id);
      if (!entry) {
        return;
      }
      setSelectedResumeId(id);
      const stored = entry.data;
      setResumeBasics({
        ...createEmptyBasics(),
        ...(stored.basics ?? {})
      });
      setWorkHistoryEntries(hydrateList(stored.workHistory, createEmptyWorkEntry));
      setProjectEntries(hydrateList(stored.projects, createEmptyProjectEntry));
      setAchievementEntries(hydrateList(stored.achievements, createEmptyAchievementEntry));
      setLastSavedTimestamp(stored.savedAt ?? null);
      setLoadErrorMessage(null);
    } catch (error) {
      console.error('Failed to load the selected resume', error);
      setLoadErrorMessage('We could not load that saved resume.');
    }
  };

  const handleDeleteFromList = async (id: string) => {
    try {
      await deleteSavedResume(id);
      const list = await listSavedResumes();
      setSavedResumes(list);
      if (selectedResumeId === id) {
        setSelectedResumeId(null);
      }
    } catch (error) {
      console.error('Failed to delete resume', error);
      setListErrorMessage('We could not delete that resume.');
    }
  };

  const baseFieldClassName =
    'w-full rounded-lg border border-teal-200 bg-white/80 px-4 py-3 text-slate-800 shadow-sm transition focus:border-teal-400 focus:outline-none focus:ring-2 focus:ring-teal-300/70 dark:border-teal-700 dark:bg-slate-950/40 dark:text-slate-100 dark:placeholder:text-slate-500 dark:focus:border-teal-500 dark:focus:ring-teal-500/40';
  const tallTextAreaClassName = baseFieldClassName + ' min-h-[140px]';
  const compactTextAreaClassName = baseFieldClassName + ' min-h-[120px]';
  const addButtonClassName =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm transition hover:border-teal-300 hover:text-teal-600 dark:border-teal-800/60 dark:bg-slate-950/40 dark:text-teal-200 dark:hover:border-teal-700 dark:hover:text-teal-100';
  const removeButtonClassName =
    'self-end text-xs font-medium text-teal-700 underline-offset-2 hover:text-teal-600 hover:underline dark:text-teal-200 dark:hover:text-teal-100';

  const printViewLinkClassName =
    'inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm transition hover:border-teal-300 hover:text-teal-600 dark:border-teal-800/60 dark:bg-slate-950/40 dark:text-teal-200 dark:hover:border-teal-700 dark:hover:text-teal-100';


  const hasContent = (value: string) => value.trim().length > 0;
  const normalizedWorkEntries = workHistoryEntries.filter((entry) =>
    [entry.company, entry.dateRange, entry.description].some(hasContent)
  );
  const normalizedProjectEntries = projectEntries.filter((entry) =>
    [entry.title, entry.link, entry.description].some(hasContent)
  );
  const normalizedAchievementEntries = achievementEntries.filter((entry) =>
    [entry.title, entry.link, entry.description].some(hasContent)
  );
  const previewHasBasics = Object.values(resumeBasics).some(hasContent);
  const previewHasContent =
    previewHasBasics ||
    normalizedWorkEntries.length > 0 ||
    normalizedProjectEntries.length > 0 ||
    normalizedAchievementEntries.length > 0;

  const formatUrl = (url: string) => {
    if (!hasContent(url)) {
      return '';
    }

    return url.startsWith("http://") || url.startsWith("https://")
      ? url
      : `https://${url}`;
  };

  const savedTimestampLabel = lastSavedTimestamp
    ? formatSavedAt(lastSavedTimestamp)
    : null;

  let persistenceMessage: { tone: 'info' | 'success' | 'error'; text: string } | null = null;

  if (saveStatus === 'error') {
    persistenceMessage = {
      tone: 'error',
      text: saveErrorMessage || 'We could not save your resume locally. Please try again.'
    };
  } else if (saveStatus === 'success') {
    persistenceMessage = {
      tone: 'success',
      text: savedTimestampLabel
        ? `Saved to this browser - ${savedTimestampLabel}`
        : 'Saved to this browser.'
    };
  } else if (loadErrorMessage) {
    persistenceMessage = {
      tone: 'error',
      text: loadErrorMessage
    };
  } else if (savedTimestampLabel) {
    persistenceMessage = {
      tone: 'info',
      text: `Last saved on ${savedTimestampLabel}.`
    };
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-400 dark:from-teal-900 dark:to-teal-800 flex items-start justify-center">
      <button
        type="button"
        onClick={() => {
          if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
          } else {
            router.push('/');
          }
        }}
        aria-label="Go back"
        className="fixed left-4 top-4 z-50 inline-flex items-center gap-2 rounded-lg border border-teal-200/80 bg-white/80 px-3 py-2 text-sm font-semibold text-teal-700 shadow-sm backdrop-blur transition hover:border-teal-300 hover:text-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 dark:border-teal-800/60 dark:bg-slate-950/40 dark:text-teal-200 dark:hover:border-teal-700 dark:hover:text-teal-100"
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth={2}
          className="h-4 w-4"
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        <span className="hidden sm:inline">Back</span>
      </button>
      <div className="max-w-6xl px-6 md:px-8 pt-6 md:pt-8 pb-16 md:pb-24 mx-auto text-center">
        <section className="mt-12 text-left">
          <div className="rounded-2xl bg-white/90 dark:bg-slate-900/95 border border-teal-100/50 dark:border-teal-900/60 shadow-xl shadow-teal-900/10 px-6 py-8 md:px-8 md:py-10">
            <h2 className="text-3xl font-semibold text-teal-900 dark:text-teal-100">Create your resume</h2>
            <p className="mt-3 text-base text-slate-600 dark:text-slate-300">Fill out the essentials below to craft a tailored resume that pairs perfectly with our AI analysis.</p>
            <form className="mt-8 grid gap-8 text-left" onSubmit={handleSaveResume}>
              <div className="grid gap-2 md:grid-cols-2 md:gap-6">
                <div className="grid gap-2">
                  <label htmlFor="resume-name" className="text-sm font-medium text-teal-900 dark:text-teal-100">Name</label>
                  <input
                    id="resume-name"
                    name="name"
                    type="text"
                    placeholder="John Doe"
                    className={baseFieldClassName}
                    value={resumeBasics.name}
                    onChange={(event) => handleBasicChange('name', event.target.value)}
                  />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="resume-email" className="text-sm font-medium text-teal-900 dark:text-teal-100">Email</label>
                  <input
                    id="resume-email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    className={baseFieldClassName}
                    value={resumeBasics.email}
                    onChange={(event) => handleBasicChange('email', event.target.value)}
                  />
                </div>
                <div className="grid gap-2 md:col-span-2">
                  <label htmlFor="resume-github" className="text-sm font-medium text-teal-900 dark:text-teal-100">GitHub link</label>
                  <input
                    id="resume-github"
                    name="github"
                    type="url"
                    placeholder="https://github.com/username"
                    className={baseFieldClassName}
                    value={resumeBasics.github}
                    onChange={(event) => handleBasicChange('github', event.target.value)}
                  />
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="resume-work-company-0" className="text-sm font-medium text-teal-900 dark:text-teal-100">Work history</label>
                  <button
                    type="button"
                    className={addButtonClassName}
                    onClick={addWorkEntry}
                  >
                    Add another role
                  </button>
                </div>
                <div className="grid gap-4">
                  {workHistoryEntries.map((entry, index) => (
                    <div
                      key={'work-history-' + index}
                      className="grid gap-4 rounded-xl border border-teal-100/70 bg-white/70 p-4 shadow-sm dark:border-teal-900/50 dark:bg-slate-900/40"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        <div className="grid gap-2">
                          <label htmlFor={'resume-work-company-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Company name</label>
                          <input
                            id={'resume-work-company-' + index}
                            name={'workHistory[' + index + '].company'}
                            type="text"
                            placeholder="Acme Corp"
                            className={baseFieldClassName}
                            value={entry.company}
                            onChange={(event) => handleWorkEntryChange(index, 'company', event.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor={'resume-work-dates-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Date range</label>
                          <input
                            id={'resume-work-dates-' + index}
                            name={'workHistory[' + index + '].dateRange'}
                            type="text"
                            placeholder="Jan 2022 - Present"
                            className={baseFieldClassName}
                            value={entry.dateRange}
                            onChange={(event) => handleWorkEntryChange(index, 'dateRange', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor={'resume-work-description-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">What you did there</label>
                        <textarea
                          id={'resume-work-description-' + index}
                          name={'workHistory[' + index + '].description'}
                          placeholder="Summarize your impact, responsibilities, and measurable outcomes..."
                          className={tallTextAreaClassName}
                          value={entry.description}
                          onChange={(event) => handleWorkEntryChange(index, 'description', event.target.value)}
                        />
                      </div>
                      {workHistoryEntries.length > 1 ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className={removeButtonClassName}
                            onClick={() => removeWorkEntry(index)}
                          >
                            Remove role
                          </button>
                        </div>
                      ) : (
                    <span>Printable view uses your last saved resume data.</span>
                  )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="resume-project-title-0" className="text-sm font-medium text-teal-900 dark:text-teal-100">Projects</label>
                  <button
                    type="button"
                    className={addButtonClassName}
                    onClick={addProjectEntry}
                  >
                    Add another project
                  </button>
                </div>
                <div className="grid gap-4">
                  {projectEntries.map((entry, index) => (
                    <div
                      key={'project-' + index}
                      className="grid gap-4 rounded-xl border border-teal-100/70 bg-white/70 p-4 shadow-sm dark:border-teal-900/50 dark:bg-slate-900/40"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        <div className="grid gap-2">
                          <label htmlFor={'resume-project-title-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Project title</label>
                          <input
                            id={'resume-project-title-' + index}
                            name={'projects[' + index + '].title'}
                            type="text"
                            placeholder="Project Phoenix"
                            className={baseFieldClassName}
                            value={entry.title}
                            onChange={(event) => handleProjectEntryChange(index, 'title', event.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor={'resume-project-link-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Project link</label>
                          <input
                            id={'resume-project-link-' + index}
                            name={'projects[' + index + '].link'}
                            type="url"
                            placeholder="https://example.com"
                            className={baseFieldClassName}
                            value={entry.link}
                            onChange={(event) => handleProjectEntryChange(index, 'link', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor={'resume-project-description-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Project description</label>
                        <textarea
                          id={'resume-project-description-' + index}
                          name={'projects[' + index + '].description'}
                          placeholder="Outline your role, stack, and measurable results..."
                          className={tallTextAreaClassName}
                          value={entry.description}
                          onChange={(event) => handleProjectEntryChange(index, 'description', event.target.value)}
                        />
                      </div>
                      {projectEntries.length > 1 ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className={removeButtonClassName}
                            onClick={() => removeProjectEntry(index)}
                          >
                            Remove project
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid gap-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label htmlFor="resume-achievement-title-0" className="text-sm font-medium text-teal-900 dark:text-teal-100">Achievements</label>
                  <button
                    type="button"
                    className={addButtonClassName}
                    onClick={addAchievementEntry}
                  >
                    Add another achievement
                  </button>
                </div>
                <div className="grid gap-4">
                  {achievementEntries.map((entry, index) => (
                    <div
                      key={'achievement-' + index}
                      className="grid gap-4 rounded-xl border border-teal-100/70 bg-white/70 p-4 shadow-sm dark:border-teal-900/50 dark:bg-slate-900/40"
                    >
                      <div className="grid gap-3 sm:grid-cols-2 sm:gap-4">
                        <div className="grid gap-2">
                          <label htmlFor={'resume-achievement-title-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Award title</label>
                          <input
                            id={'resume-achievement-title-' + index}
                            name={'achievements[' + index + '].title'}
                            type="text"
                            placeholder="Best in Show"
                            className={baseFieldClassName}
                            value={entry.title}
                            onChange={(event) => handleAchievementEntryChange(index, 'title', event.target.value)}
                          />
                        </div>
                        <div className="grid gap-2">
                          <label htmlFor={'resume-achievement-link-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Award link</label>
                          <input
                            id={'resume-achievement-link-' + index}
                            name={'achievements[' + index + '].link'}
                            type="url"
                            placeholder="https://example.com/award"
                            className={baseFieldClassName}
                            value={entry.link}
                            onChange={(event) => handleAchievementEntryChange(index, 'link', event.target.value)}
                          />
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <label htmlFor={'resume-achievement-description-' + index} className="text-sm font-medium text-teal-900 dark:text-teal-100">Award description</label>
                        <textarea
                          id={'resume-achievement-description-' + index}
                          name={'achievements[' + index + '].description'}
                          placeholder="Share the context, judges, and measurable results..."
                          className={compactTextAreaClassName}
                          value={entry.description}
                          onChange={(event) => handleAchievementEntryChange(index, 'description', event.target.value)}
                        />
                      </div>
                      {achievementEntries.length > 1 ? (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            className={removeButtonClassName}
                            onClick={() => removeAchievementEntry(index)}
                          >
                            Remove achievement
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex flex-col items-start gap-3 sm:items-end">
                <button
                  type="submit"
                  className="inline-flex items-center justify-center rounded-lg bg-teal-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isSaving}
                >
                  {isSaving ? 'Saving...' : 'Save resume to this browser'}
                </button>
                <button
                  type="button"
                  onClick={handleUpdateSelectedResume}
                  className="inline-flex items-center justify-center rounded-lg bg-teal-700 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-teal-900/20 transition hover:bg-teal-600 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-600 disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isUpdating || !selectedResumeId || selectedResumeId === SAMPLE_RESUME_ID}
                >
                  {isUpdating ? 'Updating...' : 'Update selected resume'}
                </button>
                <Link
                  href="/create-resume/print"
                  target="_blank"
                  rel="noreferrer"
                  className={printViewLinkClassName}
                >
                  Open printable resume
                </Link>
                <div className="min-h-[1.25rem] text-sm text-slate-600 dark:text-slate-300 sm:text-right">
                  {persistenceMessage ? (
                    <span
                      className={
                        persistenceMessage.tone === 'success'
                          ? 'text-teal-700 dark:text-teal-200'
                          : persistenceMessage.tone === 'error'
                          ? 'text-rose-600 dark:text-rose-300'
                          : 'text-slate-600 dark:text-slate-300'
                      }
                    >
                      {persistenceMessage.text}
                    </span>
                  ) : (
                    <span>Printable view uses your last saved resume data.</span>
                  )}
                </div>
              </div>
            {/* Saved resumes list */}
            <div className="mt-10">
              <h3 className="text-2xl font-semibold text-teal-900 dark:text-teal-100">Saved resumes</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Select a saved resume to load it into the editor. You can update the selected resume with the button above.</p>
              <div className="mt-4">
                <button
                  type="button"
                  className={printViewLinkClassName}
                >
                  connect filecoin
                </button>
              </div>
              {listErrorMessage ? (
                <div className="mt-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">{listErrorMessage}</div>
              ) : null}
              <div className="mt-4 grid gap-3">
                {isListLoading ? (
                  <div className="text-sm text-slate-500">Loading saved resumes…</div>
                ) : savedResumes.length === 0 ? (
                  <div className="text-sm text-slate-500">No saved resumes yet. Press "Save resume to this browser" to create one.</div>
                ) : (
                  <ul className="divide-y divide-teal-100/60 dark:divide-teal-900/50 rounded-xl border border-teal-100/60 dark:border-teal-900/50 bg-white/80 dark:bg-slate-950/30">
                    {savedResumes.map((item) => (
                      <li key={item.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="selectedResume"
                            className="mt-1 h-4 w-4 text-teal-600 focus:ring-teal-500"
                            checked={selectedResumeId === item.id}
                            onChange={() => setSelectedResumeId(item.id)}
                          />
                          <div>
                            <div className="font-medium text-teal-900 dark:text-teal-100">
                              {item.title || 'Untitled resume'}
                              {isSampleResumeId(item.id) ? (
                                <span className="ml-2 inline-flex items-center rounded-full border border-teal-300/70 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-teal-700 dark:border-teal-800 dark:text-teal-200">Sample</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-slate-500">Updated {formatSavedAt(item.updatedAt) || item.updatedAt}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            className={printViewLinkClassName}
                            onClick={() => handleLoadFromList(item.id)}
                          >
                            Load into editor
                          </button>
                          {isSampleResumeId(item.id) ? null : (
                            <button
                              type="button"
                              className="inline-flex items-center justify-center gap-2 rounded-lg border border-rose-200/80 bg-white/80 px-4 py-2 text-sm font-semibold text-rose-700 shadow-sm transition hover:border-rose-300 hover:text-rose-600 dark:border-rose-900/60 dark:bg-slate-950/40 dark:text-rose-300"
                              onClick={() => handleDeleteFromList(item.id)}
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            </form>
            <div className="mt-12 border-t border-teal-100/60 dark:border-teal-900/50 pt-10">
              <h3 className="text-2xl font-semibold text-teal-900 dark:text-teal-100">Resume preview</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">See how your resume is shaping up as you make edits.</p>
              <div className="mt-8 rounded-xl border border-teal-100/60 dark:border-teal-900/60 bg-white/80 dark:bg-slate-950/30 p-6 shadow-sm">
                {previewHasContent ? (
                  <div className="space-y-8 text-left text-slate-800 dark:text-slate-100">
                    <header className="space-y-2">
                      <h4 className="text-xl font-semibold text-teal-900 dark:text-teal-100">
                        {resumeBasics.name || 'Add your name to personalize this preview'}
                      </h4>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-600 dark:text-slate-300">
                        {hasContent(resumeBasics.email) ? (
                          <span>{resumeBasics.email}</span>
                        ) : (
                          <span className="opacity-60">email@example.com</span>
                        )}
                        {hasContent(resumeBasics.github) ? (
                          <a
                            className="text-teal-700 hover:underline dark:text-teal-200"
                            href={formatUrl(resumeBasics.github)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            {resumeBasics.github}
                          </a>
                        ) : (
                          <span className="opacity-60">github.com/username</span>
                        )}
                      </div>
                    </header>

                    <section className="space-y-3">
                      <h5 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Work Experience</h5>
                      {normalizedWorkEntries.length > 0 ? (
                        <div className="space-y-4">
                          {normalizedWorkEntries.map((entry, index) => (
                            <div key={'work-preview-' + index} className="space-y-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-semibold">
                                  {entry.company || 'Company name'}
                                </span>
                                {hasContent(entry.dateRange) ? (
                                  <span className="text-sm text-slate-500 dark:text-slate-400">
                                    {entry.dateRange}
                                  </span>
                                ) : null}
                              </div>
                              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {entry.description || 'Summarize your impact, responsibilities, and measurable results...'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add roles to showcase your experience.</p>
                      )}
                    </section>

                    <section className="space-y-3">
                      <h5 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Projects</h5>
                      {normalizedProjectEntries.length > 0 ? (
                        <div className="space-y-4">
                          {normalizedProjectEntries.map((entry, index) => (
                            <div key={'project-preview-' + index} className="space-y-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-semibold">
                                  {entry.title || 'Project title'}
                                </span>
                                {hasContent(entry.link) ? (
                                  <a
                                    className="text-sm text-teal-700 hover:underline dark:text-teal-200"
                                    href={formatUrl(entry.link)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {entry.link}
                                  </a>
                                ) : null}
                              </div>
                              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {entry.description || 'Outline your role, stack, and measurable results...'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Highlight key projects to display your skills.</p>
                      )}
                    </section>

                    <section className="space-y-3">
                      <h5 className="text-sm font-semibold uppercase tracking-wide text-teal-700 dark:text-teal-300">Achievements</h5>
                      {normalizedAchievementEntries.length > 0 ? (
                        <div className="space-y-4">
                          {normalizedAchievementEntries.map((entry, index) => (
                            <div key={'achievement-preview-' + index} className="space-y-1">
                              <div className="flex flex-wrap items-baseline gap-2">
                                <span className="font-semibold">
                                  {entry.title || 'Award title'}
                                </span>
                                {hasContent(entry.link) ? (
                                  <a
                                    className="text-sm text-teal-700 hover:underline dark:text-teal-200"
                                    href={formatUrl(entry.link)}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    {entry.link}
                                  </a>
                                ) : null}
                              </div>
                              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                                {entry.description || 'Describe the recognition and why it matters.'}
                              </p>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-slate-500 dark:text-slate-400">Add awards or certifications to round out your achievements.</p>
                      )}
                    </section>
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-teal-200/70 bg-white/60 p-6 text-sm text-slate-500 dark:border-teal-900/60 dark:bg-slate-950/20 dark:text-slate-400">
                    Start filling in the resume fields to see a live preview appear here.
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
