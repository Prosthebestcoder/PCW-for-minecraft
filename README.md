# AI Minecraft Plugin Forge

Production-grade Next.js SaaS backend and UI for generating, reviewing, packaging, validating, and building high-quality Minecraft plugins with a multi-AI orchestration pipeline.

## What this project does

AI Minecraft Plugin Forge is built as a scalable plugin factory, not a tutorial demo:

- **AI orchestration pipeline**: Qwen creates premium developer specifications, DeepSeek generates code, Llama debugs/optimizes, and Gemini scores gameplay quality.
- **Quality loop**: weak outputs below score `35/50` are improved and regenerated up to `BUILD_MAX_ATTEMPTS` / pipeline retry limits.
- **Project packaging**: generated code can be transformed into Maven-ready Paper plugin projects with `pom.xml`, `plugin.yml`, `config.yml`, and Java sources.
- **Strict validation**: project files are checked for structure, obvious Java/API issues, duplicate classes, and unsafe patterns.
- **Build queue**: BullMQ + Redis enqueue Docker/Maven builds so API requests stay fast under load.
- **Worker process**: isolated workers compile jars in Docker with CPU/memory/PID/security limits and Maven cache volume support.
- **Supabase persistence**: generation outputs and build job status are saved to Supabase for dashboards and polling.

## File structure

```text
app/
  api/generate/route.js          # AI generation/package/validate modes
  api/build/route.js             # POST /api/build enqueue endpoint
  api/build/status/route.js      # GET /api/build/status?id=...
  build/route.js                 # POST /build enqueue endpoint
  build/status/route.js          # GET /build/status?id=...
  page.js                        # main SaaS UI
  result/page.js                 # generated result dashboard
ai/
  qwen.js                        # reasoning, specs, packaging, validation tasks
  deepseek.js                    # code generation provider placeholder
  llama.js                       # debugging/optimization provider placeholder
  gemini.js                      # gameplay review/scoring provider placeholder
pipeline/
  orchestrator.js                # role router and high-level AI flows
lib/
  build/                         # BullMQ config, queue, HTTP handlers
  pipeline/                      # legacy-compatible pipeline modules
  supabase.js                    # server-only Supabase REST helper
workers/
  build-worker.mjs               # Docker/Maven build worker
supabase/migrations/
  001_core_schema.sql            # production database schema
```

## Prerequisites

Install these on your machine or deployment host:

1. **Node.js 20 LTS** or newer.
2. **npm**.
3. **Docker** for Maven container builds.
4. **Redis** for BullMQ build jobs.
5. **Supabase project** for persistence.
6. Optional: **Supabase CLI** for migration-based database setup.

## Dependency installation

Standard install:

```bash
npm install
```

If your environment enforces a private npm mirror, run installs with an explicit registry override:

```bash
npm install --registry=$NPM_REGISTRY_URL
```

If installs fail with `403 Forbidden`, confirm your network policy allows access to your configured registry and that no global deprecated `http-proxy` npm config is injected. This repository ships a local `.npmrc` with explicit registry defaults so installs are deterministic.

## Environment setup

Create `.env.local` from the template:

```bash
npm run setup:copy-env
```

Then edit `.env.local` and fill the real values:

```env
# AI provider keys - server only. Do not prefix with NEXT_PUBLIC_.
QWEN_API_KEY=replace_with_qwen_key
DEEPSEEK_API_KEY=replace_with_deepseek_key
LLAMA_API_KEY=replace_with_llama_key
GEMINI_API_KEY=replace_with_gemini_key

# Supabase - server writes use the service role key. Never expose it in client code.
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_SERVICE_ROLE_KEY=replace_with_service_role_key
SUPABASE_GENERATIONS_TABLE=plugin_generations
SUPABASE_BUILD_JOBS_TABLE=plugin_build_jobs

# Redis/BullMQ build queue
REDIS_URL=redis://localhost:6379
BUILD_QUEUE_NAME=plugin-builds

# Build worker controls
BUILD_WORKER_CONCURRENCY=2
BUILD_MAX_ATTEMPTS=3
BUILD_TIMEOUT_MS=120000
BUILD_DOCKER_IMAGE=maven:3.9.9-eclipse-temurin-17
BUILD_DOCKER_MEMORY=768m
BUILD_DOCKER_CPUS=1.0
BUILD_ARTIFACT_DIR=/tmp/plugin-forge-artifacts
MAVEN_CACHE_VOLUME=plugin-forge-maven-cache
```

### Critical key safety rules

- `SUPABASE_SERVICE_ROLE_KEY` is **server-only** and must never be exposed to frontend JavaScript.
- Do **not** create `NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY`.
- `NEXT_PUBLIC_SUPABASE_URL` is only needed if you later add browser-side Supabase Auth. The current backend persistence path does not require it.
- The current API routes call Supabase from server modules only.

## Supabase setup tutorial

