import { NextResponse } from 'next/server';
import { enqueueBuildJob } from './queue';
import { getBuildResult, isSupabaseConfigured, upsertBuildResult } from '@/lib/supabase';

export const runtime = 'nodejs';

export async function enqueueBuildRequest(request) {
  try {
    const body = await request.json();
    const files = body?.files;
    const metadata = body?.metadata || {};

    if (!Array.isArray(files) || files.length === 0) {
      return NextResponse.json({ error: 'files must be a non-empty array.' }, { status: 400 });
    }

    const job = await enqueueBuildJob({ files, metadata });

    if (isSupabaseConfigured()) {
      await upsertBuildResult({
        job_id: job.id,
        status: 'pending',
        plugin_name: job.name,
        jar_location: null,
        error_log: null,
        metadata,
        user_id: metadata?.user_id || metadata?.userId || null,
        generation_id: metadata?.generation_id || metadata?.generationId || null,
      });
    }

    return NextResponse.json(job, { status: 202 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to enqueue build job.', details: error.message }, { status: 500 });
  }
}

export async function getBuildStatusRequest(request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'id query parameter is required.' }, { status: 400 });
  }

  if (!isSupabaseConfigured()) {
    return NextResponse.json({
      job_id: id,
      status: 'unknown',
      warning: 'Supabase is not configured; persistent build status is unavailable.',
    });
  }

  const result = await getBuildResult(id);
  if (!result) {
    return NextResponse.json({ error: 'Build job not found.' }, { status: 404 });
  }

  return NextResponse.json(result);
}
