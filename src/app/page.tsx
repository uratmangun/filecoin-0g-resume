'use client';

import Link from 'next/link';
import { useEffect } from 'react';
import { sdk } from '@farcaster/miniapp-sdk';

const featureCards = [
  {
    title: 'AI-backed analysis',
    description:
      'Upload your job description and get instant feedback on how your experience aligns with roles across industries.'
  },
  {
    title: 'Tailored resume builder',
    description:
      'Capture your background in a structured, recruiter-friendly format that stays consistent across roles.'
  },
  {
    title: 'Actionable recommendations',
    description:
      'See what to highlight or expand so each application stands out in any industry.'
  },
  {
    title: 'Decentralized storage & AI compute',
    description:
      'We save your resume data to Filecoin decentralized storage and use 0g decentralized AI for compute.'
  }
];

export default function Home() {
  useEffect(() => {
    const initializeSdk = async () => {
      await sdk.actions.ready();
    };

    initializeSdk();
  }, []);

  return (
    <main className={'min-h-screen bg-gradient-to-br from-teal-500 to-teal-400 dark:from-teal-900 dark:to-teal-800'}>
      <div className={'mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16 text-center text-white'}>
        <header className={'space-y-6'}>
          <span className={'mx-auto inline-flex items-center justify-center rounded-full border border-white/40 bg-white/10 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/80 backdrop-blur'}>CAREER COACHES
          </span>
          <h1 className={'text-4xl font-extrabold leading-tight sm:text-5xl md:text-6xl'}>Craft a future-proof resume and get guidance in minutes
          </h1>
          <p className={'mx-auto max-w-2xl text-base text-white/90 sm:text-lg'}>Start with a polished resume, then let our AI highlight the skills, metrics, and proof points that matter for the roles you’re targeting.
          </p>
        </header>

        <div className={'mt-10 flex flex-wrap justify-center gap-4'}>
          <Link
            href="/create-resume"
            className={'inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-teal-700 shadow-lg shadow-teal-900/20 transition hover:bg-teal-50 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'}
          >
            Create your resume
          </Link>
          <Link
            href="/create-resume#how-it-works"
            className={'inline-flex items-center justify-center rounded-lg border border-white/60 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white'}
          >
            See how it works
          </Link>
        </div>

        <div className={'mt-16 grid gap-6 text-left text-white/90 md:grid-cols-3'}>
          {featureCards.map((feature) => (
            <div
              key={feature.title}
              className={'rounded-2xl border border-white/30 bg-white/10 p-6 shadow-lg shadow-teal-900/20 backdrop-blur'}
            >
              <h2 className={'text-lg font-semibold text-white'}>{feature.title}</h2>
              <p className={'mt-3 text-sm leading-relaxed text-white/80'}>{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
