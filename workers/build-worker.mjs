import { Worker } from 'bullmq';
import { randomUUID } from 'crypto';
import { execFile } from 'child_process';
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from 'fs/promises';
import { existsSync } from 'fs';
import os from 'os';
import path from 'path';

const BUILD_QUEUE_NAME = process.env.BUILD_QUEUE_NAME || 'plugin-builds';
const BUILD_MAX_ATTEMPTS = Number(process.env.BUILD_MAX_ATTEMPTS || 3);
const BUILD_ARTIFACT_DIR = process.env.BUILD_ARTIFACT_DIR || '/tmp/plugin-forge-artifacts';
const MAVEN_CACHE_VOLUME = process.env.MAVEN_CACHE_VOLUME || 'plugin-forge-maven-cache';
const DOCKER_IMAGE = process.env.BUILD_DOCKER_IMAGE || 'maven:3.9.9-eclipse-temurin-17';
const DOCKER_MEMORY = process.env.BUILD_DOCKER_MEMORY || '768m';
const DOCKER_CPUS = process.env.BUILD_DOCKER_CPUS || '1.0';
const BUILD_TIMEOUT_MS = Number(process.env.BUILD_TIMEOUT_MS || 120000);
const WORKER_CONCURRENCY = Number(process.env.BUILD_WORKER_CONCURRENCY || 2);

const redisConnection = process.env.REDIS_URL
  ? { url: process.env.REDIS_URL }
  : {
      host: process.env.REDIS_HOST || '127.0.0.1',
      port: Number(process.env.REDIS_PORT || 6379),
      password: process.env.REDIS_PASSWORD || undefined,
    };


function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeBuildPayload(payload) {
  const normalized = { ...payload };
  if ('user_id' in normalized) normalized.user_id = isUuid(normalized.user_id) ? normalized.user_id : null;
  if ('generation_id' in normalized) normalized.generation_id = isUuid(normalized.generation_id) ? normalized.generation_id : null;
  return normalized;
}

function supabaseConfigured() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

