const renderCode = (spec) => `# Plugin Blueprint\n${spec}\n\n## config.yml\nmode: production\n\n## commands/MainCommand.java\n// command handlers\n\n## listeners/GameListener.java\n// gameplay listeners\n\n## managers/PluginManager.java\n// plugin managers`;

export async function deepseek({ spec }) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  return {
    provider: 'deepseek',
    usedApiKey: Boolean(apiKey),
    output: renderCode(spec),
  };
}
