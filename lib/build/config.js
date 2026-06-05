export const BUILD_QUEUE_NAME = process.env.BUILD_QUEUE_NAME || 'plugin-builds';
export const BUILD_MAX_ATTEMPTS = Number(process.env.BUILD_MAX_ATTEMPTS || 3);
export const BUILD_ARTIFACT_DIR = process.env.BUILD_ARTIFACT_DIR || '/tmp/plugin-forge-artifacts';

export function getRedisConnection() {
  const url = process.env.REDIS_URL;
  if (url) return { url };

  return {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: Number(process.env.REDIS_PORT || 6379),
    password: process.env.REDIS_PASSWORD || undefined,
  };
}
