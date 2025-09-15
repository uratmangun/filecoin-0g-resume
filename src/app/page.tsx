'use client';

import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk'

export default function Home() {
  useEffect(() => {
    const initializeSdk = async () => {
      await sdk.actions.ready();
    };
    initializeSdk();
  }, []);

  const steps = [
    {
      title: 'Upload or write resume',
      description: 'Start with your existing resume or draft a new one in the app. Mock data: John Doe, 5+ yrs experience.',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-teal-700"
          aria-hidden
        >
          <path d="M7 3h6l5 5v13a1 1 0 0 1-1 1H7a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M13 3v5h5" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M8.5 13H15.5M8.5 16H15.5M8.5 19H12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'Paste job description',
      description: 'Provide a target role JD for comparison. Mock: Frontend Engineer, React + TypeScript.',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-teal-700"
          aria-hidden
        >
          <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
          <path d="M7 8H17M7 12h10M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      )
    },
    {
      title: 'AI analyze + advice',
      description: 'We compare your resume to the JD and suggest improvements to boost hiring probability. Mock: add metrics, tailor keywords.',
      icon: (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="h-10 w-10 text-teal-700"
          aria-hidden
        >
          <path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.5 5.5l2.1 2.1M16.4 16.4l2.1 2.1M18.5 5.5l-2.1 2.1M7.6 16.4l-2.1 2.1" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-teal-500 to-teal-400 dark:from-teal-900 dark:to-teal-800 flex items-start justify-center">
      <div className="max-w-6xl px-6 md:px-8 pt-6 md:pt-8 pb-16 md:pb-24 mx-auto text-center">
        <header>
          <h1 className="text-white text-5xl sm:text-6xl md:text-7xl font-extrabold tracking-tight leading-[1.1]">
            Filecoin and 0g resume generator and ai analyzer
          </h1>
          <p className="mt-8 text-white/90 text-lg md:text-2xl">
            make a resume and analyze it against a job description the ai will give you an advice and what you need to add so that your hiring probability getting higher
          </p>
        </header>

        <section className="mt-12">
          <h2 className="text-white text-2xl md:text-3xl font-semibold">How this work?</h2>
          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
            {steps.map((s) => (
              <div
                key={s.title}
                className="group rounded-xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-teal-100/60 dark:border-teal-800/40 shadow-md p-6 text-left"
              >
                <div className="mb-4 inline-flex items-center justify-center rounded-lg bg-teal-50 dark:bg-teal-900/40 p-3">
                  {s.icon}
                </div>
                <h3 className="text-slate-800 dark:text-slate-100 text-lg font-semibold">
                  {s.title}
                </h3>
                <p className="mt-2 text-slate-600 dark:text-slate-300 text-sm">
                  {s.description}
                </p>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
