import { NextResponse } from 'next/server';
import { runPipeline } from '@/lib/pipeline/orchestrator';

export async function POST(request) {
  try {
    const body = await request.json();
    const prompt = body?.prompt?.trim();

    if (!prompt) {
      return NextResponse.json({ error: 'Prompt is required.' }, { status: 400 });
    }

    const result = await runPipeline({ prompt });
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
