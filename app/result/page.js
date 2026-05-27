'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

const Card = ({ title, children }) => (
  <section className="rounded-2xl border border-slate-700 bg-slate-900/70 p-5 shadow-lg">
    <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-300">{title}</h2>
    {children}
  </section>
);

export default function ResultPage() {
  const [result, setResult] = useState(null);

  useEffect(() => {
    const value = sessionStorage.getItem('forge:lastResult');
    if (!value) return;

    try {
      const parsed = JSON.parse(value);
      setResult(parsed);
    } catch {
      sessionStorage.removeItem('forge:lastResult');
    }
  }, []);

  if (!result) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-4xl flex-col justify-center px-6 py-20">
        <p className="text-slate-300">No generation result found.</p>
        <Link href="/" className="mt-4 inline-block text-indigo-300 hover:text-indigo-200">Return to Forge</Link>
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl px-6 py-12">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">Forge Output</p>
          <h1 className="text-3xl font-bold">Pipeline Result</h1>
        </div>
        <Link href="/" className="text-indigo-300 hover:text-indigo-200">New Generation</Link>
      </div>

      <div className="mb-5 grid gap-5 lg:grid-cols-3">
        <Card title="Final Score"><p className="text-4xl font-bold text-emerald-300">{result.score}</p></Card>
        <Card title="Attempts"><p className="text-4xl font-bold text-indigo-300">{result.attempts}</p></Card>
        <Card title="Threshold Status">
          <p className={`text-lg font-semibold ${result.exitedEarly ? 'text-emerald-300' : 'text-amber-300'}`}>
            {result.exitedEarly ? 'Passed threshold' : 'Best effort returned'}
          </p>
        </Card>
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <Card title="Original Idea"><p className="whitespace-pre-wrap text-slate-200">{result.idea}</p></Card>
        <Card title="Auto Improved Idea Seed"><p className="whitespace-pre-wrap text-slate-200">{result.autoImprovedIdea || result.idea}</p></Card>
        <Card title="Improved Idea"><p className="whitespace-pre-wrap text-slate-200">{result.improvedIdea}</p></Card>
        <Card title="Score Breakdown">
          <ul className="space-y-1 text-slate-300">
            {Object.entries(result.scoreBreakdown || {}).map(([key, value]) => (
              <li key={key} className="flex justify-between"><span>{key}</span><span>{value}</span></li>
            ))}
          </ul>
        </Card>
        <Card title="Pipeline Notes">
          <ul className="space-y-2 text-slate-300">
            {result.notes?.map((note, index) => (
              <li key={`${note}-${index}`} className="rounded border border-slate-700 p-2">{note}</li>
            ))}
          </ul>
        </Card>
      </div>

      <Card title="Generated Modular Plugin Code">
        <pre className="max-h-[60vh] overflow-auto rounded-lg bg-slate-950 p-4 text-xs text-slate-100">{result.code}</pre>
      </Card>
    </main>
  );
}
