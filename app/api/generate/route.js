import { NextResponse } from 'next/server';
import {
  buildDashboardSummary,
  buildKnowledgeSpec,
  buildProjectPackage,
  runOrchestrator,
  validateProjectPackage,
  buildMavenProjectPackage,
  fixMavenBuild,
} from '@/pipeline/orchestrator';
import { insertGeneration, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const mode = body?.mode;
    const userId = body?.user_id || body?.userId || null;
    const requestId = body?.request_id || body?.requestId || null;

    if (mode === 'dashboard_summary') {
      const payload = await buildDashboardSummary({
        idea: body?.idea,
        spec: body?.spec,
        code: body?.code,
        score: body?.score,
      });

      if (isSupabaseConfigured()) {
        await insertGeneration({
          mode,
          prompt: body?.idea || null,
          output: payload,
          user_id: userId,
          request_id: requestId,
          score: Number.isFinite(Number(payload?.score)) ? Number(payload.score) : null,
        });
      }

      return NextResponse.json(payload);
    }

    if (mode === 'knowledge_spec') {
      if (!body?.idea?.trim()) {
        return NextResponse.json({ error: 'Idea is required for knowledge_spec mode.' }, { status: 400 });
      }

      const spec = await buildKnowledgeSpec({
        knowledge: body?.knowledge,
        idea: body?.idea,
      });
      return NextResponse.json({ specification: spec });
    }

    if (mode === 'project_packager') {
      const packaged = await buildProjectPackage({
        code: body?.code,
        spec: body?.spec,
      });
      return NextResponse.json(packaged);
    }

    if (mode === 'project_validator') {
      const result = await validateProjectPackage({
        files: body?.files,
      });
      return NextResponse.json(result);
    }

    if (mode === 'maven_project_packager') {
      const packaged = await buildMavenProjectPackage({
        code: body?.code,
        spec: body?.spec,
      });
      return NextResponse.json(packaged);
    }

    if (mode === 'maven_build_fixer') {
      const fixed = await fixMavenBuild({
        error: body?.error,
        files: body?.files,
      });
      return NextResponse.json(fixed);
    }

    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const result = await runOrchestrator({ prompt });

    if (isSupabaseConfigured()) {
      await insertGeneration({
        mode: 'generate',
        prompt,
        output: result,
        user_id: userId,
        request_id: requestId,
        score: Number.isFinite(Number(result?.score)) ? Number(result.score) : null,
        verdict: result?.verdict || null,
      });
    }

    if (result?.status === 'needs_clarification') {
      return NextResponse.json(result, { status: 422 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Pipeline execution failed.',
        details: error.message,
      },
      { status: 500 },
    );
  }
}
