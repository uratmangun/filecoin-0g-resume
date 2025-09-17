'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { sdk } from '@farcaster/miniapp-sdk';

import {
  createEmptyBasics,
  isIndexedDbAvailable,
  readStoredResume,
  type AchievementEntry,
  type ProjectEntry,
  type ResumeBasics,
  type ResumeData,
  type WorkEntry
} from '@/lib/resume-storage';

const hasContent = (value: string) => value.trim().length > 0;

const formatUrl = (url: string) => {
  if (!hasContent(url)) {
    return '';
  }

  return url.startsWith('http://') || url.startsWith('https://') ? url : 'https://' + url;
};

const formatSavedAt = (isoTimestamp: string | undefined) => {
  if (!isoTimestamp) {
    return null;
  }

  const parsed = new Date(isoTimestamp);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return new Intl.DateTimeFormat(undefined, {
    dateStyle: 'medium',
    timeStyle: 'short'
  }).format(parsed);
};

export default function PrintResumePage() {
  const [resumeData, setResumeData] = useState<ResumeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const initializeSdk = async () => {
      await sdk.actions.ready();
    };

    initializeSdk();
  }, []);

  useEffect(() => {
    let isCancelled = false;

    const loadData = async () => {
      if (!isIndexedDbAvailable()) {
        setLoadError('Printing is not available in this browser because IndexedDB is disabled.');
        setIsLoading(false);
        return;
      }

      try {
        const stored = await readStoredResume();
        if (isCancelled) {
          return;
        }

        setResumeData(stored);
        setLoadError(null);
      } catch (error) {
        console.error('Failed to load resume from IndexedDB', error);
        if (!isCancelled) {
          setLoadError('We could not retrieve your saved resume. Go back and save it again before printing.');
        }
      } finally {
        if (!isCancelled) {
          setIsLoading(false);
        }
      }
    };

    loadData();

    return () => {
      isCancelled = true;
    };
  }, []);

  const basics: ResumeBasics = resumeData?.basics ?? createEmptyBasics();

  const workHistory = useMemo<WorkEntry[]>(() => {
    if (!resumeData?.workHistory) {
      return [];
    }

    return resumeData.workHistory.filter((entry) =>
      [entry.company, entry.dateRange, entry.description].some(hasContent)
    );
  }, [resumeData]);

  const projects = useMemo<ProjectEntry[]>(() => {
    if (!resumeData?.projects) {
      return [];
    }

    return resumeData.projects.filter((entry) =>
      [entry.title, entry.description, entry.link].some(hasContent)
    );
  }, [resumeData]);

  const achievements = useMemo<AchievementEntry[]>(() => {
    if (!resumeData?.achievements) {
      return [];
    }

    return resumeData.achievements.filter((entry) =>
      [entry.title, entry.description, entry.link].some(hasContent)
    );
  }, [resumeData]);

  const hasBasics = [basics.name, basics.email, basics.github].some(hasContent);
  const hasAnyContent =
    hasBasics || workHistory.length > 0 || projects.length > 0 || achievements.length > 0;

  const lastSavedLabel = formatSavedAt(resumeData?.savedAt);

  const handlePrint = () => {
    if (hasAnyContent) {
      window.print();
    }
  };

  return (
    <main className="min-h-screen bg-slate-100 py-10 text-slate-900 print:bg-white print:py-0">
      <div className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 print:max-w-none print:px-0">
        <header className="flex flex-col gap-4 text-slate-600 print:hidden">
          <div>
            <h1 className="text-3xl font-semibold text-teal-900">Printable resume</h1>
            <p className="mt-2 text-sm">
              This page prepares your latest saved resume so you can use your browser's print dialog to export a PDF.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handlePrint}
              disabled={isLoading || !hasAnyContent}
              className="inline-flex items-center justify-center gap-2 rounded-lg bg-teal-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-teal-500 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Print or save as PDF
            </button>
            <Link
              href="/create-resume"
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-teal-200/80 bg-white px-4 py-2 text-sm font-semibold text-teal-700 shadow-sm transition hover:border-teal-300 hover:text-teal-600"
            >
              Back to builder
            </Link>
          </div>
          <div className="text-xs text-slate-500">
            {lastSavedLabel
              ? 'Last saved ' + lastSavedLabel + '.'
              : 'No saved snapshot found yet. Click "Save resume to this browser" before printing.'}
          </div>
          {loadError ? (
            <div className="rounded-lg border border-rose-200 bg-rose-50 px-4 py-2 text-sm text-rose-700">
              {loadError}
            </div>
          ) : null}
        </header>
        <section className="resume-sheet mx-auto w-full max-w-3xl rounded-2xl bg-white p-10 shadow-xl shadow-teal-900/10 print:m-0 print:max-w-none print:rounded-none print:p-10 print:shadow-none">
          {isLoading ? (
            <div className="flex min-h-[420px] items-center justify-center text-slate-500">
              Loading your saved resume…
            </div>
          ) : hasAnyContent ? (
            <div className="space-y-8 text-slate-800">
              {hasBasics ? (
                <header className="space-y-1">
                  {hasContent(basics.name) ? (
                    <h2 className="text-2xl font-semibold text-slate-900">{basics.name}</h2>
                  ) : null}
                  <div className="flex flex-wrap gap-3 text-sm text-slate-600">
                    {hasContent(basics.email) ? <span>{basics.email}</span> : null}
                    {hasContent(basics.github) ? (
                      <a
                        href={formatUrl(basics.github)}
                        target="_blank"
                        rel="noreferrer"
                        className="text-teal-700"
                      >
                        {basics.github}
                      </a>
                    ) : null}
                  </div>
                </header>
              ) : null}

              {workHistory.length > 0 ? (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                    Work Experience
                  </h3>
                  <div className="space-y-4">
                    {workHistory.map((entry, index) => (
                      <div key={'print-work-' + index} className="space-y-1">
                        <div className="flex flex-wrap items-baseline justify-between gap-2">
                          {hasContent(entry.company) ? (
                            <span className="font-semibold text-slate-900">{entry.company}</span>
                          ) : null}
                          {hasContent(entry.dateRange) ? (
                            <span className="text-sm text-slate-500">{entry.dateRange}</span>
                          ) : null}
                        </div>
                        {hasContent(entry.description) ? (
                          <p className="text-sm leading-relaxed text-slate-600">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {projects.length > 0 ? (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                    Projects
                  </h3>
                  <div className="space-y-4">
                    {projects.map((entry, index) => (
                      <div key={'print-project-' + index} className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {hasContent(entry.title) ? (
                            <span className="font-semibold text-slate-900">{entry.title}</span>
                          ) : null}
                          {hasContent(entry.link) ? (
                            <a
                              href={formatUrl(entry.link)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-teal-700"
                            >
                              {entry.link}
                            </a>
                          ) : null}
                        </div>
                        {hasContent(entry.description) ? (
                          <p className="text-sm leading-relaxed text-slate-600">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}

              {achievements.length > 0 ? (
                <section className="space-y-4">
                  <h3 className="text-sm font-semibold uppercase tracking-wide text-teal-700">
                    Achievements
                  </h3>
                  <div className="space-y-4">
                    {achievements.map((entry, index) => (
                      <div key={'print-achievement-' + index} className="space-y-1">
                        <div className="flex flex-wrap items-baseline gap-2">
                          {hasContent(entry.title) ? (
                            <span className="font-semibold text-slate-900">{entry.title}</span>
                          ) : null}
                          {hasContent(entry.link) ? (
                            <a
                              href={formatUrl(entry.link)}
                              target="_blank"
                              rel="noreferrer"
                              className="text-sm text-teal-700"
                            >
                              {entry.link}
                            </a>
                          ) : null}
                        </div>
                        {hasContent(entry.description) ? (
                          <p className="text-sm leading-relaxed text-slate-600">
                            {entry.description}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                </section>
              ) : null}
            </div>
          ) : (
            <div className="flex min-h-[420px] flex-col items-center justify-center gap-3 text-center text-slate-500">
              <p>No saved resume content found.</p>
              <p className="text-sm">
                Return to the builder, add your experience, and press "Save resume to this browser" before visiting this page.
              </p>
            </div>
          )}
        </section>
      </div>
      <style jsx global>{`
        @page {
          margin: 1in;
        }
        @media print {
          body {
            background: #ffffff !important;
          }
        }
      `}</style>
    </main>
  );
}
