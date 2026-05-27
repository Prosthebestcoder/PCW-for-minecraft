import { ROLE_PROMPTS, PIPELINE_GUARDS } from '@/prompts';

export async function qwen({ prompt, previousFeedback = '', task = 'specification' }) {
  const apiKey = process.env.QWEN_API_KEY;

  if (task === 'dashboard_summary') {
    const { idea = '', spec = '', code = '', score = 0 } = typeof prompt === 'object' && prompt !== null ? prompt : {};
    const source = `${idea} ${spec}`.toLowerCase();
    const tags = [
      source.includes('economy') ? 'economy' : null,
      source.includes('pvp') || source.includes('combat') ? 'pvp' : null,
      source.includes('guild') || source.includes('party') ? 'social' : null,
      source.includes('season') ? 'seasonal' : null,
      source.includes('quest') || source.includes('objective') ? 'progression' : null,
    ].filter(Boolean);

    const output = {
      name: source.includes('season') ? 'SeasonForge Nexus' : 'ForgeCore Dominion',
      description: 'High-retention multiplayer plugin focused on progression loops, social competition, and configurable server control.',
      server_type: source.includes('velocity') ? 'Network (Velocity + Paper backend)' : 'Paper/Spigot multiplayer server',
      features: [
        'Tiered progression with milestone rewards and repeatable objectives',
        'Multiplayer competition via guild/party leaderboards and rivalry goals',
        'Admin balancing controls with configurable cooldowns and anti-exploit rules',
        'Season lifecycle support with reset policies and retention hooks',
      ],
      score: Number(score) || 0,
      quality_summary: Number(score) >= 35
        ? 'Strong production potential with solid retention design; continue balancing and live profiling.'
        : 'Concept is promising but below production bar due to weak retention depth and/or architecture clarity.',
      tags: [...new Set(tags.length ? tags : ['multiplayer', 'progression'])],
    };

    void code;
    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output,
    };
  }

  if (task === 'knowledge_spec') {
    const { knowledge = '', idea = '' } = typeof prompt === 'object' && prompt !== null ? prompt : {};
    const ideaText = String(idea || '').trim();
    const knowledgeText = String(knowledge || '').trim();
    const source = `${ideaText} ${knowledgeText}`.toLowerCase();
    const isProxy = source.includes('proxy') || source.includes('network-wide') || source.includes('cross-server');
    const platform = isProxy ? 'Hybrid (Velocity proxy + Paper backend plugin modules)' : 'Paper (Spigot-compatible)';

    const spec = [
      'Platform',
      `- Type: ${platform}`,
      `- Why: ${isProxy
        ? 'The concept implies cross-server routing/state, so proxy coordination is required while gameplay mechanics remain on backend Paper servers.'
        : 'The concept is gameplay-centric and best implemented directly in Paper using modern event-driven APIs.'}`,
      '- Compatibility: Target latest stable Minecraft/Paper API for production rollout; avoid deprecated scheduler/chat APIs and legacy material/data usage.',
      '',
      'Core Features',
      '- Retention-first progression loop with daily/weekly/seasonal objectives and milestone rewards.',
      '- Multiplayer engagement via parties/guild contributions, rivalry leaderboards, and rotating cooperative challenges.',
      '- Server-ops controls: balancing knobs, anti-exploit guards, cooldown/rate-limit policies, and observability hooks.',
      '- Economy-safe reward sinks and configurable inflation controls for long-running worlds.',
      '',
      'Architecture',
      '- main: ForgeBootstrap (service wiring, lifecycle, dependency graph).',
      '- commands: ForgeCommand, ProfileCommand, ObjectivesCommand, AdminBalanceCommand, SeasonAdminCommand.',
      '- listeners: PlayerSessionListener, CombatObjectiveListener, EconomyFlowListener, RewardClaimListener.',
      '- managers: ProgressionManager, ObjectiveManager, RewardManager, SeasonManager, MatchmakingManager, AntiExploitManager, CacheManager.',
      '- repositories: PlayerProgressRepository, SeasonStateRepository, LeaderboardRepository.',
      '- integrations: Placeholder hook adapters (permissions/economy/chat) isolated behind interfaces.',
      '',
      'Events',
      '- PlayerJoinEvent, PlayerQuitEvent, PlayerDeathEvent, EntityDamageByEntityEvent, PlayerInteractEvent.',
      '- InventoryClickEvent for GUI actions; AsyncPlayerChatEvent only for lightweight parsing pathways.',
      '- Custom domain events: ObjectiveCompletedEvent, TierUnlockedEvent, SeasonCheckpointEvent.',
      '',
      'Commands & Permissions',
      '- /forge profile (forge.player.profile)',
      '- /forge objectives [daily|weekly|season] (forge.player.objectives)',
      '- /forge party [create|invite|leave] (forge.player.party)',
      '- /forge leaderboard [global|season] (forge.player.leaderboard)',
      '- /forge admin rebalance <module> (forge.admin.rebalance)',
      '- /forge admin season <start|pause|end|reset> (forge.admin.season)',
      '',
      'Config Structure (config.yml)',
      '- plugin.mode, plugin.locale, plugin.debug',
      '- storage.type, storage.pool, storage.timeouts',
      '- progression.tiers[], progression.prestige, progression.decayPolicy',
      '- objectives.daily[], objectives.weekly[], objectives.seasonal[]',
      '- rewards.currencies, rewards.cosmetics, rewards.unlocks',
      '- social.parties, social.guilds, social.leaderboards',
      '- economy.sinks, economy.caps, economy.inflationControls',
      '- performance.asyncPipelines, performance.batchSize, performance.tickBudgetMs',
      '- antiExploit.rateLimits, antiExploit.validationRules, antiExploit.penalties',
      '- season.lengthDays, season.softReset, season.carryOverRules',
      '',
      'Performance & Scalability',
      '- Keep expensive computations async with safe main-thread handoff for Bukkit API calls.',
      '- Batch leaderboard/stat writes and cache hot profile/objective reads.',
      '- Avoid per-tick scans of full player sets; prefer event-driven updates + scheduled coarse aggregation.',
      '',
      'Knowledge-Aware Notes',
      `- Applied provided knowledge context to platform and feature decisions: ${knowledgeText || 'No extra knowledge provided; defaulted to modern Paper/Velocity production practices.'}`,
      `- Plugin idea baseline: ${ideaText || 'No idea provided.'}`,
    ].join('\n');

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: spec,
    };
  }

  if (task === 'idea_improver') {
    const improvedIdea = [
      'Premium plugin idea refinement (auto-improver):',
      prompt,
      'Refinements: enforce high-retention multiplayer loop, progression depth, monetization hooks, and modular multi-class architecture.',
    ].join('\n');

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: improvedIdea,
    };
  }

  if (task === 'spec_improver') {
    const improvedSpec = [
      'Platform: Paper (latest stable API) unless cross-server routing is explicitly required; use Velocity only for network-wide features.',
      'Core Goal: Transform the original concept into a premium retention-focused multiplayer system with a repeatable progression loop, social competition, and seasonal longevity.',
      '',
      'Features:',
      '- Progression Loop: tiered objectives, milestone rewards, daily/weekly tracks, and seasonal resets with carry-over prestige.',
      '- Multiplayer Systems: party/guild contribution goals, shared objectives, leaderboard ladders, and rivalry events.',
      '- Retention Hooks: streak bonuses, rotating world modifiers, comeback mechanics, and economy sinks to stabilize inflation.',
      '- Real Server Utility: admin balancing controls, anti-exploit checks, configurable cooldowns, and audit logs.',
      '',
      'Architecture (modular, multi-file):',
      '- main: ForgePluginBootstrap (lifecycle wiring, service registration).',
      '- commands: ForgeCommand, AdminBalanceCommand, SeasonCommand.',
      '- listeners: CombatListener, ObjectiveListener, SessionListener, EconomyListener.',
      '- managers: ProgressionManager, RewardManager, MatchmakingManager, SeasonManager, EconomyManager, CacheManager.',
      '- config.yml: global settings + progression + rewards + seasons + performance + integrations.',
      '',
      'Events:',
      '- PlayerJoinEvent, PlayerQuitEvent, PlayerDeathEvent, EntityDamageByEntityEvent, InventoryClickEvent, AsyncPlayerChatEvent.',
      '- Custom domain events: ObjectiveCompletedEvent, SeasonTierUnlockedEvent, GuildMilestoneReachedEvent.',
      '',
      'Commands & Permissions:',
      '- /forge profile (forge.player.profile)',
      '- /forge objectives (forge.player.objectives)',
      '- /forge season status (forge.player.season)',
      '- /forge admin rebalance (forge.admin.rebalance)',
      '- /forge admin season <start|end|reset> (forge.admin.season)',
      '',
      'Config Structure:',
      '- plugin.mode, storage.type, storage.pool, cache.ttlSeconds',
      '- progression.tiers[], progression.prestige, progression.decay',
      '- rewards.track.daily, rewards.track.weekly, rewards.track.seasonal',
      '- matchmaking.enabled, matchmaking.rules, matchmaking.partyLimits',
      '- season.lengthDays, season.softReset, season.leaderboards',
      '- performance.asyncTasks, performance.batchSizes, performance.tickBudgets',
      '- antiExploit.rateLimits, antiExploit.validation, antiExploit.penalties',
      '',
      `Original Spec / Idea:\n${prompt}`,
      previousFeedback ? `Reviewer Feedback:\n${previousFeedback}` : null,
    ]
      .filter(Boolean)
      .join('\n');

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: improvedSpec,
    };
  }

  const developerSpec = [
    ROLE_PROMPTS.qwen,
    `User prompt: ${prompt}`,
    previousFeedback ? `Previous feedback: ${previousFeedback}` : null,
    `Constraint: ${PIPELINE_GUARDS.disallowBeginner}`,
    `Constraint: ${PIPELINE_GUARDS.modularity}`,
    `Required modules: ${PIPELINE_GUARDS.requiredModules.join(', ')}`,
  ]
    .filter(Boolean)
    .join('\n');

  return {
    provider: 'qwen',
    usedApiKey: Boolean(apiKey),
    output: developerSpec,
  };
}
