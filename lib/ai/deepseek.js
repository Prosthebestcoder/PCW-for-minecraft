const modularTemplate = (pluginName, featureSummary) => `# ${pluginName}\n\n## plugin.yml\nname: ${pluginName}\nversion: 1.0.0\nmain: com.forge.${pluginName.toLowerCase()}.PluginMain\napi-version: 1.20\ncommands:\n  forge:\n    description: Main command for ${pluginName}\n\n## config.yml\nfeatureMode: advanced\ntelemetry: true\n\n## src/main/java/com/forge/${pluginName.toLowerCase()}/PluginMain.java\npublic final class PluginMain extends JavaPlugin {\n  private final ServiceManager services = new ServiceManager(this);\n  @Override\n  public void onEnable() {\n    services.bootstrap();\n    getCommand(\"forge\").setExecutor(new ForgeCommand(services));\n    Bukkit.getPluginManager().registerEvents(new GameplayListener(services), this);\n  }\n}\n\n## src/main/java/com/forge/${pluginName.toLowerCase()}/commands/ForgeCommand.java\n// command execution module\n\n## src/main/java/com/forge/${pluginName.toLowerCase()}/listeners/GameplayListener.java\n// gameplay event listener module\n\n## src/main/java/com/forge/${pluginName.toLowerCase()}/managers/ServiceManager.java\n// orchestration and manager module\n\n## Notes\n${featureSummary}`;

export async function deepseek({ spec }) {
  const pluginName = spec.pluginName || 'MythicEconomyForge';
  return {
    provider: 'deepseek',
    output: modularTemplate(pluginName, spec.featureSummary),
  };
}
