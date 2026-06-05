import { Queue } from 'bullmq';
import { randomUUID } from 'crypto';
import { BUILD_QUEUE_NAME, getRedisConnection } from './config';

let queue;

export function getBuildQueue() {
  if (!queue) {
    queue = new Queue(BUILD_QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 1,
        backoff: { type: 'exponential', delay: 5000 },
        removeOnComplete: { age: 60 * 60 * 24, count: 1000 },
        removeOnFail: { age: 60 * 60 * 24 * 7, count: 5000 },
      },
    });
  }

  return queue;
}

export async function enqueueBuildJob({ files, metadata = {} }) {
  const jobId = metadata.id || randomUUID();
  const pluginName = metadata.name || 'GeneratedPlugin';
  const job = await getBuildQueue().add(
    'docker-maven-build',
    {
      files,
      metadata: {
        ...metadata,
        id: jobId,
        name: pluginName,
        queued_at: new Date().toISOString(),
      },
    },
    { jobId },
  );

  return {
    id: job.id,
    status: 'pending',
    name: pluginName,
  };
}
