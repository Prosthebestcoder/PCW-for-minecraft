import { qwen } from '@/ai/qwen';
import { deepseek } from '@/ai/deepseek';
import { llama } from '@/ai/llama';
import { gemini } from '@/ai/gemini';
import { CLARIFICATION_QUESTIONS, PIPELINE_CONFIG, PLACEHOLDER_PATTERNS } from '@/prompts';

const MODEL_ROUTER = {
  ideaImprover: qwen,
  specification: qwen,
  generation: deepseek,
  debugging: llama,
  review: gemini,
};

const routeToModel = async (role, payload) => {
  const runner = MODEL_ROUTER[role];
  if (!runner) throw new Error(`Unsupported AI role: ${role}`);
  return runner(payload);
};

const isTemplateIdea = (prompt) => PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(prompt));

export async function runOrchestrator({ prompt }) {
  if (isTemplateIdea(prompt)) {
    return {
      status: 'needs_clarification',
      message: 'Plugin idea is missing. Please provide your concrete idea before generation.',
      questions: CLARIFICATION_QUESTIONS,
    };
  }

  let attempt = 0;
  let best = null;
  let feedback = '';

  const autoImprovedIdea = await routeToModel('ideaImprover', {
    prompt,
    task: 'idea_improver',
  });
  let seedPrompt = autoImprovedIdea?.output || prompt;

  while (attempt < PIPELINE_CONFIG.maxAttempts) {
    attempt += 1;

    const spec = await routeToModel('specification', { prompt: seedPrompt, previousFeedback: feedback });
    const code = await routeToModel('generation', { spec: spec.output });
    const debugged = await routeToModel('debugging', { generatedCode: code.output });
    const reviewed = await routeToModel('review', {
      improvedIdea: spec.output,
      review: debugged.review,
      code: debugged.output,
    });

    const result = {
      status: 'ok',
      idea: prompt,
      improvedIdea: spec.output,
      autoImprovedIdea: seedPrompt,
      code: debugged.output,
      score: reviewed.score,
      verdict: reviewed.verdict,
      feedback: reviewed.feedback,
      improvements: reviewed.improvements,
      scoreBreakdown: reviewed.scoreBreakdown,
      notes: [...(reviewed.notes || []), `Attempt ${attempt}/${PIPELINE_CONFIG.maxAttempts}`],
      attempts: attempt,
      threshold: PIPELINE_CONFIG.scoreThreshold,
      exitedEarly: reviewed.score >= PIPELINE_CONFIG.scoreThreshold,
    };

    if (!best || result.score > best.score) best = result;
    if (result.score >= PIPELINE_CONFIG.scoreThreshold) return result;

    feedback = `Score ${result.score} below threshold ${PIPELINE_CONFIG.scoreThreshold}. Feedback: ${reviewed.feedback || ''}. Improvements: ${(reviewed.improvements || []).join(' ')}`;

    const improvedSpecSeed = await routeToModel('specification', {
      prompt: seedPrompt,
      previousFeedback: feedback,
      task: 'spec_improver',
    });
    seedPrompt = improvedSpecSeed?.output || seedPrompt;
  }

  return best;
}

export async function buildDashboardSummary({ idea, spec, code, score }) {
  const summary = await routeToModel('specification', {
    prompt: { idea, spec, code, score },
    task: 'dashboard_summary',
  });

  return summary.output;
}

export async function buildKnowledgeSpec({ knowledge, idea }) {
  const response = await routeToModel('specification', {
    prompt: { knowledge, idea },
    task: 'knowledge_spec',
  });

  return response.output;
}

export async function buildProjectPackage({ code, spec }) {
  const response = await routeToModel('specification', {
    prompt: { code, spec },
    task: 'project_packager',
  });

  return response.output;
}

export async function validateProjectPackage({ files }) {
  const response = await routeToModel('specification', {
    prompt: { files },
    task: 'project_validator',
  });

  return response.output;
}

export async function buildMavenProjectPackage({ code, spec }) {
  const response = await routeToModel('specification', {
    prompt: { code, spec },
    task: 'maven_project_packager',
  });

  return response.output;
}

export async function fixMavenBuild({ error, files }) {
  const response = await routeToModel('specification', {
    prompt: { error, files },
    task: 'maven_build_fixer',
  });

  return response.output;
}
