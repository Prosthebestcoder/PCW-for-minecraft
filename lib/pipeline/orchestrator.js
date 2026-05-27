export { runOrchestrator as runPipeline } from '@/pipeline/orchestrator';
import { runWithLoop } from '@/lib/pipeline/loop';

export async function runPipeline({ prompt }) {
  const response = await runWithLoop({ prompt });
  return {
    ...response,
    meta: {
      product: 'AI Minecraft Plugin Forge',
      pipelineVersion: '1.0.0',
      generatedAt: new Date().toISOString(),
    },
  };
}
