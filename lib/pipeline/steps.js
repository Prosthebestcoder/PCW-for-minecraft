import { gemini } from '@/lib/ai/gemini';
import { deepseek } from '@/lib/ai/deepseek';
import { llama } from '@/lib/ai/llama';
import { PIPELINE_CONFIG, PIPELINE_GUARDS, ROLE_PROMPTS } from '@/lib/pipeline/prompts';

const compact = (value) => (typeof value === 'string' ? value : JSON.stringify(value));
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

const buildSpec = ({ prompt, concept, attempt }) => ({
  pluginName: 'MythicEconomyForge',
  featureSummary: concept,
  developerSpec: [
    `Request: ${prompt}`,
    `Attempt: ${attempt}`,
    'Architecture requirements: multi-file, command layer, listener layer, manager layer, config.yml.',
    `Constraints: ${PIPELINE_GUARDS.disallowBeginnerIdeas}`,
  ].join('\n'),
});

const computeScore = ({ review, conceptText }) => {
  const weights = PIPELINE_CONFIG.dimensions;
  const architecturePenalty = review.missing.length * 8;
  const realismPenalty = review.risks.length * 3;
  const complexityBonus = conceptText.length > 240 ? 6 : 2;

  const innovation = clamp(weights.innovation - (review.flags.beginnerLike ? 12 : 2), 0, 20);
  const gameplayDepth = clamp(weights.gameplayDepth + complexityBonus - (review.flags.thinGameplay ? 10 : 0), 0, 20);
  const marketFit = clamp(weights.marketFit - (review.flags.weakDifferentiation ? 10 : 2), 0, 20);
  const feasibility = clamp(weights.feasibility - realismPenalty, 0, 20);
  const architecture = clamp(weights.architecture - architecturePenalty, 0, 20);

  const total = innovation + gameplayDepth + marketFit + feasibility + architecture;
  return {
    total,
    breakdown: { innovation, gameplayDepth, marketFit, feasibility, architecture },
  };
};

export async function runPipelineSteps(context) {
  const notes = [];

  const understander = await gemini({
    role: 'Understander AI',
    input: `${ROLE_PROMPTS.understander}\n${context.prompt}`,
    constraints: [PIPELINE_GUARDS.disallowBeginnerIdeas],
  });

  const ideaGenerator = await gemini({
    role: 'Idea Generator',
    input: `${ROLE_PROMPTS.ideaGenerator}\n${compact(understander.output)}`,
  });

  const marketFilter = await gemini({
    role: 'Market Filter',
    input: `${ROLE_PROMPTS.marketFilter}\nCandidate: ${ideaGenerator.output}`,
  });

  const gameplayEnhancer = await gemini({
    role: 'Gameplay Enhancer',
    input: `${ROLE_PROMPTS.gameplayEnhancer}\nBase: ${marketFilter.output}`,
  });

  const monetizationBooster = await gemini({
    role: 'Monetization Booster',
    input: `${ROLE_PROMPTS.monetizationBooster}\nBase: ${gameplayEnhancer.output}`,
  });

  const realityChecker = await gemini({
    role: 'Reality Checker',
    input: `${ROLE_PROMPTS.realityChecker}\nProposal: ${monetizationBooster.output}`,
  });

  const promptCreator = await gemini({
    role: 'Prompt Creator',
    input: `${ROLE_PROMPTS.promptCreator}\nProposal: ${realityChecker.output}`,
    constraints: [PIPELINE_GUARDS.enforceModularCode, ...PIPELINE_GUARDS.mandatoryComponents],
  });

  const spec = buildSpec({ prompt: context.prompt, concept: promptCreator.output, attempt: context.attempt });
  const deepseekResult = await deepseek({ spec });
  const llamaResult = await llama({ generatedCode: deepseekResult.output, checklist: PIPELINE_GUARDS.mandatoryComponents });

  const gameplayReviewer = await gemini({
    role: 'Gameplay Reviewer',
    input: `${ROLE_PROMPTS.gameplayReviewer}\nReview data: ${JSON.stringify(llamaResult.review)}`,
  });

  const scoring = computeScore({ review: llamaResult.review, conceptText: promptCreator.output });

  notes.push('Understander mapped audience, complexity, and constraints.');
  notes.push('Market Filter removed weakly differentiated mechanics.');
  notes.push('Gameplay and monetization passes improved retention + revenue quality.');
  notes.push(`Architecture review ${llamaResult.review.passed ? 'passed' : 'requires fixes'} with ${llamaResult.review.missing.length} missing modules.`);

  return {
    idea: context.basePrompt,
    improvedIdea: gameplayReviewer.output,
    code: llamaResult.output,
    score: scoring.total,
    scoreBreakdown: scoring.breakdown,
    notes,
    diagnostics: {
      missingModules: llamaResult.review.missing,
      risks: llamaResult.review.risks,
      flags: llamaResult.review.flags,
      fixerActions: llamaResult.review.fixes,
    },
  };
}
