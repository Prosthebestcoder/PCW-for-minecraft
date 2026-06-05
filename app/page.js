'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [questions, setQuestions] = useState([]);

  const onSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setQuestions([]);
    if (!prompt.trim()) return setError('Please provide a detailed plugin vision.');
    setLoading(true);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      });
      const payload = await response.json();
      if (!response.ok) {
        if (response.status === 422 && payload?.questions?.length) {
          setError(payload.message || 'More detail is required before generation.');
          setQuestions(payload.questions);
          return;
        }
        throw new Error(payload?.error || 'Generation failed');
      }
      if (!response.ok) throw new Error(payload?.error || 'Generation failed');
      sessionStorage.setItem('forge:lastResult', JSON.stringify(payload));
      router.push('/result');
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-20">
      <div className="absolute inset-0 -z-10 bg-[radial-gradient(circle_at_top,_#312e81_0%,_#020617_40%)]" />
      <section className="w-full rounded-3xl border border-slate-700/80 bg-slate-900/80 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 flex items-start justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-indigo-300">AI SaaS Forge</p>
            <h1 className="mt-2 text-4xl font-bold tracking-tight">AI Minecraft Plugin Forge</h1>
            <p className="mt-3 max-w-2xl text-slate-300">
              Generate enterprise-grade, modular Minecraft plugin specs and code through a multi-AI validation pipeline.
            </p>
          </div>
          <span className="rounded-full border border-emerald-400/40 bg-emerald-400/10 px-3 py-1 text-xs text-emerald-300">Pipeline v2</span>
        </div>

        <form className="space-y-4" onSubmit={onSubmit}>
          <textarea
            id="prompt"
            className="h-44 w-full rounded-2xl border border-slate-700 bg-slate-950/90 p-4 text-slate-100 outline-none ring-indigo-500/70 focus:ring-2"
            placeholder="Describe your plugin vision: player journey, economy hooks, core loops, and strategic differentiators..."
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
          />
          {error ? <p className="text-sm text-rose-300">{error}</p> : null}
          {questions.length ? (
            <ul className="space-y-2 rounded-xl border border-amber-300/30 bg-amber-300/10 p-3 text-sm text-amber-100">
              {questions.map((question) => (
                <li key={question}>• {question}</li>
              ))}
            </ul>
          ) : null}
          <button
            type="submit"
            disabled={loading}
            className="inline-flex items-center rounded-xl bg-indigo-500 px-5 py-2.5 font-semibold text-white transition hover:bg-indigo-400 disabled:cursor-not-allowed disabled:bg-slate-600"
          >
            {loading ? 'Forging architecture…' : 'Generate Plugin Blueprint'}
          </button>
        </form>
      </section>
    </main>
  );
}
