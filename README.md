# PCW-for-minecraft
By beondspace


## Dependency installation

If your environment enforces a private npm mirror, run installs with an explicit registry override:

```bash
npm install --registry=$NPM_REGISTRY_URL
```

If installs fail with `403 Forbidden`, confirm your network policy allows access to your configured registry and that no global deprecated `http-proxy` npm config is injected. This repository ships a local `.npmrc` with explicit registry defaults so installs are deterministic.

## Environment Variables

Create/update `.env.local` with server-only API keys:

```
QWEN_API_KEY=...
DEEPSEEK_API_KEY=...
LLAMA_API_KEY=...
GEMINI_API_KEY=...
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...
SUPABASE_GENERATIONS_TABLE=plugin_generations
```

These keys are only accessed in backend route/pipeline modules and are never sent to the frontend.

## Supabase connection

The API route can persist generation outputs to Supabase when `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set.

Expected table schema (example):

- `id` uuid primary key default `gen_random_uuid()`
- `mode` text
- `prompt` text
- `output` jsonb
- `created_at` timestamptz default `now()`