This section is the exact setup checklist for a production Supabase database.

### Step 1 — Create a Supabase project

1. Go to the Supabase dashboard.
2. Create a new project.
3. Open **Project Settings → API**.
4. Copy:
   - **Project URL** → put in `SUPABASE_URL`.
   - **service_role secret key** → put in `SUPABASE_SERVICE_ROLE_KEY`.

Example format:

```env
SUPABASE_URL=https://abcdefghijklmnop.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### Step 2 — Create database tables

You have two supported setup options.

#### Option A: Supabase SQL Editor (easiest)

1. Open Supabase dashboard.
2. Go to **SQL Editor**.
3. Open `supabase/migrations/001_core_schema.sql` from this repository.
4. Copy the entire SQL file.
5. Paste it into Supabase SQL Editor.
6. Click **Run**.

#### Option B: Supabase CLI

Install and authenticate the Supabase CLI, then run:

```bash
npm run supabase:link
npm run supabase:db:push
```

The `supabase:db:push` script applies the migration in `supabase/migrations/001_core_schema.sql`.

### Step 3 — Essential database tables

The migration creates these tables:

#### `plugin_generations`

Stores AI generation results, summaries, packages, validators, and review output.

| Column | Type | Required | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Primary ID for a generation row. Defaults to `gen_random_uuid()`. |
| `user_id` | `uuid` | no | Optional Supabase Auth user ID. Use this when accounts are added. This is the “uid/user_id” you usually connect dashboard rows to. |
| `request_id` | `text` | no | Optional external request trace ID. |
| `mode` | `text` | yes | Generation mode, e.g. `generate`, `dashboard_summary`, `knowledge_spec`, `project_packager`. |
| `prompt` | `text` | no | Original user prompt or idea. |
| `output` | `jsonb` | yes | Full structured AI response. |
| `score` | `integer` | no | Optional strict review score from `0` to `50`. |
| `verdict` | `text` | no | Optional `ACCEPT` or `IMPROVE`. |
| `created_at` | `timestamptz` | yes | Creation timestamp. |
| `updated_at` | `timestamptz` | yes | Auto-updated timestamp. |

#### `plugin_build_jobs`

Stores asynchronous Docker/Maven build state.

| Column | Type | Required | Purpose |
| --- | --- | --- | --- |
| `job_id` | `text` | yes | Queue/build ID. Primary key. |
| `user_id` | `uuid` | no | Optional Supabase Auth user ID for dashboard ownership. |
| `generation_id` | `uuid` | no | Optional link back to `plugin_generations.id`. |
| `status` | `text` | yes | One of `pending`, `processing`, `done`, `failed`. |
| `plugin_name` | `text` | yes | Human-readable plugin name. |
| `jar_location` | `text` | no | Local path or future object-storage path for compiled jar. |
| `error_log` | `text` | no | Truncated Maven/Docker error output if failed. |
| `metadata` | `jsonb` | yes | Additional job metadata such as attempts, name, queued timestamp. |
| `created_at` | `timestamptz` | yes | Creation timestamp. |
| `updated_at` | `timestamptz` | yes | Auto-updated timestamp. |

#### `plugin_artifacts`

Optional future artifact table for Supabase Storage/S3/R2 handoff.

| Column | Type | Required | Purpose |
| --- | --- | --- | --- |
| `id` | `uuid` | yes | Artifact ID. |
| `job_id` | `text` | yes | Linked build job. |
| `storage_provider` | `text` | yes | `local`, `supabase`, `s3`, `r2`, etc. |
| `storage_path` | `text` | yes | Artifact path or object key. |
| `sha256` | `text` | no | Optional checksum. |
| `size_bytes` | `bigint` | no | Optional artifact size. |
| `created_at` | `timestamptz` | yes | Creation timestamp. |

### What is `user_id` and is it essential?

- `user_id` is the Supabase Auth user UUID from `auth.users.id`.
- It is **optional right now** because this project can run without accounts.
- It becomes essential when you add dashboards, billing, saved projects, teams, or per-user history.
- If you do not have auth yet, leave `user_id` as `null` and store temporary UI/session metadata inside `metadata`.
- Do not use random browser strings in `user_id`; it is a UUID foreign key. Use `metadata.client_id` for anonymous UI tracking.

### RLS/security setup

The migration enables Row Level Security on all production tables. The current backend uses `SUPABASE_SERVICE_ROLE_KEY`, which bypasses RLS securely on the server.

Recommended production policy:

1. Keep tables private by default.
2. Let only backend API routes write rows with the service role key.
3. When you add login, create read policies like “users can read rows where `user_id = auth.uid()`”.
4. Never allow anonymous direct writes to `plugin_build_jobs`.

Example future authenticated read policy:

```sql
create policy "Users can read their generations"
on public.plugin_generations
for select
to authenticated
using (user_id = auth.uid());

