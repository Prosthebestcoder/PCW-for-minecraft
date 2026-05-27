import { REVIEW_OUTPUT_SCHEMA } from '@/prompts';

export async function gemini({ improvedIdea, review, code }) {
  const apiKey = process.env.GEMINI_API_KEY;
  const codeText = String(code || '').toLowerCase();
  const missing = review?.missing || [];

  const codeQuality = Math.max(0, 10 - missing.length * 2);
  const performance = codeText.includes('async') || codeText.includes('scheduler') ? 8 : 6;
  const usefulness = improvedIdea?.toLowerCase().includes('progression') ? 8 : 6;
  const engagement = improvedIdea?.toLowerCase().includes('retention') ? 8 : 6;
  const uniqueness = improvedIdea?.toLowerCase().includes('season') || improvedIdea?.toLowerCase().includes('economy') ? 8 : 6;

  const score = Math.max(0, Math.min(50, codeQuality + performance + usefulness + engagement + uniqueness));
  const verdict = score >= 35 ? 'ACCEPT' : 'IMPROVE';

  const feedback = verdict === 'ACCEPT'
    ? 'Installable for production with current structure; continue iterative balancing and profiling under live concurrency.'
    : 'Not ready for real servers yet. Core retention depth and/or architecture quality is below production expectation.';

  const improvements = [
    ...(missing.length ? [`Add missing required modules: ${missing.join(', ')}.`] : []),
    'Expand gameplay loop with progression milestones, social competition, and seasonal objectives.',
    'Profile hot paths and move expensive operations off the main thread where API-safe.',
    'Strengthen command/listener/manager boundaries and add validation for config-driven rules.',
  ];

  return {
    provider: 'gemini',
    usedApiKey: Boolean(apiKey),
    output: improvedIdea,
    score,
    verdict,
    feedback,
    improvements,
    notes: review?.optimizations || [],
    schema: REVIEW_OUTPUT_SCHEMA,
    scoreBreakdown: {
      codeQuality,
      performance,
      usefulness,
      engagement,
      uniqueness,
    },
  };
}
