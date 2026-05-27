export const PIPELINE_CONFIG = {
  maxAttempts: 3,
  scoreThreshold: 35,
};

export const PIPELINE_GUARDS = {
  disallowBeginner: 'Reject beginner-level, low-retention ideas.',
  requiredModules: ['config.yml', 'commands', 'listeners', 'managers'],
  modularity: 'Require multi-file architecture with separated command/listener/manager layers.',
};

export const PLACEHOLDER_PATTERNS = [
  /\{\{\s*idea_here\s*\}\}/i,
  /\$\{\s*idea\s*\}/i,
  /plugin\s*idea\s*:\s*$/i,
];

export const CLARIFICATION_QUESTIONS = [
  'What is the exact gameplay loop and win condition players experience in the first 10 minutes?',
  'Should this run on a single gameplay server (Paper) or across a network/proxy (Velocity), and what scale (average/peak players) should it target?',
  'What monetization and retention goals should the plugin support (e.g., battle pass, cosmetics, guild progression, seasonal resets)?',
];

export const ROLE_PROMPTS = {
  qwen: 'Act as a senior Minecraft systems designer. Produce a developer-grade architecture spec.',
  deepseek: 'Generate modular production-ready plugin code from the provided specification.',
  llama: 'Debug, optimize, and enforce clean architecture constraints on generated code.',
  gemini: 'Review gameplay depth, retention, feasibility, and market differentiation. Return score and feedback.',
};

export const REVIEW_OUTPUT_SCHEMA = {
  required: ['score', 'verdict', 'feedback', 'improvements'],
  scoreRange: [0, 50],
  verdicts: ['ACCEPT', 'IMPROVE'],
};
