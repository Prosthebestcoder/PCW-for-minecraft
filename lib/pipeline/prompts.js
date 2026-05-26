export const PIPELINE_CONFIG = {
  maxAttempts: 3,
  scoreThreshold: 35,
  dimensions: {
    innovation: 20,
    gameplayDepth: 20,
    marketFit: 20,
    feasibility: 20,
    architecture: 20,
  },
};

export const PIPELINE_GUARDS = {
  disallowBeginnerIdeas: 'Reject simplistic, low-retention plugin concepts.',
  enforceModularCode: 'Require multi-file architecture with managers/listeners/commands.',
  mandatoryComponents: ['config.yml', 'commands', 'listeners', 'managers'],
  forbiddenPatterns: ['single class plugin', 'hello world', 'basic welcome plugin'],
};

export const ROLE_PROMPTS = {
  understander: 'Extract player segment, server economy fit, risks, and success metrics.',
  ideaGenerator: 'Generate a premium concept with systemic progression loops and multiplayer dynamics.',
  marketFilter: 'Reject undifferentiated ideas and improve value proposition.',
  gameplayEnhancer: 'Increase replayability, social strategy, and event-driven depth.',
  monetizationBooster: 'Add ethical monetization paths with cosmetics/utility, not pay-to-win.',
  realityChecker: 'Validate against Bukkit/Spigot constraints, performance, and maintainability.',
  promptCreator: 'Produce a developer-grade implementation plan with package/module boundaries.',
  gameplayReviewer: 'Review retention potential and competitive moat.',
};
