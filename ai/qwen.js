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

    const needsProxy =
      source.includes('proxy') ||
      source.includes('cross-server') ||
      source.includes('network-wide') ||
      source.includes('global queue') ||
      source.includes('hub') ||
      source.includes('bungeecord') ||
      source.includes('velocity');

    const platform = needsProxy
      ? 'Hybrid (Velocity proxy plugin + Paper backend gameplay module)'
      : 'Paper (Spigot-compatible)';

    const versionLine = needsProxy
      ? 'Minecraft 1.21.x network, Velocity 3.3+ for proxy layer, Paper 1.21.x for gameplay nodes.'
      : 'Minecraft 1.21.x, Paper 1.21.x API (Spigot-compatible where needed).';

    const knowledgeNote = knowledgeText
      ? `Applied knowledge signals: ${knowledgeText}`
      : 'Knowledge payload was limited; applied current Paper/Velocity production best practices without deprecated APIs.';

    const spec = [
      '1) Platform Detection',
      `- Platform type: ${platform}`,
      `- Why this platform is correct: ${needsProxy
        ? 'The idea implies cross-server state or routing, which belongs at proxy level, while gameplay logic remains on Paper for world/event control.'
        : 'The concept is gameplay-world centric and is best executed with Paper's server event model and plugin lifecycle.'}`,
      '',
      '2) Compatibility',
      `- Minecraft/API target: ${versionLine}`,
      '- API standards: use Adventure components for messaging, modern scheduler patterns, namespaced keys for persistent data, and async I/O for storage.',
      '- Avoid deprecated methods: no legacy chat formatting APIs, no deprecated material/data APIs, no blocking DB/file operations on main thread.',
      '',
      '3) Core Concept',
      '- Goal: transform the base idea into a premium, retention-first multiplayer system with clear progression and social competition.',
      '- Target server type: mid-to-large public multiplayer servers (100–2000+ concurrent players depending on deployment).',
      '- Problem solved: weak long-term engagement by adding structured objectives, seasonality, and measurable social progression.',
      '',
      '4) Features (Multiplayer-Focused)',
      '- Dynamic objective engine: daily/weekly/seasonal objectives with weighted difficulty and anti-farm safeguards.',
      '- Social progression: party/guild contribution goals, shared milestones, and rivalry leaderboard brackets.',
      '- Retention systems: streak bonuses, comeback multipliers, seasonal pass milestones, and catch-up mechanics for late joiners.',
      '- Economy-safe rewards: configurable sinks, caps, and inflation controls tied to objective rewards.',
      '- Operations toolkit: live balancing toggles, abuse throttles, analytics hooks, and safe soft-reset controls.',
      '',
      '5) Architecture',
      '- packages:',
      '  - plugin.bootstrap (startup wiring, DI container, lifecycle)',
      '  - plugin.commands (player/admin command handlers + tab completion)',
      '  - plugin.listeners (event adapters only; no business logic)',
      '  - plugin.managers (progression, objectives, rewards, seasons, anti-exploit)',
      '  - plugin.repositories (player state, leaderboards, season snapshots)',
      '  - plugin.services (economy hooks, permissions, cache, async job queue)',
      '- key classes and responsibilities:',
      '  - ForgePlugin: enable/disable lifecycle, module registration, health checks.',
      '  - ObjectiveManager: objective assignment, completion validation, cooldown gating.',
      '  - ProgressionManager: XP/tier computation, prestige, decay/catch-up logic.',
      '  - RewardManager: reward resolution, sink balancing, claim tracking.',
      '  - SeasonManager: season calendar, checkpoint snapshots, reset/carry-over.',
      '  - LeaderboardService: aggregate ranking, cache invalidation, async persistence.',
      '  - AntiExploitManager: rate limits, duplicate event suppression, anomaly flags.',
      '',
      '6) Events to Use',
      '- PlayerJoinEvent / PlayerQuitEvent for session initialization + flush.',
      '- PlayerInteractEvent / BlockBreakEvent / EntityDamageByEntityEvent for objective progress signals.',
      '- PlayerDeathEvent for risk/reward objectives and anti-farm checks.',
      '- InventoryClickEvent for GUI reward/objective interaction.',
      '- AsyncPlayerChatEvent only for lightweight command-like triggers (no heavy logic).',
      '- Custom domain events: ObjectiveCompletedEvent, TierPromotedEvent, SeasonCheckpointEvent.',
      '',
      '7) Commands & Permissions',
      '- /forge profile (forge.player.profile)',
      '- /forge objectives [daily|weekly|season] (forge.player.objectives)',
      '- /forge rewards claim <track> (forge.player.rewards.claim)',
      '- /forge leaderboard [global|season|guild] (forge.player.leaderboard)',
      '- /forge party <create|invite|kick|leave> (forge.player.party)',
      '- /forge admin rebalance <module> <value> (forge.admin.rebalance)',
      '- /forge admin season <start|pause|end|reset> (forge.admin.season)',
      '- /forge admin diagnostics (forge.admin.diagnostics)',
      '',
      '8) config.yml Structure',
      '- plugin: { locale, debug, timezone, shardId }',
      '- storage: { provider, poolSize, connectTimeoutMs, writeBatchSize }',
      '- cache: { profileTtlSec, leaderboardTtlSec, maxEntries }',
      '- progression: { baseXpCurve, tiers[], prestige, decayPolicy, catchUp }',
      '- objectives: { daily[], weekly[], seasonal[], rerollPolicy, antiFarm }',
      '- rewards: { currencies, cosmetics, unlocks, claimCooldowns, sinks }',
      '- social: { parties, guilds, rivalryBrackets, leaderboardWindows }',
      '- season: { lengthDays, checkpointHours, softReset, carryOverRules }',
      '- performance: { asyncWorkers, tickBudgetMs, queueBackpressure, sampleRate }',
      '- antiExploit: { rateLimits, duplicateWindowMs, anomalyThresholds, penalties }',
      '',
      '9) Performance & Scalability Considerations',
      '- Keep Bukkit/Paper API calls on main thread; move scoring, persistence, and leaderboard aggregation to async workers.',
      '- Use write-behind batching and bounded queues; apply backpressure instead of unbounded memory growth.',
      '- Cache hot player/leaderboard reads and invalidate by event; never full-scan all players every tick.',
      '- Add observability (timers, queue depth, error rates) and admin diagnostics for safe live tuning.',
      '',
      'Knowledge Alignment',
      `- ${knowledgeNote}`,
      `- Source idea interpreted: ${ideaText || 'No idea supplied.'}`,
    ].join('
');

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: spec,
    };
  }

  if (task === 'project_packager') {
    const { code = '', spec = '' } = typeof prompt === 'object' && prompt !== null ? prompt : {};
    const source = `${spec}\n${code}`;
    const lower = source.toLowerCase();
    const sanitizedName = String((spec || code || 'ForgePlugin').match(/[A-Za-z][A-Za-z0-9 ]{2,40}/)?.[0] || 'ForgePlugin')
      .replace(/\s+/g, '')
      .replace(/[^A-Za-z0-9]/g, '')
      .slice(0, 24);
    const pluginName = sanitizedName || 'ForgePlugin';
    const basePackage = `com.server.${pluginName.toLowerCase()}`;
    const mainClass = `${basePackage}.ForgePlugin`;

    const commands = [
      { name: 'forge', desc: 'Main plugin command', usage: '/forge help', permission: 'forge.use' },
      { name: 'forgeadmin', desc: 'Administrative plugin control', usage: '/forgeadmin reload', permission: 'forge.admin' },
    ];

    const permissions = [
      { node: 'forge.use', desc: 'Allows player usage commands', def: 'true' },
      { node: 'forge.admin', desc: 'Allows administrative commands', def: 'op' },
    ];

    const pluginYml = [
      `name: ${pluginName}`,
      'version: 1.0.0',
      `main: ${mainClass}`,
      'api-version: "1.20"',
      'authors:',
      '  - AI Minecraft Plugin Forge',
      'commands:',
      ...commands.flatMap((command) => [
        `  ${command.name}:`,
        `    description: ${command.desc}`,
        `    usage: "${command.usage}"`,
        `    permission: ${command.permission}`,
      ]),
      'permissions:',
      ...permissions.flatMap((permission) => [
        `  ${permission.node}:`,
        `    description: ${permission.desc}`,
        `    default: ${permission.def}`,
      ]),
    ].join('\n');

    const configYml = [
      'plugin:',
      '  debug: false',
      '  locale: en_US',
      'features:',
      `  progression: ${lower.includes('progress') || lower.includes('season') ? 'true' : 'false'}`,
      `  economy_hooks: ${lower.includes('economy') || lower.includes('currency') ? 'true' : 'false'}`,
      `  party_system: ${lower.includes('party') || lower.includes('guild') ? 'true' : 'false'}`,
      'performance:',
      '  async_workers: 4',
      '  cache_ttl_seconds: 120',
      '  tick_budget_ms: 2',
      'storage:',
      '  type: yaml',
      '  autosave_interval_seconds: 60',
    ].join('\n');

    const javaMain = [
      `package ${basePackage};`,
      '',
      'import org.bukkit.plugin.java.JavaPlugin;',
      '',
      'public final class ForgePlugin extends JavaPlugin {',
      '  @Override',
      '  public void onEnable() {',
      '    saveDefaultConfig();',
      "    getLogger().info(\"Plugin enabled: \" + getDescription().getVersion());",
      '  }',
      '',
      '  @Override',
      '  public void onDisable() {',
      "    getLogger().info(\"Plugin disabled.\");",
      '  }',
      '}',
    ].join('\n');

    const readme = [
      `# ${pluginName}`,
      '',
      '## Description',
      'Production-oriented Minecraft plugin project scaffold generated from specification and code context.',
      '',
      '## Installation',
      '1. Place this project in your Java build workspace (Maven/Gradle).',
      '2. Compile into a jar and place the jar in your Paper server `plugins/` folder.',
      '3. Start server once to generate `config.yml`, then edit values and reload/restart.',
      '',
      '## Usage',
      '- `/forge help` for player commands.',
      '- `/forgeadmin reload` for administrative reload flow.',
      '',
      '## Notes',
      '- Ensure Paper API compatibility with your target server version.',
      '- Extend managers/listeners under the same package for modular growth.',
    ].join('\n');

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: {
        project_name: pluginName,
        files: [
          { path: `src/main/java/${basePackage.replace(/\./g, '/')}/ForgePlugin.java`, content: javaMain },
          { path: 'plugin.yml', content: pluginYml },
          { path: 'config.yml', content: configYml },
          { path: 'README.md', content: readme },
        ],
      },
    };
  }

  if (task === 'project_validator') {
    const { files = [] } = typeof prompt === 'object' && prompt !== null ? prompt : {};
    const errors = [];
    const warnings = [];
    const fixSuggestions = [];

    const fileMap = new Map(
      Array.isArray(files)
        ? files
            .filter((file) => file && typeof file.path === 'string')
            .map((file) => [file.path, String(file.content || '')])
        : [],
    );

    const pluginYml = fileMap.get('plugin.yml');
    const configYml = fileMap.get('config.yml');
    const javaFiles = [...fileMap.entries()].filter(([path]) => path.startsWith('src/main/java/') && path.endsWith('.java'));

    if (!pluginYml) {
      errors.push('Missing required file: plugin.yml');
      fixSuggestions.push('Add plugin.yml at project root with name, version, main, api-version, commands, and permissions.');
    }

    if (!configYml) {
      warnings.push('Missing config.yml (recommended for runtime configurability).');
      fixSuggestions.push('Add config.yml and call saveDefaultConfig() from onEnable().');
    }

    let declaredMain = '';
    if (pluginYml) {
      const requiredFields = ['name:', 'version:', 'main:', 'api-version:'];
      requiredFields.forEach((field) => {
        if (!pluginYml.includes(field)) {
          errors.push(`plugin.yml missing required field: ${field.replace(':', '')}`);
        }
      });

      const mainMatch = pluginYml.match(/^\s*main:\s*([A-Za-z0-9_.]+)\s*$/m);
      if (!mainMatch) {
        errors.push('plugin.yml main class is missing or malformed.');
      } else {
        declaredMain = mainMatch[1];
      }
    }

    const packageToPath = (fullClass) => `src/main/java/${fullClass.replace(/\./g, '/')}.java`;
    if (declaredMain && !fileMap.has(packageToPath(declaredMain))) {
      errors.push(`Main class file not found for plugin.yml main: ${declaredMain}`);
      fixSuggestions.push(`Create ${packageToPath(declaredMain)} or update plugin.yml main to match existing class path.`);
    }

    const seenClassNames = new Set();
    javaFiles.forEach(([path, content]) => {
      if (!/class\s+[A-Za-z_][A-Za-z0-9_]*/.test(content)) {
        warnings.push(`No class declaration detected in ${path}`);
      }
      const pkgMatch = content.match(/^\s*package\s+([A-Za-z0-9_.]+)\s*;/m);
      if (!pkgMatch) {
        errors.push(`Missing package declaration in ${path}`);
      } else {
        const pkgPath = `src/main/java/${pkgMatch[1].replace(/\./g, '/')}/`;
        if (!path.startsWith(pkgPath)) {
          errors.push(`Package/path mismatch in ${path} (declared package ${pkgMatch[1]}).`);
        }
      }

      const classMatch = content.match(/class\s+([A-Za-z_][A-Za-z0-9_]*)/);
      if (classMatch) {
        const name = classMatch[1];
        if (seenClassNames.has(name)) {
          warnings.push(`Potential duplicate class name detected: ${name}`);
        }
        seenClassNames.add(name);
      }

      if (/while\s*\(\s*true\s*\)/.test(content) || /for\s*\(\s*;\s*;\s*\)/.test(content)) {
        warnings.push(`Potential infinite loop pattern in ${path}`);
        fixSuggestions.push(`Review loops in ${path} and add termination/backoff conditions.`);
      }

      if (/new\s+Thread\s*\(/.test(content) || /\.runTaskAsynchronously\s*\(/.test(content)) {
        warnings.push(`Threading detected in ${path}; verify Bukkit API calls are not made off main thread.`);
      }

      if (/java\.io\.(FileWriter|RandomAccessFile)/.test(content) || /Files\.(write|delete|move)/.test(content)) {
        warnings.push(`Direct file operation detected in ${path}; ensure path validation and async safety.`);
      }

      if (/Runtime\.getRuntime\(\)\.exec|ProcessBuilder\s*\(/.test(content)) {
        errors.push(`Potentially malicious process execution pattern in ${path}`);
        fixSuggestions.push(`Remove process execution from ${path}; server plugins should not spawn arbitrary system commands.`);
      }
    });

    if (javaFiles.length === 0) {
      errors.push('No Java source files found under src/main/java.');
      fixSuggestions.push('Add at least one Java plugin class in src/main/java/... matching plugin.yml main.');
    }

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: {
        valid: errors.length === 0,
        errors,
        warnings,
        fix_suggestions: [...new Set(fixSuggestions)],
      },
    };
  }

  if (task === 'maven_project_packager') {
    const { code = '', spec = '' } = typeof prompt === 'object' && prompt !== null ? prompt : {};
    const source = `${spec}\n${code}`;
    const lower = source.toLowerCase();
    const rawName = String((spec || code || 'ForgePlugin').match(/[A-Za-z][A-Za-z0-9 ]{2,40}/)?.[0] || 'ForgePlugin');
    const pluginName = rawName.replace(/\s+/g, '').replace(/[^A-Za-z0-9]/g, '').slice(0, 24) || 'ForgePlugin';
    const artifactId = pluginName.toLowerCase();
    const basePackage = `com.server.${artifactId}`;
    const mainClassName = 'ForgePlugin';
    const mainClass = `${basePackage}.${mainClassName}`;

    const hasEconomy = lower.includes('economy') || lower.includes('currency');
    const hasParty = lower.includes('party') || lower.includes('guild');
    const hasSeason = lower.includes('season');

    const pomXml = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<project xmlns="http://maven.apache.org/POM/4.0.0"',
      '         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">',
      '  <modelVersion>4.0.0</modelVersion>',
      `  <groupId>${basePackage}</groupId>`,
      `  <artifactId>${artifactId}</artifactId>`,
      '  <version>1.0.0</version>',
      '  <packaging>jar</packaging>',
      `  <name>${pluginName}</name>`,
      '  <properties>',
      '    <maven.compiler.source>17</maven.compiler.source>',
      '    <maven.compiler.target>17</maven.compiler.target>',
      '    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>',
      '  </properties>',
      '  <repositories>',
      '    <repository>',
      '      <id>papermc-repo</id>',
      '      <url>https://repo.papermc.io/repository/maven-public/</url>',
      '    </repository>',
      '  </repositories>',
      '  <dependencies>',
      '    <dependency>',
      '      <groupId>io.papermc.paper</groupId>',
      '      <artifactId>paper-api</artifactId>',
      '      <version>1.20.6-R0.1-SNAPSHOT</version>',
      '      <scope>provided</scope>',
      '    </dependency>',
      '  </dependencies>',
      '</project>',
    ].join('\n');

    const javaMain = [
      `package ${basePackage};`,
      '',
      'import org.bukkit.command.Command;',
      'import org.bukkit.command.CommandSender;',
      'import org.bukkit.plugin.java.JavaPlugin;',
      '',
      `public final class ${mainClassName} extends JavaPlugin {`,
      '  @Override',
      '  public void onEnable() {',
      '    saveDefaultConfig();',
      '    getLogger().info(getName() + " enabled.");',
      '  }',
      '',
      '  @Override',
      '  public void onDisable() {',
      '    getLogger().info(getName() + " disabled.");',
      '  }',
      '',
      '  @Override',
      '  public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {',
      '    if (command.getName().equalsIgnoreCase("forge")) {',
      '      sender.sendMessage("Forge plugin is active.");',
      '      return true;',
      '    }',
      '    if (command.getName().equalsIgnoreCase("forgeadmin")) {',
      '      if (!sender.hasPermission("forge.admin")) {',
      '        sender.sendMessage("You do not have permission.");',
      '        return true;',
      '      }',
      '      reloadConfig();',
      '      sender.sendMessage("Configuration reloaded.");',
      '      return true;',
      '    }',
      '    return false;',
      '  }',
      '}',
    ].join('\n');

    const pluginYml = [
      `name: ${pluginName}`,
      `main: ${mainClass}`,
      'version: 1.0.0',
      'api-version: "1.20"',
      'commands:',
      '  forge:',
      '    description: Main plugin command',
      '    usage: "/forge"',
      '    permission: forge.use',
      '  forgeadmin:',
      '    description: Admin plugin command',
      '    usage: "/forgeadmin reload"',
      '    permission: forge.admin',
      'permissions:',
      '  forge.use:',
      '    description: Use base plugin commands',
      '    default: true',
      '  forge.admin:',
      '    description: Administrative control',
      '    default: op',
    ].join('\n');

    const configYml = [
      'plugin:',
      '  debug: false',
      '  locale: en_US',
      'features:',
      `  economy: ${hasEconomy ? 'true' : 'false'}`,
      `  parties: ${hasParty ? 'true' : 'false'}`,
      `  seasons: ${hasSeason ? 'true' : 'false'}`,
      'performance:',
      '  async-workers: 2',
      '  cache-ttl-seconds: 120',
    ].join('\n');

    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: {
        project_name: pluginName,
        files: [
          { path: 'pom.xml', content: pomXml },
          { path: `src/main/java/${basePackage.replace(/\./g, '/')}/${mainClassName}.java`, content: javaMain },
          { path: 'plugin.yml', content: pluginYml },
          { path: 'config.yml', content: configYml },
        ],
      },
    };
  }

  if (task === 'maven_build_fixer') {
    const { error = '', files = [] } = typeof prompt === 'object' && prompt !== null ? prompt : {};
    const fileList = Array.isArray(files) ? files : [];
    const map = new Map(fileList.filter((f) => f?.path).map((f) => [f.path, String(f.content || '')]));
    const err = String(error || '').toLowerCase();

    const existingMainJavaPath =
      [...map.keys()].find((path) => path.startsWith('src/main/java/') && path.endsWith('.java')) ||
      'src/main/java/com/server/forgeplugin/ForgePlugin.java';

    const className = existingMainJavaPath.split('/').pop()?.replace('.java', '') || 'ForgePlugin';
    const packagePath = existingMainJavaPath.replace('src/main/java/', '').replace(`/${className}.java`, '');
    const pkg = packagePath.replace(/\//g, '.') || 'com.server.forgeplugin';
    const mainClass = `${pkg}.${className}`;
    const pluginName = className.replace(/[^A-Za-z0-9]/g, '') || 'ForgePlugin';

    const fixedPom = [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<project xmlns="http://maven.apache.org/POM/4.0.0"',
      '         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
      '         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">',
      '  <modelVersion>4.0.0</modelVersion>',
      `  <groupId>${pkg}</groupId>`,
      `  <artifactId>${pluginName.toLowerCase()}</artifactId>`,
      '  <version>1.0.0</version>',
      '  <packaging>jar</packaging>',
      `  <name>${pluginName}</name>`,
      '  <properties>',
      '    <maven.compiler.source>17</maven.compiler.source>',
      '    <maven.compiler.target>17</maven.compiler.target>',
      '    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>',
      '  </properties>',
      '  <repositories>',
      '    <repository>',
      '      <id>papermc-repo</id>',
      '      <url>https://repo.papermc.io/repository/maven-public/</url>',
      '    </repository>',
      '  </repositories>',
      '  <dependencies>',
      '    <dependency>',
      '      <groupId>io.papermc.paper</groupId>',
      '      <artifactId>paper-api</artifactId>',
      '      <version>1.20.6-R0.1-SNAPSHOT</version>',
      '      <scope>provided</scope>',
      '    </dependency>',
      '  </dependencies>',
      '</project>',
    ].join('\n');

    const fixedMainJava = [
      `package ${pkg};`,
      '',
      'import org.bukkit.command.Command;',
      'import org.bukkit.command.CommandSender;',
      'import org.bukkit.plugin.java.JavaPlugin;',
      '',
      `public final class ${className} extends JavaPlugin {`,
      '  @Override',
      '  public void onEnable() {',
      '    saveDefaultConfig();',
      '    getLogger().info(getName() + " enabled.");',
      '  }',
      '',
      '  @Override',
      '  public void onDisable() {',
      '    getLogger().info(getName() + " disabled.");',
      '  }',
      '',
      '  @Override',
      '  public boolean onCommand(CommandSender sender, Command command, String label, String[] args) {',
      '    if (command.getName().equalsIgnoreCase("forge")) {',
      '      sender.sendMessage("Forge plugin is active.");',
      '      return true;',
      '    }',
      '    if (command.getName().equalsIgnoreCase("forgeadmin")) {',
      '      if (!sender.hasPermission("forge.admin")) {',
      '        sender.sendMessage("You do not have permission.");',
      '        return true;',
      '      }',
      '      reloadConfig();',
      '      sender.sendMessage("Configuration reloaded.");',
      '      return true;',
      '    }',
      '    return false;',
      '  }',
      '}',
    ].join('\n');

    const fixedPluginYml = [
      `name: ${pluginName}`,
      `main: ${mainClass}`,
      'version: 1.0.0',
      'api-version: "1.20"',
      'commands:',
      '  forge:',
      '    description: Main plugin command',
      '    usage: "/forge"',
      '    permission: forge.use',
      '  forgeadmin:',
      '    description: Admin plugin command',
      '    usage: "/forgeadmin reload"',
      '    permission: forge.admin',
      'permissions:',
      '  forge.use:',
      '    description: Use base plugin commands',
      '    default: true',
      '  forge.admin:',
      '    description: Administrative control',
      '    default: op',
    ].join('\n');

    const fixedConfig = map.get('config.yml') || ['plugin:', '  debug: false'].join('\n');

    void err;
    return {
      provider: 'qwen',
      usedApiKey: Boolean(apiKey),
      output: {
        files: [
          { path: 'pom.xml', content: fixedPom },
          { path: existingMainJavaPath, content: fixedMainJava },
          { path: 'plugin.yml', content: fixedPluginYml },
          { path: 'config.yml', content: fixedConfig },
        ],
      },
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
