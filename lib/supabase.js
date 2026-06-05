const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const SUPABASE_GENERATIONS_TABLE = process.env.SUPABASE_GENERATIONS_TABLE || 'plugin_generations';
const SUPABASE_BUILD_JOBS_TABLE = process.env.SUPABASE_BUILD_JOBS_TABLE || 'plugin_build_jobs';

export function isSupabaseConfigured() {
  return Boolean(SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY);
}

function buildEndpoint(table, query = '') {
  return `${SUPABASE_URL.replace(/\/$/, '')}/rest/v1/${table}${query}`;
}


function isUuid(value) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

function normalizeSupabasePayload(payload) {
  const normalized = { ...payload };
  if ('user_id' in normalized) normalized.user_id = isUuid(normalized.user_id) ? normalized.user_id : null;
  if ('generation_id' in normalized) normalized.generation_id = isUuid(normalized.generation_id) ? normalized.generation_id : null;
  return normalized;
}

function supabaseHeaders(prefer = 'return=minimal') {
  return {
    apikey: SUPABASE_SERVICE_ROLE_KEY,
    Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json',
    Prefer: prefer,
  };
}

export async function insertGeneration(payload) {
  if (!isSupabaseConfigured()) return { skipped: true, reason: 'missing_env' };

  const response = await fetch(buildEndpoint(SUPABASE_GENERATIONS_TABLE), {
    method: 'POST',
    headers: supabaseHeaders(),
    body: JSON.stringify(normalizeSupabasePayload(payload)),
    cache: 'no-store',
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase insert failed (${response.status}): ${details}`);
  }

  return { ok: true };
}

export async function upsertBuildResult(payload) {
  if (!isSupabaseConfigured()) return { skipped: true, reason: 'missing_env' };

  const response = await fetch(buildEndpoint(SUPABASE_BUILD_JOBS_TABLE, '?on_conflict=job_id'), {
    method: 'POST',
    headers: supabaseHeaders('resolution=merge-duplicates,return=minimal'),
    body: JSON.stringify(normalizeSupabasePayload({ ...payload, updated_at: new Date().toISOString() })),
    cache: 'no-store',
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase build upsert failed (${response.status}): ${details}`);
  }

  return { ok: true };
}

export async function getBuildResult(jobId) {
  if (!isSupabaseConfigured()) return null;

  const query = `?job_id=eq.${encodeURIComponent(jobId)}&select=*&limit=1`;
  const response = await fetch(buildEndpoint(SUPABASE_BUILD_JOBS_TABLE, query), {
    method: 'GET',
    headers: supabaseHeaders('return=representation'),
    cache: 'no-store',
  });

  if (!response.ok) {
    const details = await response.text();
    throw new Error(`Supabase build lookup failed (${response.status}): ${details}`);
  }

  const rows = await response.json();
  return rows?.[0] || null;
}