async function upsertBuildResult(payload) {
  if (!supabaseConfigured()) return;

  const table = process.env.SUPABASE_BUILD_JOBS_TABLE || 'plugin_build_jobs';
  const endpoint = `${process.env.SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}?on_conflict=job_id`;
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
      'Content-Type': 'application/json',
      Prefer: 'resolution=merge-duplicates,return=minimal',
    },
    body: JSON.stringify(normalizeBuildPayload({ ...payload, updated_at: new Date().toISOString() })),
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase build upsert failed (${response.status}): ${details}`);
  }
}

function safeRelativePath(filePath) {
  const normalized = path.posix.normalize(String(filePath || '').replace(/\\/g, '/'));
  if (!normalized || normalized.startsWith('../') || path.isAbsolute(normalized)) {
    throw new Error(`Unsafe project file path rejected: ${filePath}`);
  }
  return normalized;
}

async function writeProjectFiles(workspace, files) {
  for (const file of files) {
    const relativePath = safeRelativePath(file.path);
    const target = path.join(workspace, relativePath);
    await mkdir(path.dirname(target), { recursive: true });
    await writeFile(target, String(file.content || ''), 'utf8');
  }
}

function execDocker(args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = execFile('docker', args, {
      timeout: BUILD_TIMEOUT_MS,
      maxBuffer: 1024 * 1024 * 8,
      ...options,
    }, (error, stdout, stderr) => {
      const output = `${stdout || ''}${stderr || ''}`;
      if (error) {
        error.output = output;
        reject(error);
        return;
      }
      resolve(output);
    });

    child.stdin?.end();
  });
}

async function runDockerMavenBuild(workspace) {
  const args = [
    'run',
    '--rm',
    '--network',
    'none',
    '--memory',
    DOCKER_MEMORY,
    '--cpus',
    DOCKER_CPUS,
    '--pids-limit',
    '256',
    '--security-opt',
    'no-new-privileges',
    '-v',
    `${workspace}:/workspace`,
    '-v',
    `${MAVEN_CACHE_VOLUME}:/root/.m2`,
    '-w',
    '/workspace',
    DOCKER_IMAGE,
    'mvn',
    '-B',
    '-DskipTests',
    'package',
  ];

  return execDocker(args);
}

function fixProjectFiles(files, errorLog) {
  const source = `${errorLog}\n${JSON.stringify(files)}`;
  const existingJava = files.find((file) => file.path?.startsWith('src/main/java/') && file.path.endsWith('.java'));
  const javaPath = existingJava?.path || 'src/main/java/com/server/forgeplugin/ForgePlugin.java';
  const className = path.basename(javaPath, '.java').replace(/[^A-Za-z0-9_]/g, '') || 'ForgePlugin';
  const packageName = javaPath
    .replace(/^src\/main\/java\//, '')
    .replace(new RegExp(`/${className}\\.java$`), '')
    .replace(/\//g, '.') || 'com.server.forgeplugin';
  const mainClass = `${packageName}.${className}`;
  const pluginName = className.replace(/[^A-Za-z0-9]/g, '') || 'ForgePlugin';

  const pomXml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<project xmlns="http://maven.apache.org/POM/4.0.0"',
    '         xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"',
    '         xsi:schemaLocation="http://maven.apache.org/POM/4.0.0 https://maven.apache.org/xsd/maven-4.0.0.xsd">',
    '  <modelVersion>4.0.0</modelVersion>',
    `  <groupId>${packageName}</groupId>`,
    `  <artifactId>${pluginName.toLowerCase()}</artifactId>`,
    '  <version>1.0.0</version>',
    '  <packaging>jar</packaging>',
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
    `package ${packageName};`,
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

  const config = files.find((file) => file.path === 'config.yml')?.content || 'plugin:\n  debug: false\n';
  void source;

  return [
    { path: 'pom.xml', content: pomXml },
    { path: javaPath, content: javaMain },
    { path: 'plugin.yml', content: pluginYml },
    { path: 'config.yml', content: config },
  ];
}

async function findBuiltJar(workspace, jobId) {
  const targetDir = path.join(workspace, 'target');
  if (!existsSync(targetDir)) return null;

  const targetFiles = await readdir(targetDir).catch(() => []);
  const jarName = targetFiles.find((name) => name.endsWith('.jar') && !name.startsWith('original-'));
  if (!jarName) return null;

  await mkdir(BUILD_ARTIFACT_DIR, { recursive: true });
  const artifactPath = path.join(BUILD_ARTIFACT_DIR, `${jobId}-${jarName}`);
  const jarContent = await readFile(path.join(targetDir, jarName));
  await writeFile(artifactPath, jarContent);
  return artifactPath;
}

async function processBuildJob(job) {
  const jobId = String(job.data?.metadata?.id || job.id || randomUUID());
  const pluginName = job.data?.metadata?.name || 'GeneratedPlugin';
  let files = job.data?.files || [];
  let lastError = '';

  await upsertBuildResult({
    job_id: jobId,
    status: 'processing',
    plugin_name: pluginName,
    jar_location: null,
    error_log: null,
    metadata: job.data?.metadata || {},
    user_id: job.data?.metadata?.user_id || job.data?.metadata?.userId || null,
    generation_id: job.data?.metadata?.generation_id || job.data?.metadata?.generationId || null,
  });

  for (let attempt = 1; attempt <= BUILD_MAX_ATTEMPTS; attempt += 1) {
    const workspace = await mkdtemp(path.join(os.tmpdir(), `plugin-build-${jobId}-${attempt}-`));
    try {
      await writeProjectFiles(workspace, files);
      await runDockerMavenBuild(workspace);
      const jarLocation = await findBuiltJar(workspace, jobId);

      if (!jarLocation) {
        throw new Error('Build completed but no jar artifact was found in target/.');
      }

      await upsertBuildResult({
        job_id: jobId,
        status: 'done',
        plugin_name: pluginName,
        jar_location: jarLocation,
        error_log: null,
        metadata: { ...(job.data?.metadata || {}), attempts: attempt },
        user_id: job.data?.metadata?.user_id || job.data?.metadata?.userId || null,
        generation_id: job.data?.metadata?.generation_id || job.data?.metadata?.generationId || null,
      });

      return { job_id: jobId, status: 'done', jar_location: jarLocation, attempts: attempt };
    } catch (error) {
      lastError = error.output || error.message;
      files = fixProjectFiles(files, lastError);

      await upsertBuildResult({
        job_id: jobId,
        status: attempt === BUILD_MAX_ATTEMPTS ? 'failed' : 'processing',
        plugin_name: pluginName,
        jar_location: null,
        error_log: lastError.slice(0, 20000),
        metadata: { ...(job.data?.metadata || {}), attempts: attempt, auto_fix_applied: attempt < BUILD_MAX_ATTEMPTS },
        user_id: job.data?.metadata?.user_id || job.data?.metadata?.userId || null,
        generation_id: job.data?.metadata?.generation_id || job.data?.metadata?.generationId || null,
      });

      if (attempt === BUILD_MAX_ATTEMPTS) {
        throw new Error(lastError);
      }
    } finally {
      await rm(workspace, { recursive: true, force: true });
    }
  }

  throw new Error(lastError || 'Build failed for unknown reason.');
}

const worker = new Worker(BUILD_QUEUE_NAME, processBuildJob, {
  connection: redisConnection,
  concurrency: WORKER_CONCURRENCY,
  lockDuration: BUILD_TIMEOUT_MS + 30000,
});

worker.on('completed', (job, result) => {
  console.log(`Build job ${job.id} completed`, result);
});

worker.on('failed', (job, error) => {
  console.error(`Build job ${job?.id} failed`, error.message);
});

process.on('SIGTERM', async () => {
  await worker.close();
  process.exit(0);
});
