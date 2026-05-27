import { NextResponse } from 'next/server';
import { buildDashboardSummary, buildKnowledgeSpec, runOrchestrator } from '@/pipeline/orchestrator';
import { insertGeneration, isSupabaseConfigured } from '@/lib/supabase';

export async function POST(request) {
  try {
    const body = await request.json();
    const mode = body?.mode;

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
        });
      }

      return NextResponse.json(payload);
    }

    if (mode === 'knowledge_spec') {
      const spec = await buildKnowledgeSpec({
        knowledge: body?.knowledge,
        idea: body?.idea,
      });
      return NextResponse.json({ specification: spec });
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
