import { runPipelineSteps } from '@/lib/pipeline/steps';
import { PIPELINE_CONFIG } from '@/lib/pipeline/prompts';

const improvePrompt = ({ basePrompt, previous }) => {
  const weaknesses = [];
  if (previous?.diagnostics?.flags?.weakDifferentiation) weaknesses.push('stronger market differentiation');
  if (previous?.diagnostics?.flags?.thinGameplay) weaknesses.push('deeper gameplay loops');
  if ((previous?.diagnostics?.missingModules || []).length > 0) weaknesses.push('strict modular architecture compliance');

  const focus = weaknesses.length ? weaknesses.join(', ') : 'higher retention and systemic progression';
  const previousIdea = previous?.improvedIdea ? `\nPrevious improved idea:\n${previous.improvedIdea}` : '';
  return `${basePrompt}${previousIdea}\n\nRefine with focus on: ${focus}.`;
};

export async function runWithLoop(initialContext) {
  const { maxAttempts, scoreThreshold } = PIPELINE_CONFIG;
  let attempt = 0;
  let bestResult = null;
  let prompt = initialContext.prompt;

  while (attempt < maxAttempts) {
    attempt += 1;
    const result = await runPipelineSteps({ attempt, prompt, basePrompt: prompt });
    result.notes.push(`Attempt ${attempt}/${maxAttempts} scored ${result.score}.`);

    if (!bestResult || result.score > bestResult.score) bestResult = result;
    if (result.score >= scoreThreshold) {
      return { ...result, attempts: attempt, exitedEarly: true };
    }

    prompt = improvePrompt({ basePrompt: prompt, previous: result });
  }

  return { ...bestResult, attempts: maxAttempts, exitedEarly: false };
}