create policy "Users can read their build jobs"
on public.plugin_build_jobs
for select
to authenticated
using (user_id = auth.uid());
```

## Redis and Docker setup

Start Redis locally with Docker:

```bash
npm run docker:redis
```

Create the Maven cache volume:

```bash
npm run docker:maven-cache
```

The worker runs Docker builds with:

- `--network none`
- memory limit from `BUILD_DOCKER_MEMORY`
- CPU limit from `BUILD_DOCKER_CPUS`
- PID limit `256`
- `--security-opt no-new-privileges`
- Maven cache volume mounted at `/root/.m2`

Because build containers run with `--network none`, pre-warm the Maven cache volume before production if you require fully offline builds. A simple warmup approach is to temporarily run a trusted Maven build with network enabled against the same `MAVEN_CACHE_VOLUME`, then switch workers back to network-disabled mode.

## Running the app

Start the Next.js app:

```bash
npm run dev
```

Start one build worker in another terminal:

```bash
npm run worker:build
```

For more throughput, run multiple workers on multiple machines using the same Redis and Supabase environment variables.

## API endpoints

### Generate / package / validate

```http
POST /api/generate
```

Standard generation body:

```json
{
  "prompt": "A premium guild territory warfare plugin with seasonal progression"
}
```

Special modes:

- `dashboard_summary`
- `knowledge_spec`
- `project_packager`
- `project_validator`
- `maven_project_packager`
- `maven_build_fixer`

Example Maven package request:

```json
{
  "mode": "maven_project_packager",
  "code": "generated plugin code",
  "spec": "developer specification"
}
```

### Enqueue a jar build

```http
POST /build
POST /api/build
```

Body:

```json
{
  "files": [
    { "path": "pom.xml", "content": "..." },
    { "path": "src/main/java/com/example/Main.java", "content": "..." },
    { "path": "plugin.yml", "content": "..." },
    { "path": "config.yml", "content": "..." }
  ],
  "metadata": {
    "id": "optional-stable-job-id",
    "name": "PluginName",
    "client_id": "anonymous-ui-session-id",
    "generation_id": "optional-plugin-generations-uuid"
  }
}
```

Response:

```json
{
  "id": "job-id",
  "status": "pending",
  "name": "PluginName"
}
```

### Check build status

```http
GET /build/status?id=<job_id>
GET /api/build/status?id=<job_id>
```

Done response example:

```json
{
  "job_id": "job-id",
  "status": "done",
  "plugin_name": "PluginName",
  "jar_location": "/tmp/plugin-forge-artifacts/job-id-plugin.jar",
  "error_log": null,
  "metadata": { "attempts": 1 }
}
```

Failed response example:

```json
{
  "job_id": "job-id",
  "status": "failed",
  "plugin_name": "PluginName",
  "jar_location": null,
  "error_log": "Maven/Docker error log...",
  "metadata": { "attempts": 3, "auto_fix_applied": false }
}
```

## Production deployment checklist

- [ ] Fill `.env.local` or platform secrets with all server-only variables.
- [ ] Run the Supabase migration.
- [ ] Confirm `plugin_generations` and `plugin_build_jobs` exist in Supabase Table Editor.
- [ ] Start Redis with persistence/backups in production.
- [ ] Run at least one build worker separate from the web process.
- [ ] Configure Docker permissions only on worker hosts, not public web hosts if possible.
- [ ] Pre-warm Maven cache for network-disabled builds.
- [ ] Move `BUILD_ARTIFACT_DIR` to persistent storage or upload jars to object storage.
- [ ] Add Supabase Auth and `user_id` assignment before launching paid dashboards.
- [ ] Add rate limiting and billing quotas before public launch.
- [ ] Monitor queue depth, worker failures, build duration, and Supabase insert failures.

## Troubleshooting

### `npm install` returns 403

Use your allowed registry:

```bash
npm install --registry=$NPM_REGISTRY_URL
```

If it still fails, the registry/network policy is external to this repository.

### Build status is `unknown`

Supabase is not configured. Set:

```env
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_BUILD_JOBS_TABLE=plugin_build_jobs
```

Then restart the Next.js server and worker.

### Worker cannot connect to Redis

Start Redis and verify `REDIS_URL`:

```bash
npm run docker:redis
```

### Docker build fails because dependencies cannot download

The worker intentionally uses `--network none`. Pre-warm `MAVEN_CACHE_VOLUME` with trusted dependencies, or temporarily allow network only in a controlled warmup job.

## Notes for future billion-scale hardening

The current architecture is ready to scale horizontally, but paid production should add:

- Supabase Auth with `user_id` saved on every generation/build row.
- Object storage for jars instead of local artifact paths.
- Per-user quotas and rate limits.
- Queue metrics dashboards.
- Dead-letter queue handling.
- Signed download URLs.
- Structured logs and trace IDs.
- CI that runs syntax checks, unit tests, and worker integration tests.
